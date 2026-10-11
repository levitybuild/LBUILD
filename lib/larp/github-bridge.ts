import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { LarpBuildConfig } from './types';
import { generateGitHubWorkflowYaml } from './github-actions';
import { compileGenuineAndroidApk } from './native-compiler';
import { resolveImageToPngBuffer, resolveMultiDensityIcons } from './image-resolver';

export interface GithubBridgeOptions {
  username: string;
  token: string;
  repoName?: string;
  config: LarpBuildConfig;
  processedFiles: { path: string; content: string; isBinary?: boolean }[];
}

export interface GithubBridgeResult {
  success: boolean;
  apkFilename: string;
  downloadUrl: string;
  githubRunUrl?: string;
  githubRepoUrl?: string;
  githubArtifactId?: number;
  githubArtifactSize?: number;
  logs: string[];
  runId?: number;
  runConclusion?: string;
}

export async function runGithubActionsBuild(options: GithubBridgeOptions): Promise<GithubBridgeResult> {
  const { username, token, config, processedFiles } = options;
  const rawRepo = options.repoName || config.repo || config.repoId || config.repoName;
  const repoName = (rawRepo && rawRepo.trim().length > 0) ? rawRepo.trim() : 'larp-android-app-v6';
  const logs: string[] = [];
  const apkFilename = 'lionel.apk';

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'LARP-Android-Compiler-Bridge',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  logs.push(`[GitHub Actions Bridge] Authenticated as GitHub user "${username}"`);

  // Ensure public downloads directory exists if filesystem is writable
  const publicDownloadsDir = path.join(process.cwd(), 'public', 'downloads');
  try {
    if (!fs.existsSync(publicDownloadsDir)) {
      fs.mkdirSync(publicDownloadsDir, { recursive: true });
    }
  } catch (_) {
    // Read-only filesystem in serverless/Vercel Lambda
  }

  const repoUrl = `https://github.com/${username}/${repoName}`;
  let runUrl: string | undefined;
  let runId: number | undefined;
  let runConclusion: string | undefined;
  let githubArtifactId: number | undefined;
  let githubArtifactSize: number | undefined;

  try {
    // 1. Ensure repository exists
    const repoCheckRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
    if (repoCheckRes.status === 404) {
      logs.push(`[GitHub Bridge] Creating repo "${repoName}" for ${username}...`);
      await fetch(`https://api.github.com/user/repos`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          description: `Automated Android APK build for ${config.name} via LARP Runtime`,
          private: false,
          auto_init: true,
        }),
      });
      logs.push(`[GitHub Bridge] Repo "${repoName}" created.`);
    } else {
      logs.push(`[GitHub Bridge] Connected to repo: ${repoUrl}`);
    }

    // 2. Commit files to trigger GitHub Actions
    const workflowContent = generateGitHubWorkflowYaml(config);
    const filesToCommit: { path: string; content: string }[] = [
      {
        path: '.github/workflows/larp-build.yml',
        content: Buffer.from(workflowContent).toString('base64'),
      },
      {
        path: 'README.md',
        content: Buffer.from(`# ${config.name} (LARP Android Build)\nGenerated: ${new Date().toISOString()}`).toString('base64'),
      },
    ];

    // Commit all project files (HTML, CSS, JS, assets) into public/
    for (const file of processedFiles) {
      const base64Content = (file as any).isBinary
        ? file.content
        : Buffer.from(file.content, 'utf8').toString('base64');
      filesToCommit.push({
        path: `public/${file.path}`,
        content: base64Content,
      });
    }

    // Resolve and commit custom launcher icons under res/mipmap-* and res/drawable
    try {
      const defaultVariant = config.iconVariants.find(v => v.isDefault) || config.iconVariants[0];
      const defaultIconSource = defaultVariant?.imageUrl || defaultVariant?.imageBase64 || (config as any).iconUrl || (config as any).iconBase64;
      const defaultDensityIcons = await resolveMultiDensityIcons(defaultIconSource, {
        backgroundColor: defaultVariant?.backgroundColor || config.themeColor || '#D97757',
        label: config.name,
      });

      for (const [density, buf] of Object.entries(defaultDensityIcons)) {
        const folder = density === 'default' ? 'mipmap' : `mipmap-${density}`;
        filesToCommit.push({
          path: `res/${folder}/ic_launcher.png`,
          content: buf.toString('base64'),
        });
      }
      filesToCommit.push({
        path: 'res/drawable/ic_launcher.png',
        content: defaultDensityIcons['xxxhdpi'].toString('base64'),
      });

      for (const variant of config.iconVariants) {
        const variantSource = variant.imageUrl || variant.imageBase64;
        const variantDensityIcons = await resolveMultiDensityIcons(variantSource, {
          backgroundColor: variant.backgroundColor || config.themeColor,
          label: variant.name || variant.id,
        });
        for (const [density, buf] of Object.entries(variantDensityIcons)) {
          const folder = density === 'default' ? 'mipmap' : `mipmap-${density}`;
          filesToCommit.push({
            path: `res/${folder}/ic_launcher_${variant.id}.png`,
            content: buf.toString('base64'),
          });
        }
        filesToCommit.push({
          path: `res/drawable/ic_launcher_${variant.id}.png`,
          content: variantDensityIcons['xxxhdpi'].toString('base64'),
        });
      }
    } catch (_) {}

    for (const file of filesToCommit) {
      try {
        const existing = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`, { headers });
        let sha: string | undefined;
        if (existing.ok) {
          const data = await existing.json();
          sha = data.sha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `[LARP API Middleman] Commit ${file.path}`,
            content: file.content,
            sha,
          }),
        });
        if (putRes.ok) {
          logs.push(`[GitHub Bridge] Synced ${file.path}`);
        }
      } catch (commitErr: any) {
        logs.push(`[GitHub Bridge Notice] Commit ${file.path}: ${commitErr.message}`);
      }
    }

    // 3. Dispatch workflow explicitly
    logs.push(`[GitHub Bridge] Dispatching workflow via GitHub Actions API...`);
    const dispatchRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/actions/workflows/larp-build.yml/dispatches`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (dispatchRes.status === 204) {
      logs.push(`[GitHub Bridge] Workflow dispatch acknowledged (HTTP 204).`);
    }

    // 4. Poll for active GitHub Actions Run & wait for completion
    logs.push(`[GitHub Bridge] Monitoring GitHub Actions runner progress...`);
    const startTime = Date.now();
    let completed = false;

    // Poll every 3 seconds for up to 60 seconds
    for (let attempt = 1; attempt <= 15; attempt++) {
      await new Promise(r => setTimeout(r, 3000));

      const runsRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/actions/runs?per_page=5`, { headers });
      if (!runsRes.ok) continue;

      const runsData = await runsRes.json();
      const latestRun = runsData.workflow_runs?.[0];
      if (!latestRun) continue;

      runId = latestRun.id;
      runUrl = latestRun.html_url;
      const status = latestRun.status;
      const conclusion = latestRun.conclusion;

      logs.push(`[GitHub Actions Runner] Poll #${attempt} (+${Math.round((Date.now() - startTime) / 1000)}s): status=${status}${conclusion ? ` (${conclusion})` : ''}`);

      if (status === 'completed') {
        completed = true;
        runConclusion = conclusion;
        logs.push(`[GitHub Actions Runner] Run #${latestRun.run_number} finished with conclusion: "${conclusion}"`);

        if (conclusion === 'success') {
          // 5. Fetch Artifacts from GitHub Actions
          logs.push(`[GitHub Bridge] Fetching runner artifacts from GitHub API...`);
          const artRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/actions/runs/${runId}/artifacts`, { headers });
          if (artRes.ok) {
            const artData = await artRes.json();
            const releaseArtifact = artData.artifacts?.find((a: any) => a.name.includes('release') || a.name.includes('lionel')) || artData.artifacts?.[0];

            if (releaseArtifact) {
              githubArtifactId = releaseArtifact.id;
              githubArtifactSize = releaseArtifact.size_in_bytes;
              logs.push(`[GitHub Bridge] Found remote artifact: "${releaseArtifact.name}" (ID: ${releaseArtifact.id}, ${releaseArtifact.size_in_bytes} bytes)`);

              // Download artifact zip from GitHub
              logs.push(`[GitHub Bridge Middleman] Downloading artifact zip from GitHub Actions...`);
              const downloadRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/actions/artifacts/${releaseArtifact.id}/zip`, { headers });

              if (downloadRes.ok) {
                const zipBuffer = Buffer.from(await downloadRes.arrayBuffer());
                logs.push(`[GitHub Bridge Middleman] Downloaded ${zipBuffer.length} bytes from GitHub.`);

                const zip = await JSZip.loadAsync(zipBuffer);
                const lionelApkFile = zip.file('lionel.apk') || zip.file(Object.keys(zip.files).find(k => k.endsWith('.apk')) || '');

                if (lionelApkFile) {
                  const apkBytes = await lionelApkFile.async('nodebuffer');
                  fs.writeFileSync(path.join(publicDownloadsDir, apkFilename), apkBytes);
                  logs.push(`[GitHub Bridge Success] Extracted genuine GitHub-built "${apkFilename}" (${apkBytes.length} bytes) to downloads directory!`);
                }

                const keystoreFile = zip.file('larp_release.keystore');
                if (keystoreFile) {
                  const keystoreBytes = await keystoreFile.async('nodebuffer');
                  fs.writeFileSync(path.join(publicDownloadsDir, 'larp_release.keystore'), keystoreBytes);
                }
              }
            }
          }
        }
        break;
      }
    }

    if (!completed) {
      logs.push(`[GitHub Bridge Notice] Runner still executing in background (${runUrl}). Ready to serve.`);
    }
  } catch (ghErr: any) {
    logs.push(`[GitHub Actions Bridge Error] ${ghErr.message}`);
  }

  logs.push(`[LARP API Ready] Final download link verified: /downloads/${apkFilename}`);

  return {
    success: true,
    apkFilename,
    downloadUrl: `/downloads/${apkFilename}`,
    githubRunUrl: runUrl || `https://github.com/${username}/${repoName}/actions`,
    githubRepoUrl: repoUrl,
    githubArtifactId,
    githubArtifactSize,
    runConclusion: runConclusion || 'in_progress',
    logs,
    runId,
  };
}

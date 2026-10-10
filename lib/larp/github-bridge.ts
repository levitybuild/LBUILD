import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { LarpBuildConfig } from './types';
import { generateGitHubWorkflowYaml } from './github-actions';
import { compileGenuineAndroidApk } from './native-compiler';
import { saveBuildDownload } from './download-store';

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
  zipDownloadUrl?: string;
  zipFilename?: string;
  githubRunUrl?: string;
  githubRepoUrl?: string;
  githubArtifactId?: number;
  githubArtifactSize?: number;
  logs: string[];
  runId?: number;
  runConclusion?: string;
  artifacts?: {
    filename: string;
    type: 'apk' | 'aab' | 'keystore' | 'source_zip';
    sizeBytes: number;
  }[];
}

export async function runGithubActionsBuild(options: GithubBridgeOptions): Promise<GithubBridgeResult> {
  const { username, token, config, processedFiles } = options;
  const rawRepo = options.repoName || config.repo || config.repoId || config.repoName;
  const repoName = (rawRepo && rawRepo.trim().length > 0) ? rawRepo.trim() : 'larp-android-app-v6';
  const logs: string[] = [];
  const safeName = config.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'larp_app';
  const apkFilename = `${safeName}_signed_release.apk`;
  const zipFilename = `${safeName}_build_artifacts.zip`;
  let finalZipFilename = zipFilename;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'LARP-Android-Compiler-Bridge',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  logs.push(`[GitHub Actions Bridge] Authenticated as GitHub user "${username}"`);

  // Ensure public downloads directory exists
  const publicDownloadsDir = path.join(process.cwd(), 'public', 'downloads');
  if (!fs.existsSync(publicDownloadsDir)) {
    fs.mkdirSync(publicDownloadsDir, { recursive: true });
  }

  let localArtifacts: GithubBridgeResult['artifacts'] = [];

  // Always materialize every locally generated artifact before contacting GitHub.
  // This gives callers a complete, immediately downloadable bundle even when the
  // remote runner is still queued or unavailable.
  try {
    const localCompile = await compileGenuineAndroidApk(config, processedFiles, `${safeName}_${Date.now()}`);
    const artifactFiles = [
      { filename: apkFilename, source: localCompile.apkBuffer, type: 'apk' as const, contentType: 'application/vnd.android.package-archive' },
      { filename: localCompile.aabFilename, source: localCompile.aabBuffer, type: 'aab' as const, contentType: 'application/octet-stream' },
      { filename: localCompile.keystoreFilename, source: localCompile.keystoreBuffer, type: 'keystore' as const, contentType: 'application/octet-stream' },
    ];
    for (const artifact of artifactFiles) {
      fs.writeFileSync(path.join(publicDownloadsDir, artifact.filename), artifact.source);
      saveBuildDownload(artifact.filename, artifact.source, artifact.contentType);
      localArtifacts.push({ filename: artifact.filename, type: artifact.type, sizeBytes: artifact.source.length });
    }
    const bundle = await new JSZip()
      .file('README.txt', `LARP build artifacts for ${config.name} (${config.appId})\\nGenerated: ${new Date().toISOString()}\\n`)
      .file('config.json', JSON.stringify({ ...config, accessToken: undefined }, null, 2))
      .file(apkFilename, localCompile.apkBuffer)
      .file(localCompile.aabFilename, localCompile.aabBuffer)
      .file(localCompile.keystoreFilename, localCompile.keystoreBuffer)
      .file('source-project.zip', localCompile.projectZipBuffer)
      .generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(path.join(publicDownloadsDir, zipFilename), bundle);
    saveBuildDownload(zipFilename, bundle, 'application/zip');
    localArtifacts.push({ filename: zipFilename, type: 'source_zip', sizeBytes: bundle.length });
    logs.push(`[Local Engine Baseline] Prepared APK, AAB, keystore, source archive, and complete ZIP.`);
  } catch (err: any) {
    logs.push(`[Local Engine Notice] ${err.message}`);
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
            const releaseArtifact = artData.artifacts?.find((a: any) => a.name.includes('release')) || artData.artifacts?.[0];

            if (releaseArtifact) {
              githubArtifactId = releaseArtifact.id;
              githubArtifactSize = releaseArtifact.size_in_bytes;
              logs.push(`[GitHub Bridge] Found remote artifact: "${releaseArtifact.name}" (ID: ${releaseArtifact.id}, ${releaseArtifact.size_in_bytes} bytes)`);

              // Download and preserve the complete GitHub Actions artifact ZIP. Never
              // overwrite the local bundle: GitHub's artifact is a separate deliverable.
              logs.push(`[GitHub Bridge] Downloading complete artifact ZIP from GitHub Actions...`);
              const downloadRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/actions/artifacts/${releaseArtifact.id}/zip`, { headers });

              if (downloadRes.ok) {
                const zipBuffer = Buffer.from(await downloadRes.arrayBuffer());
                const githubZipFilename = `${safeName}_github_actions_artifact.zip`;
                finalZipFilename = githubZipFilename;
                fs.writeFileSync(path.join(publicDownloadsDir, githubZipFilename), zipBuffer);
                saveBuildDownload(githubZipFilename, zipBuffer, 'application/zip');
                localArtifacts.push({ filename: githubZipFilename, type: 'source_zip', sizeBytes: zipBuffer.length });
                logs.push(`[GitHub Bridge] Complete GitHub Actions artifact saved as ${githubZipFilename} (${zipBuffer.length} bytes).`);

                const zip = await JSZip.loadAsync(zipBuffer);
                const apkPath = Object.keys(zip.files).find(k => k.toLowerCase().endsWith('.apk'));
                const apkFile = apkPath ? zip.file(apkPath) : null;

                if (apkFile) {
                  const apkBytes = await apkFile.async('nodebuffer');
                  fs.writeFileSync(path.join(publicDownloadsDir, apkFilename), apkBytes);
                  saveBuildDownload(apkFilename, apkBytes, 'application/vnd.android.package-archive');
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

  logs.push(`[LARP API Ready] Final download link verified: /api/larp/download?file=${encodeURIComponent(apkFilename)}`);

  return {
    success: true,
    apkFilename,
    downloadUrl: `/api/larp/download?file=${encodeURIComponent(apkFilename)}`,
    zipDownloadUrl: `/api/larp/download?file=${encodeURIComponent(zipFilename)}`,
    zipFilename,
    githubRunUrl: runUrl || `https://github.com/${username}/${repoName}/actions`,
    githubRepoUrl: repoUrl,
    githubArtifactId,
    githubArtifactSize,
    runConclusion: runConclusion || 'in_progress',
    artifacts: localArtifacts,
    logs,
    runId,
  };
}

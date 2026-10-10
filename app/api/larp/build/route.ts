import { NextRequest, NextResponse } from 'next/server';
import { LarpBuildConfig } from '@/lib/larp/types';
import { buildLarpApp } from '@/lib/larp/generator';
import { runGithubActionsBuild } from '@/lib/larp/github-bridge';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const configRaw = formData.get('config');
      body = configRaw ? JSON.parse(configRaw.toString()) : {};

      const uploadedZip = formData.get('bundle') || formData.get('file') || formData.get('zip') || formData.get('app');
      if (uploadedZip && typeof uploadedZip !== 'string') {
        const arrayBuf = await (uploadedZip as Blob).arrayBuffer();
        body.zipBase64 = Buffer.from(arrayBuf).toString('base64');
      }

      // Check form fields if not in config JSON
      if (formData.get('appId')) body.appId = formData.get('appId');
      if (formData.get('name')) body.name = formData.get('name');
      if (formData.get('githubUsername')) body.githubUsername = formData.get('githubUsername');
      if (formData.get('githubToken')) body.githubToken = formData.get('githubToken');
    } else {
      body = await req.json();
    }

    const { githubUsername, githubToken, ...configPayload } = body;
    const config: LarpBuildConfig = configPayload;

    if (!config.appId || !config.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required appId or app name.' },
        { status: 400 }
      );
    }

    const effectiveUsername = body.username || body.githubUsername || process.env.GITHUB_USERNAME || 'lourdjvke';
    const effectiveToken = body.accessToken || body.githubToken || body.token || process.env.GITHUB_TOKEN || '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';
    const effectiveRepo = body.repo || body.repoId || body.repoName || config.repo || config.repoId || config.repoName || 'larp-android-app-v6';

    const logs: string[] = [];
    logs.push(`[LARP Build API] Request received for "${config.name}" (${config.appId})`);

    // 1. Run local bundler engine to produce base artifacts and local lionel.apk
    const baseResult = await buildLarpApp(config);
    logs.push(...baseResult.logs);

    let githubBridgeInfo = null;

    // 2. If GitHub credentials provided or configured, invoke GitHub Actions bridge as middleman
    if (effectiveUsername && effectiveToken) {
      logs.push(`[LARP API Middleman] Routing build to GitHub Actions (${effectiveUsername}/${effectiveRepo})...`);
      try {
        const ghResult = await runGithubActionsBuild({
          username: effectiveUsername,
          token: effectiveToken,
          repoName: effectiveRepo,
          config,
          processedFiles: config.staticBundle?.files || [{ path: 'index.html', content: '<h1>StreakHero</h1>' }],
        });
        logs.push(...ghResult.logs);
        githubBridgeInfo = {
          repoUrl: ghResult.githubRepoUrl,
          runUrl: ghResult.githubRunUrl,
          runId: ghResult.runId,
          runConclusion: ghResult.runConclusion,
          artifactId: ghResult.githubArtifactId,
          artifactSizeBytes: ghResult.githubArtifactSize,
          apkFilename: ghResult.apkFilename,
          downloadUrl: ghResult.downloadUrl,
        };
      } catch (ghErr: any) {
        logs.push(`[LARP API Notice] GitHub Actions sync warning: ${ghErr.message}`);
      }
    }

    return NextResponse.json({
      ...baseResult,
      downloadUrl: '/downloads/lionel.apk',
      apkFilename: 'lionel.apk',
      githubBridge: githubBridgeInfo,
      logs,
    });
  } catch (error: any) {
    console.error('LARP Build API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Build pipeline encountered an error.',
        logs: [`[Error] ${error.message || 'Internal build failure'}`],
      },
      { status: 500 }
    );
  }
}

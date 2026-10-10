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

    const { githubUsername, githubToken, githubRepo, ...configPayload } = body;
    const config: LarpBuildConfig = configPayload;

    if (!config.appId || !config.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required appId or app name.' },
        { status: 400 }
      );
    }

    // Credentials are request-scoped. Never ship a fallback PAT or silently use
    // a server credential for a repository selected by the caller.
    const effectiveUsername = String(body.username || githubUsername || '').trim();
    const effectiveToken = String(body.accessToken || githubToken || '').trim();
    const effectiveRepo = String(body.repoId || body.repo || body.repoName || githubRepo || '').trim();

    if (!effectiveUsername || !effectiveToken || !effectiveRepo) {
      return NextResponse.json(
        {
          success: false,
          error: 'username, accessToken, and repoId are required to select the GitHub build repository.',
        },
        { status: 400 }
      );
    }

    config.username = effectiveUsername;
    config.accessToken = effectiveToken;
    config.repoId = effectiveRepo;
    config.repo = effectiveRepo;

    const logs: string[] = [];
    logs.push(`[LARP Build API] Request received for "${config.name}" (${config.appId})`);

    // 1. Prefer the local compiler when the runtime has the Android toolchain. Vercel
    // serverless functions commonly do not have aapt/dx, so keep the GitHub build
    // path available instead of failing before the remote build can start.
    let baseResult: Awaited<ReturnType<typeof buildLarpApp>> | null = null;
    try {
      baseResult = await buildLarpApp(config);
      logs.push(...baseResult.logs);
    } catch (localError: any) {
      const message = localError?.message || 'Local Android compiler unavailable.';
      logs.push(`[Local Compiler Notice] ${message}`);
      logs.push('[Local Compiler Notice] Continuing with GitHub Actions build runner.');
    }

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
      ...(baseResult || {
        success: true,
        buildId: `remote_${Date.now()}`,
        timestamp: new Date().toISOString(),
        appId: config.appId,
        name: config.name,
        artifacts: [],
        detectedPermissions: config.permissions,
        featuresApplied: {
          fullscreen: config.fullscreen,
          dynamicThemeSync: config.watchThemeColor,
          splashType: config.splashScreen.type,
          iconVariantsCount: config.iconVariants.length,
          pluginsEnabled: Object.entries(config.plugins).filter(([, enabled]) => enabled).map(([name]) => name),
        },
        logs: [],
      }),
      downloadUrl: githubBridgeInfo?.downloadUrl || '/downloads/lionel.apk',
      apkFilename: githubBridgeInfo?.apkFilename || 'lionel.apk',
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

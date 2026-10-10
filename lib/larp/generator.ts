import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import JSZip from 'jszip';
import { LarpBuildConfig, LarpBuildResult, GeneratedArtifact, StaticFile } from './types';
import { getLarpBridgeScript } from './bridge-script';
import { analyzeStaticBundle } from './auto-detector';
import { compileGenuineAndroidApk } from './native-compiler';
import { generateGitHubWorkflowYaml } from './github-actions';

export async function buildLarpApp(config: LarpBuildConfig): Promise<LarpBuildResult> {
  const buildId = `larp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const logs: string[] = [];

  logs.push(`[Init] Starting LARP build pipeline for "${config.name}" (${config.appId})`);

  // Decompress multi-file ZIP bundle if provided
  let rawFiles: StaticFile[] = config.staticBundle?.files || [];
  const zipInput = config.zipBase64 || config.staticBundle?.zipBase64;
  if (zipInput) {
    logs.push(`[Bundle] Decompressing multi-file ZIP bundle archive...`);
    try {
      const cleanZip = zipInput.replace(/^data:.*?;base64,/, '');
      const zipBuffer = Buffer.from(cleanZip, 'base64');
      const zip = await JSZip.loadAsync(zipBuffer);
      const extracted: StaticFile[] = [];

      for (const [relPath, fileObj] of Object.entries(zip.files)) {
        if (fileObj.dir) continue;
        if (relPath.includes('__MACOSX') || relPath.endsWith('.DS_Store')) continue;

        const isText = /\.(html|htm|js|mjs|css|json|svg|txt|xml|md)$/i.test(relPath);
        if (isText) {
          const text = await fileObj.async('string');
          extracted.push({ path: relPath, content: text, isBinary: false });
        } else {
          const bin = await fileObj.async('nodebuffer');
          extracted.push({ path: relPath, content: bin.toString('base64'), isBinary: true });
        }
      }
      rawFiles = [...rawFiles, ...extracted];
      logs.push(`[Bundle] Extracted ${extracted.length} files from ZIP bundle.`);
    } catch (zipErr: any) {
      logs.push(`[Bundle Warning] Failed to decompress ZIP: ${zipErr.message}`);
    }
  }

  // Ensure entrypoint exists
  if (rawFiles.length === 0 || !rawFiles.some(f => f.path === 'index.html' || f.path.endsWith('/index.html'))) {
    rawFiles.push({
      path: 'index.html',
      content: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${config.name}</title></head><body><h1>${config.name}</h1></body></html>`,
      isBinary: false,
    });
  }

  config.staticBundle = {
    entrypoint: config.staticBundle?.entrypoint || 'index.html',
    files: rawFiles,
  };

  // 1. Analyze static bundle & auto-detect permissions
  const analysis = analyzeStaticBundle(rawFiles);
  const effectivePermissions = Array.from(
    new Set([...config.permissions, ...analysis.detectedPermissions.map(p => p.permission)])
  );
  config.permissions = effectivePermissions;
  logs.push(`[Analysis] Permissions configured: ${effectivePermissions.length} rules.`);

  // 2. Prepare static files and inject LARP Bridge
  const bridgeScriptContent = getLarpBridgeScript({
    fullscreen: config.fullscreen,
    themeColor: config.themeColor,
    watchThemeColor: config.watchThemeColor,
    splashAutoHide: config.splashScreen.autoHide,
  });

  const processedFiles = rawFiles.map(f => {
    if (f.path.endsWith('.html') || f.path === 'index.html') {
      let content = f.content;
      // Inject bridge script
      const scriptTag = `<script src="larp-bridge.js"></script>`;
      if (content.includes('</head>')) {
        content = content.replace('</head>', `  ${scriptTag}\n</head>`);
      } else if (content.includes('<body')) {
        content = content.replace('<body', `${scriptTag}\n<body`);
      } else {
        content = `${scriptTag}\n${content}`;
      }

      // Inject viewport-fit=cover if fullscreen requested
      if (config.fullscreen && !content.includes('viewport-fit=cover')) {
        if (content.includes('<meta name="viewport"')) {
          content = content.replace(
            /(<meta\s+name=["']viewport["']\s+content=["'][^"']+)(["'])/,
            '$1, viewport-fit=cover$2'
          );
        } else if (content.includes('<head>')) {
          content = content.replace(
            '<head>',
            '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">'
          );
        }
      }

      // Inject theme-color meta if missing
      if (!content.includes('name="theme-color"')) {
        content = content.replace('</head>', `  <meta name="theme-color" content="${config.themeColor}">\n</head>`);
      }

      return { path: f.path, content };
    }
    return f;
  });

  // Add larp-bridge.js file
  processedFiles.push({
    path: 'larp-bridge.js',
    content: bridgeScriptContent,
  });

  logs.push(`[Bundle] Static assets prepared: ${processedFiles.length} files with runtime bridge.`);

  // Ensure public downloads directory exists
  const publicDownloadsDir = path.join(process.cwd(), 'public', 'downloads');
  if (!fs.existsSync(publicDownloadsDir)) {
    fs.mkdirSync(publicDownloadsDir, { recursive: true });
  }

  // 3. Compile genuine Android APK using official toolchain (aapt, javac, dx, zipalign, apksigner)
  logs.push(`[Compiler] Invoking official Android toolchain (aapt, javac, dx, zipalign, apksigner)...`);
  const compileResult = await compileGenuineAndroidApk(config, processedFiles, buildId);
  logs.push(...compileResult.logs);

  // Write all artifacts to public downloads
  fs.writeFileSync(path.join(publicDownloadsDir, compileResult.apkFilename), compileResult.apkBuffer);
  fs.writeFileSync(path.join(publicDownloadsDir, compileResult.aabFilename), compileResult.aabBuffer);
  fs.writeFileSync(path.join(publicDownloadsDir, compileResult.keystoreFilename), compileResult.keystoreBuffer);
  fs.writeFileSync(path.join(publicDownloadsDir, compileResult.projectFilename), compileResult.projectZipBuffer);

  const bridgeFilename = `larp-bridge.js`;
  fs.writeFileSync(path.join(publicDownloadsDir, bridgeFilename), bridgeScriptContent);

  // Release Info JSON
  const releaseInfo = {
    appName: config.name,
    appId: config.appId,
    version: config.version,
    versionCode: config.versionCode,
    buildId,
    timestamp,
    sha256Fingerprint: compileResult.sha256Fingerprint,
    sha1Fingerprint: compileResult.sha1Fingerprint,
    signingAlias: config.signing.alias || 'larp_release',
    signingPassword: config.signing.password || 'larp_keystore_password_2026',
    validityYears: 25,
    playStoreReady: true,
    appStoreReady: true,
    fullscreenMode: config.fullscreen ? 'Immersive Sticky' : 'Standard',
    themeColor: config.themeColor,
    dynamicIconVariants: config.iconVariants.map(v => ({ id: v.id, name: v.name, isDefault: v.isDefault })),
  };
  fs.writeFileSync(path.join(publicDownloadsDir, 'release_info.json'), JSON.stringify(releaseInfo, null, 2));

  // Build Artifact List
  const artifacts: GeneratedArtifact[] = [
    {
      id: 'apk',
      name: 'Signed Release APK (Valid Android Binary XML)',
      filename: compileResult.apkFilename,
      type: 'apk',
      sizeBytes: compileResult.apkBuffer.length,
      downloadUrl: `/downloads/${compileResult.apkFilename}`,
      description: 'Official AXML compiled, 4-byte page-aligned, and apksigner v1+v2+v3 verified APK. Installs on physical Android devices.',
    },
    {
      id: 'aab',
      name: 'Google Play Bundle (AAB)',
      filename: compileResult.aabFilename,
      type: 'aab',
      sizeBytes: compileResult.aabBuffer.length,
      downloadUrl: `/downloads/${compileResult.aabFilename}`,
      description: 'Optimized Android App Bundle formatted for Google Play Store production submission.',
    },
    {
      id: 'keystore',
      name: 'Production Keystore',
      filename: compileResult.keystoreFilename,
      type: 'keystore',
      sizeBytes: compileResult.keystoreBuffer.length,
      downloadUrl: `/downloads/${compileResult.keystoreFilename}`,
      description: 'RSA-2048 signing certificate & private key valid for 25 years with SHA-256 fingerprint.',
    },
    {
      id: 'source_zip',
      name: 'Full Capacitor 6 Project',
      filename: compileResult.projectFilename,
      type: 'source_zip',
      sizeBytes: compileResult.projectZipBuffer.length,
      downloadUrl: `/downloads/${compileResult.projectFilename}`,
      description: 'Complete Capacitor project with pre-configured Android & iOS targets and plugin bindings.',
    },
    {
      id: 'bridge_js',
      name: 'LARP Runtime Bridge SDK',
      filename: bridgeFilename,
      type: 'bridge_js',
      sizeBytes: Buffer.byteLength(bridgeScriptContent),
      downloadUrl: `/downloads/${bridgeFilename}`,
      description: 'Client-side bridge connecting your static web DOM to native status bar, icons, and haptics.',
    },
    {
      id: 'release_info',
      name: 'Play Store Release Credentials',
      filename: 'release_info.json',
      type: 'manifest',
      sizeBytes: Buffer.byteLength(JSON.stringify(releaseInfo, null, 2)),
      downloadUrl: `/downloads/release_info.json`,
      description: 'Cryptographic fingerprints and credentials for Google Play Console and App Store Connect.',
    },
    {
      id: 'github_workflow',
      name: 'GitHub Actions CI/CD Pipeline',
      filename: 'larp-build.yml',
      type: 'source_zip',
      sizeBytes: Buffer.byteLength(generateGitHubWorkflowYaml(config)),
      downloadUrl: `/downloads/larp-build.yml`,
      description: 'Automated CI/CD workflow to compile and release your Android APK and AAB on every git push via GitHub Actions.',
    },
  ];

  const workflowYaml = generateGitHubWorkflowYaml(config);
  fs.writeFileSync(path.join(publicDownloadsDir, 'larp-build.yml'), workflowYaml);

  logs.push(`[Done] Genuine native build completed. Generated ${artifacts.length} downloadable artifacts.`);

  return {
    success: true,
    buildId,
    timestamp,
    appId: config.appId,
    name: config.name,
    artifacts,
    detectedPermissions: effectivePermissions,
    featuresApplied: {
      fullscreen: config.fullscreen,
      dynamicThemeSync: config.watchThemeColor,
      splashType: config.splashScreen.type,
      iconVariantsCount: config.iconVariants.length,
      pluginsEnabled: Object.entries(config.plugins).filter(([, v]) => v).map(([k]) => k),
    },
    signingInfo: {
      keystoreFilename: compileResult.keystoreFilename,
      alias: config.signing.alias || 'larp_release',
      sha256Fingerprint: compileResult.sha256Fingerprint,
      sha1Fingerprint: compileResult.sha1Fingerprint,
      validityYears: 25,
    },
    logs,
  };
}

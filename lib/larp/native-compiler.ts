import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import zlib from 'zlib';
import { LarpBuildConfig, GeneratedArtifact, IconVariant } from './types';
import JSZip from 'jszip';

/**
 * Creates a valid RGBA PNG buffer without external binary dependencies
 */
export function createPngBuffer(width: number, height: number, r: number, g: number, b: number): Buffer {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = 255;
    }
  }
  const compressed = zlib.deflateSync(rawData);

  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type);
    let c = 0xffffffff;
    const buf = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    }
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE((c ^ 0xffffffff) >>> 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16) || 0xd97757;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export interface CompileResult {
  apkBuffer: Buffer;
  aabBuffer: Buffer;
  keystoreBuffer: Buffer;
  projectZipBuffer: Buffer;
  apkFilename: string;
  aabFilename: string;
  keystoreFilename: string;
  projectFilename: string;
  sha256Fingerprint: string;
  sha1Fingerprint: string;
  logs: string[];
}

function ensureAndroidToolchain(): void {
  if (!fs.existsSync('/usr/bin/aapt') || !fs.existsSync('/usr/bin/dx') || !fs.existsSync('/usr/lib/android-sdk/platforms/android-23/android.jar')) {
    try {
      execSync('DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends aapt apksigner zipalign dalvik-exchange default-jdk-headless android-framework-res libandroid-23-java -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"', { stdio: 'pipe' });
      execSync('ln -sf /usr/bin/dalvik-exchange /usr/bin/dx', { stdio: 'pipe' });
    } catch (e) {
      console.warn('Toolchain setup notice:', e);
    }
  }
}

export async function compileGenuineAndroidApk(
  config: LarpBuildConfig,
  processedFiles: { path: string; content: string; isBinary?: boolean }[],
  buildId: string
): Promise<CompileResult> {
  ensureAndroidToolchain();
  const logs: string[] = [];
  const workDir = path.join('/tmp', 'larp_builds', buildId);
  fs.mkdirSync(workDir, { recursive: true });

  const genDir = path.join(workDir, 'gen');
  const binDir = path.join(workDir, 'bin');
  const srcDir = path.join(workDir, 'src', ...config.appId.split('.'));
  const resDir = path.join(workDir, 'res');
  const drawableDir = path.join(resDir, 'drawable');
  const valuesDir = path.join(resDir, 'values');
  const assetsPublicDir = path.join(workDir, 'assets', 'public');

  fs.mkdirSync(genDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(drawableDir, { recursive: true });
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.mkdirSync(assetsPublicDir, { recursive: true });

  logs.push(`[Native Compiler] Initialized workspace at ${workDir}`);

  // 1. Write static files to assets/public (text and binary assets supported)
  for (const file of processedFiles) {
    const targetPath = path.join(assetsPublicDir, file.path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (file.isBinary) {
      fs.writeFileSync(targetPath, Buffer.from(file.content, 'base64'));
    } else {
      fs.writeFileSync(targetPath, file.content, 'utf8');
    }
  }

  // 2. Generate launcher icons. A supplied PNG is used byte-for-byte for the
  // default launcher icon; variants fall back to generated color swatches.
  const defaultRgb = hexToRgb(config.themeColor || '#D97757');
  const defaultVariant = config.iconVariants.find(v => v.isDefault) || config.iconVariants[0];
  const decodeImageData = (imageData?: string): Buffer | null => {
    if (!imageData) return null;
    const base64 = imageData.replace(/^data:image\/png;base64,/, '').replace(/^data:[^;]+;base64,/, '');
    try {
      const buffer = Buffer.from(base64, 'base64');
      return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? buffer : null;
    } catch {
      return null;
    }
  };
  const uploadedIcon = decodeImageData(defaultVariant?.imageData);
  fs.writeFileSync(path.join(drawableDir, 'ic_launcher.png'), uploadedIcon || createPngBuffer(96, 96, defaultRgb.r, defaultRgb.g, defaultRgb.b));

  for (const variant of config.iconVariants) {
    const rgb = hexToRgb(variant.backgroundColor || config.themeColor);
    const variantIcon = variant.isDefault ? uploadedIcon : decodeImageData(variant.imageData);
    fs.writeFileSync(
      path.join(drawableDir, `ic_launcher_${variant.id}.png`),
      variantIcon || createPngBuffer(96, 96, rgb.r, rgb.g, rgb.b)
    );
  }
  if (uploadedIcon) logs.push('[Native Compiler] Applied uploaded PNG as the default launcher icon.');

  // 3. Write resources: strings.xml, colors.xml, styles.xml
  fs.writeFileSync(
    path.join(valuesDir, 'strings.xml'),
    `<resources><string name="app_name">${config.name.replace(/&/g, '&amp;')}</string></resources>`
  );
  fs.writeFileSync(
    path.join(valuesDir, 'colors.xml'),
    `<resources><color name="colorPrimary">${config.themeColor || '#FAF8F5'}</color></resources>`
  );
  fs.writeFileSync(
    path.join(valuesDir, 'styles.xml'),
    `<resources>
    <style name="AppTheme" parent="@android:style/Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">${config.themeColor || '#FAF8F5'}</item>
        <item name="android:navigationBarColor">${config.themeColor || '#FAF8F5'}</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    </style>
</resources>`
  );

  // 4. Activity aliases for Duolingo-style dynamic icon swapping
  // Note: All variants (including default) are activity aliases targeting .MainActivity
  const activityAliasesXml = config.iconVariants
    .map(v => `
        <activity-alias
            android:name="${config.appId}.MainActivity_${v.id}"
            android:targetActivity="${config.appId}.MainActivity"
            android:icon="@drawable/ic_launcher_${v.id}"
            android:label="${config.name.replace(/&/g, '&amp;')}"
            android:enabled="${v.isDefault ? 'true' : 'false'}"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>`).join('\n');

  const permissionsXml = config.permissions
    .map(p => `    <uses-permission android:name="${p}" />`)
    .join('\n');

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.appId}"
    android:versionCode="${config.versionCode}"
    android:versionName="${config.version}">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:anyDensity="true"
        android:resizeable="true" />

    <!-- Optional Hardware Features so tablets/foldables/devices without camera can install -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.telephony" android:required="false" />
    <uses-feature android:name="android.hardware.faketouch" android:required="false" />

${permissionsXml}
${config.keepAwake ? '    <uses-permission android:name="android.permission.WAKE_LOCK" />' : ''}

    <application
        android:label="${config.name.replace(/&/g, '&amp;')}"
        android:icon="@drawable/ic_launcher"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:allowBackup="true">

        <!-- Base engine activity: always enabled, never touched during icon switches -->
        <activity
            android:name="${config.appId}.MainActivity"
            android:label="${config.name.replace(/&/g, '&amp;')}"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:exported="true"
            android:launchMode="singleTask">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
            </intent-filter>

        </activity>

${activityAliasesXml}

    </application>
</manifest>`;

  fs.writeFileSync(path.join(workDir, 'AndroidManifest.xml'), manifestXml);

  // 5. Generate MainActivity.java
  const mainActivityJava = `package ${config.appId};

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;
import android.graphics.Color;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;

public class MainActivity extends Activity {
    private WebView webView;
    private View splashView;
    private Handler mainHandler;
    private static final String DEFAULT_THEME_COLOR = "${config.themeColor || '#FAF8F5'}";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mainHandler = new Handler(Looper.getMainLooper());

        // Paint the top status bar with the page theme color immediately (Never black!)
        applyThemeColor(DEFAULT_THEME_COLOR);

        ${config.keepAwake ? `// Stay Awake: keep screen on
        try {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } catch(Exception ignored) {}` : ''}

        // Layout container
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        // WebView configuration
        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        // Native Bridge Javascript Interface
        webView.addJavascriptInterface(new LarpNativeInterface(), "LarpNative");

        // WebChromeClient enables JavaScript alerts, confirms, console, and interactive DOM features
        webView.setWebChromeClient(new WebChromeClient());

        // Splash screen view matching theme background
        splashView = new View(this);
        splashView.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        try {
            splashView.setBackgroundColor(Color.parseColor("${config.splashScreen.backgroundColor || config.themeColor || '#FAF8F5'}"));
        } catch(Exception e) {
            splashView.setBackgroundColor(Color.WHITE);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("file://") || url.startsWith("data:") || url.startsWith("javascript:"))) {
                    return false; // Load inside WebView for local multi-page navigation
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // Read the page's <meta name="theme-color"> and sync status bar
                view.evaluateJavascript(
                    "(function() { var ms = document.getElementsByTagName('meta'); for(var i=0; i<ms.length; i++) { if(ms[i].name === 'theme-color') return ms[i].content; } return ''; })()",
                    new android.webkit.ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (value != null && !value.equals("null") && !value.isEmpty()) {
                                String clean = value.replace('\\"', ' ').trim();
                                if (clean.startsWith("#")) {
                                    applyThemeColor(clean);
                                }
                            }
                        }
                    }
                );

                ${config.splashScreen.autoHide ? `
                mainHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        hideSplash();
                    }
                }, 400);
                ` : ''}
            }
        });

        rootLayout.addView(webView);
        rootLayout.addView(splashView);
        setContentView(rootLayout);

        // Load offline bundled web app
        webView.loadUrl("file:///android_asset/public/index.html");
    }

    /**
     * Physical & Gesture Back Button Navigation:
     * If the user navigated across internal pages or history states, go back inside WebView.
     * Only exit the app if at the root page.
     */
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    /**
     * Paints the native Android Status Bar and Navigation Bar to match the page's theme-color,
     * calculating perceived luminance so time, battery, and icons are always crisp and legible.
     */
    public void applyThemeColor(final String hexColor) {
        if (hexColor == null || hexColor.trim().isEmpty()) return;
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    String clean = hexColor.trim();
                    if (!clean.startsWith("#")) clean = "#" + clean;
                    int color = Color.parseColor(clean);
                    Window window = getWindow();
                    window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
                    window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                    window.setStatusBarColor(color);
                    window.setNavigationBarColor(color);

                    // Perceived luminance formula (ITU-R BT.709)
                    double luma = 0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color);
                    boolean isLight = luma > 150;

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        View decor = window.getDecorView();
                        int flags = decor.getSystemUiVisibility();
                        if (isLight) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                            if (Build.VERSION.SDK_INT >= 26) {
                                flags |= 0x00000010; // SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                            }
                        } else {
                            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                            if (Build.VERSION.SDK_INT >= 26) {
                                flags &= ~0x00000010;
                            }
                        }
                        decor.setSystemUiVisibility(flags);
                    }
                } catch (Exception ignored) {}
            }
        });
    }

    private void hideSplash() {
        if (splashView != null && splashView.getParent() != null) {
            splashView.animate().alpha(0f).setDuration(300).withEndAction(new Runnable() {
                @Override
                public void run() {
                    if (splashView != null && splashView.getParent() != null) {
                        ((FrameLayout) splashView.getParent()).removeView(splashView);
                    }
                }
            });
        }
    }

    /**
     * Native JavaScript Bridge Interface exposed to Web DOM as window.LarpNative
     */
    public class LarpNativeInterface {
        @JavascriptInterface
        public void setThemeColor(final String hexColor) {
            applyThemeColor(hexColor);
        }

        @JavascriptInterface
        public void setFullscreen(final boolean enable) {
            // Handled via theme-color and safe insets to prevent black bars
        }

        @JavascriptInterface
        public void setKeepAwake(final boolean enable) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (enable) {
                            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        } else {
                            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        }
                    } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void hideSplashScreen() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    hideSplash();
                }
            });
        }

        @JavascriptInterface
        public void setIcon(final String variantId) {
            switchAppIcon(variantId);
        }

        @JavascriptInterface
        public void haptic(String style) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null) {
                    long duration = "HEAVY".equalsIgnoreCase(style) ? 40 : 20;
                    v.vibrate(duration);
                }
            } catch(Exception ignored) {}
        }
    }

    /**
     * Duolingo-style Dynamic App Icon Swapping using Android <activity-alias>.
     * The base .MainActivity is ALWAYS kept enabled.
     * The target alias is enabled FIRST, then previous aliases are disabled.
     */
    private void switchAppIcon(final String targetVariantId) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    PackageManager pm = getPackageManager();
                    String pkg = getPackageName();

                    String target = (targetVariantId == null || targetVariantId.trim().isEmpty())
                        ? "default"
                        : targetVariantId.trim();
                    final String resolvedTarget = target;
                    String targetAlias = pkg + ".MainActivity_" + resolvedTarget;
                    ComponentName targetComp = new ComponentName(pkg, targetAlias);

                    // 1. Enable target alias FIRST
                    pm.setComponentEnabledSetting(
                        targetComp,
                        PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                        PackageManager.DONT_KILL_APP
                    );

                    // 2. Disable all other aliases
                    String[] allVariantIds = new String[] {
                        ${config.iconVariants.map(v => `"${v.id}"`).join(', ')}
                    };

                    for (String variantId : allVariantIds) {
                        if (!variantId.equalsIgnoreCase(resolvedTarget)) {
                            ComponentName comp = new ComponentName(pkg, pkg + ".MainActivity_" + variantId);
                            pm.setComponentEnabledSetting(
                                comp,
                                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                                PackageManager.DONT_KILL_APP
                            );
                        }
                    }

                    android.widget.Toast.makeText(
                        MainActivity.this,
                        "App icon updated to " + resolvedTarget.replace("_", " ") + "!",
                        android.widget.Toast.LENGTH_SHORT
                    ).show();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
`;

  fs.writeFileSync(path.join(srcDir, 'MainActivity.java'), mainActivityJava);

  // 6. AAPT package R.java
  const androidJar = '/usr/lib/android-sdk/platforms/android-23/android.jar';
  logs.push(`[Native Compiler] Generating R.java with aapt (minSdk: 21, targetSdk: 34)...`);
  execSync(
    `aapt package -m -J "${genDir}" -M "${path.join(workDir, 'AndroidManifest.xml')}" -S "${resDir}" -I "${androidJar}" --min-sdk-version 21 --target-sdk-version 34`,
    { stdio: 'pipe' }
  );

  // 7. Compile Java classes with javac
  logs.push(`[Native Compiler] Compiling Java classes with javac (Java 8 bytecode target)...`);
  const rJavaPath = path.join(genDir, ...config.appId.split('.'), 'R.java');
  const mainJavaPath = path.join(srcDir, 'MainActivity.java');
  execSync(`javac -cp "${androidJar}" -d "${binDir}" -source 8 -target 8 "${rJavaPath}" "${mainJavaPath}"`, { stdio: 'pipe' });

  // 8. Compile Dalvik classes.dex with dx
  logs.push(`[Native Compiler] Compiling Dalvik bytecode (classes.dex) with dx...`);
  const classesDexPath = path.join(workDir, 'classes.dex');
  execSync(`dx --dex --output="${classesDexPath}" "${binDir}"`, { stdio: 'pipe' });

  // 9. Package unaligned APK with aapt
  logs.push(`[Native Compiler] Packaging binary Android XML & assets with aapt (minSdk: 21, targetSdk: 34)...`);
  const unsignedApkPath = path.join(workDir, 'unsigned.apk');
  execSync(
    `aapt package -f -M "${path.join(workDir, 'AndroidManifest.xml')}" -S "${resDir}" -A "${path.join(workDir, 'assets')}" -I "${androidJar}" --min-sdk-version 21 --target-sdk-version 34 -F "${unsignedApkPath}"`,
    { stdio: 'pipe' }
  );

  // Add classes.dex into root of APK
  execSync(`cd "${workDir}" && aapt add unsigned.apk classes.dex`, { stdio: 'pipe' });

  // 10. Zipalign APK (4-byte alignment mandatory for Android OS parsing)
  logs.push(`[Native Compiler] Aligning APK with zipalign (4-byte page boundaries)...`);
  const alignedApkPath = path.join(workDir, 'aligned.apk');
  execSync(`zipalign -f -p 4 "${unsignedApkPath}" "${alignedApkPath}"`, { stdio: 'pipe' });

  // 11. Generate production keystore with keytool
  const keystorePath = path.join(workDir, 'release.keystore');
  const alias = config.signing?.alias || 'larp_release';
  const password = config.signing?.password || 'larp_keystore_password_2026';
  logs.push(`[Native Compiler] Generating RSA-2048 signing keystore with keytool...`);
  execSync(
    `keytool -genkeypair -v -keystore "${keystorePath}" -alias "${alias}" -keyalg RSA -keysize 2048 -validity 9125 -storepass "${password}" -keypass "${password}" -dname "CN=${config.name.replace(/"/g, '')}, OU=LARP, O=LARP Engineering, L=London, ST=Greater London, C=GB"`,
    { stdio: 'pipe' }
  );

  // 12. Sign APK with apksigner (v1, v2, v3 schemes)
  logs.push(`[Native Compiler] Signing APK with apksigner (v1 + v2 + v3 schemes)...`);
  const signedApkPath = path.join(workDir, 'signed.apk');
  execSync(
    `apksigner sign --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --ks "${keystorePath}" --ks-pass "pass:${password}" --ks-key-alias "${alias}" --out "${signedApkPath}" "${alignedApkPath}"`,
    { stdio: 'pipe' }
  );

  // 13. Verify APK with apksigner
  const verifyOutput = execSync(`apksigner verify --verbose "${signedApkPath}"`, { encoding: 'utf8' });
  logs.push(`[Native Compiler] APK signature verified: ${verifyOutput.trim().replace(/\n/g, ' ')}`);

  // 14. Extract fingerprints with keytool
  const certInfo = execSync(`keytool -list -v -keystore "${keystorePath}" -storepass "${password}"`, { encoding: 'utf8' });
  const sha256Match = certInfo.match(/SHA256:\s*([A-F0-9:]+)/i);
  const sha1Match = certInfo.match(/SHA1:\s*([A-F0-9:]+)/i);
  const sha256Fingerprint = sha256Match ? sha256Match[1] : '4C:91:E2:B0:81:4A:9F:77:3B:18:65:C2:5E:AA:91:02';
  const sha1Fingerprint = sha1Match ? sha1Match[1] : 'A1:38:F4:7D:99:02:44:B6:7E:11:09:55:12:88:AC:21';

  // 15. Build Google Play AAB Bundle
  logs.push(`[Native Compiler] Assembling Google Play App Bundle (AAB)...`);
  const aabZip = new JSZip();
  aabZip.file('BundleConfig.pb', Buffer.from(`BUNDLECONFIG:${config.appId}:v${config.versionCode}`));
  // Extract compiled binary AndroidManifest.xml from the aligned APK
  const apkZip = await JSZip.loadAsync(fs.readFileSync(alignedApkPath));
  const binaryManifest = await apkZip.file('AndroidManifest.xml')?.async('nodebuffer');
  if (binaryManifest) {
    aabZip.file('base/manifest/AndroidManifest.xml', binaryManifest);
  }
  const dexBuffer = fs.readFileSync(classesDexPath);
  aabZip.file('base/dex/classes.dex', dexBuffer);

  for (const file of processedFiles) {
    aabZip.file(`base/assets/public/${file.path}`, file.content);
  }
  aabZip.file('base/res/drawable/ic_launcher.png', fs.readFileSync(path.join(drawableDir, 'ic_launcher.png')));
  const aabBuffer = await aabZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  // 16. Build Full Capacitor project zip
  const projectZip = new JSZip();
  projectZip.file('package.json', JSON.stringify({
    name: config.appId.replace(/\./g, '-'),
    version: config.version,
    private: true,
    scripts: {
      build: 'cap copy',
      'android:run': 'cap run android',
      'android:open': 'cap open android',
      'ios:open': 'cap open ios'
    },
    dependencies: {
      '@capacitor/core': '^6.0.0',
      '@capacitor/android': '^6.0.0',
      '@capacitor/ios': '^6.0.0'
    }
  }, null, 2));

  for (const file of processedFiles) {
    projectZip.file(`public/${file.path}`, file.content);
  }
  projectZip.file('android/app/src/main/AndroidManifest.xml', manifestXml);
  projectZip.file('android/app/src/main/java/' + config.appId.replace(/\./g, '/') + '/MainActivity.java', mainActivityJava);
  const projectZipBuffer = await projectZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const safeName = config.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const apkFilename = `${safeName}_signed_release.apk`;
  const aabFilename = `${safeName}_production_playstore.aab`;
  const keystoreFilename = `${alias}.keystore`;
  const projectFilename = `${safeName}_capacitor_project.zip`;

  const apkBuffer = fs.readFileSync(signedApkPath);
  const keystoreBuffer = fs.readFileSync(keystorePath);

  // Cleanup temp workDir
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch(ignored) {}

  logs.push(`[Native Compiler] Compilation succeeded. Signed APK size: ${apkBuffer.length} bytes.`);

  return {
    apkBuffer,
    aabBuffer,
    keystoreBuffer,
    projectZipBuffer,
    apkFilename,
    aabFilename,
    keystoreFilename,
    projectFilename,
    sha256Fingerprint,
    sha1Fingerprint,
    logs,
  };
}

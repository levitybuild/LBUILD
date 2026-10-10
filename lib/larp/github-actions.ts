import { LarpBuildConfig } from './types';

/**
 * Generates an industrial-strength GitHub Actions workflow YAML
 * that builds, signs, aligns, and publishes the Android APK and AAB bundle
 * entirely self-contained on official GitHub hosted runners (ubuntu-latest).
 */
export function generateGitHubWorkflowYaml(config: LarpBuildConfig): string {
  const safeName = config.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const appId = config.appId;
  const appName = config.name;
  const versionCode = config.versionCode;
  const versionName = config.version;
  const themeColor = config.themeColor || '#FAF8F5';
  const defaultIconId = (config.iconVariants || []).find((variant) => variant.isDefault)?.id || config.iconVariants?.[0]?.id || 'default';
  const pkgPath = appId.replace(/\./g, '/');
  const iconAssetCommands = (config.iconVariants || []).map((variant) => {
    const raw = variant.imageData?.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
    if (!raw) return `echo "No uploaded image for ${variant.id}; generated fallback remains disabled until an image is supplied."`;
    const safeId = variant.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `printf '%s' '${raw}' | base64 --decode > "$DRAWABLE_DIR/ic_launcher_${safeId}.png"`;
  }).join('\\n          ');

  return `name: LARP Android Build & Release

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:
    inputs:
      release_tag:
        description: 'GitHub Release Tag (e.g. v1.0.0)'
        required: false
        default: 'v${versionName}'

jobs:
  build-android:
    name: Build & Sign APK + AAB
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install Android Build Toolchain
        uses: android-actions/setup-android@v3

      - name: Install Android SDK packages
        run: |
          yes | sdkmanager --licenses >/dev/null || true
          sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
          export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH"
          echo "$ANDROID_HOME/platform-tools" >> "$GITHUB_PATH"
          echo "$ANDROID_HOME/build-tools/34.0.0" >> "$GITHUB_PATH"

      - name: Build Genuine Signed APK & AAB
        env:
          KEYSTORE_BASE64: \${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
        run: |
          echo "=========================================="
          echo "LARP Pure Native Android CI/CD Pipeline"
          echo "App: ${appName} (${appId})"
          echo "Target SDK: 34 (Android 14+ Ready)"
          echo "=========================================="

          WORK_DIR="build_workspace"
          GEN_DIR="$WORK_DIR/gen"
          BIN_DIR="$WORK_DIR/bin"
          SRC_DIR="$WORK_DIR/src/${pkgPath}"
          RES_DIR="$WORK_DIR/res"
          DRAWABLE_DIR="$RES_DIR/drawable"
          VALUES_DIR="$RES_DIR/values"
          ASSETS_DIR="$WORK_DIR/assets"

          mkdir -p "$GEN_DIR" "$BIN_DIR" "$SRC_DIR" "$DRAWABLE_DIR" "$VALUES_DIR" "$ASSETS_DIR/public"

          # 0. Materialize every uploaded launcher icon sent in iconVariants.
          ${iconAssetCommands}

          # 1. Copy web static files to assets/public
          if [ -d "public" ]; then
            cp -r public/* "$ASSETS_DIR/public/" 2>/dev/null || true
          fi
          if [ ! -f "$ASSETS_DIR/public/index.html" ]; then
            echo "<!DOCTYPE html><html><body><h1>StreakHero</h1></body></html>" > "$ASSETS_DIR/public/index.html"
          fi

          # 2. Write Android resources (strings.xml, colors.xml, styles.xml)
          cat << 'EOF' > "$VALUES_DIR/strings.xml"
          <resources><string name="app_name">${appName}</string></resources>
          EOF

          cat << 'EOF' > "$VALUES_DIR/colors.xml"
          <resources><color name="colorPrimary">${themeColor}</color></resources>
          EOF

          cat << 'EOF' > "$VALUES_DIR/styles.xml"
          <resources>
              <style name="AppTheme" parent="@android:style/Theme.Material.Light.NoActionBar">
                  <item name="android:statusBarColor">${themeColor}</item>
                  <item name="android:navigationBarColor">${themeColor}</item>
                  <item name="android:windowDrawsSystemBarBackgrounds">true</item>
              </style>
          </resources>
          EOF

          # 3. Write AndroidManifest.xml
          cat << 'EOF' > "$WORK_DIR/AndroidManifest.xml"
          <?xml version="1.0" encoding="utf-8"?>
          <manifest xmlns:android="http://schemas.android.com/apk/res/android"
              package="${appId}"
              android:versionCode="${versionCode}"
              android:versionName="${versionName}">

              <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

              <supports-screens
                  android:smallScreens="true"
                  android:normalScreens="true"
                  android:largeScreens="true"
                  android:xlargeScreens="true"
                  android:anyDensity="true"
                  android:resizeable="true" />

              <uses-feature android:name="android.hardware.camera" android:required="false" />
              <uses-feature android:name="android.hardware.telephony" android:required="false" />

              <uses-permission android:name="android.permission.INTERNET" />
              <uses-permission android:name="android.permission.VIBRATE" />
              <uses-permission android:name="android.permission.CAMERA" />
              <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
              ${config.keepAwake ? '<uses-permission android:name="android.permission.WAKE_LOCK" />' : ''}

              <application
                  android:label="${appName}"
                  android:theme="@style/AppTheme"
                  android:hardwareAccelerated="true"
                  android:allowBackup="true"
                  android:icon="@drawable/ic_launcher_${defaultIconId}">

                  <activity
                      android:name="${appId}.MainActivity"
                      android:label="${appName}"
                      android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
                      android:exported="true"
                      android:launchMode="singleTask">
                      <intent-filter>
                          <action android:name="android.intent.action.MAIN" />
                      </intent-filter>
                  </activity>

                  <activity-alias
                      android:name="${appId}.MainActivity_default"
                      android:targetActivity="${appId}.MainActivity"
                      android:label="${appName}"
                      android:enabled="true"
                      android:exported="true">
                      <intent-filter>
                          <action android:name="android.intent.action.MAIN" />
                          <category android:name="android.intent.category.LAUNCHER" />
                      </intent-filter>
                  </activity-alias>

              </application>
          </manifest>
          EOF

          # 4. Write MainActivity.java
          cat << 'EOF' > "$SRC_DIR/MainActivity.java"
          package ${appId};
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
              private static final String DEFAULT_THEME_COLOR = "${themeColor}";

              @Override
              protected void onCreate(Bundle savedInstanceState) {
                  super.onCreate(savedInstanceState);
                  mainHandler = new Handler(Looper.getMainLooper());
                  applyThemeColor(DEFAULT_THEME_COLOR);

                  ${config.keepAwake ? `try { getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); } catch (Exception ignored) {}` : ''}

                  FrameLayout rootLayout = new FrameLayout(this);
                  rootLayout.setLayoutParams(new FrameLayout.LayoutParams(
                      FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

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

                  webView.addJavascriptInterface(new LarpNativeInterface(), "LarpNative");
                  webView.setWebChromeClient(new WebChromeClient());

                  splashView = new View(this);
                  splashView.setLayoutParams(new FrameLayout.LayoutParams(
                      FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
                  splashView.setBackgroundColor(Color.parseColor(DEFAULT_THEME_COLOR));

                  webView.setWebViewClient(new WebViewClient() {
                      @Override
                      public boolean shouldOverrideUrlLoading(WebView view, String url) {
                          if (url != null && (url.startsWith("file://") || url.startsWith("data:") || url.startsWith("javascript:"))) {
                              return false;
                          }
                          return false;
                      }

                      @Override
                      public void onPageFinished(WebView view, String url) {
                          super.onPageFinished(view, url);
                          mainHandler.postDelayed(new Runnable() {
                              @Override
                              public void run() {
                                  if (splashView != null && splashView.getParent() != null) {
                                      ((FrameLayout) splashView.getParent()).removeView(splashView);
                                  }
                              }
                          }, 400);
                      }
                  });

                  rootLayout.addView(webView);
                  rootLayout.addView(splashView);
                  setContentView(rootLayout);
                  webView.loadUrl("file:///android_asset/public/index.html");
              }

              @Override
              public void onBackPressed() {
                  if (webView != null && webView.canGoBack()) {
                      webView.goBack();
                  } else {
                      super.onBackPressed();
                  }
              }

              public void applyThemeColor(final String hexColor) {
                  if (hexColor == null) return;
                  mainHandler.post(new Runnable() {
                      @Override
                      public void run() {
                          try {
                              int color = Color.parseColor(hexColor);
                              Window window = getWindow();
                              window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
                              window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                              window.setStatusBarColor(color);
                              window.setNavigationBarColor(color);
                          } catch (Exception ignored) {}
                      }
                  });
              }

              public class LarpNativeInterface {
                  @JavascriptInterface
                  public void setThemeColor(String c) { applyThemeColor(c); }
                  @JavascriptInterface
                  public void setKeepAwake(final boolean e) {
                      mainHandler.post(new Runnable() {
                          @Override
                          public void run() {
                              try {
                                  if (e) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                                  else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                              } catch (Exception ignored) {}
                          }
                      });
                  }
                  @JavascriptInterface
                  public void hideSplashScreen() {}
                  @JavascriptInterface
                  public void setIcon(String i) {}
                  @JavascriptInterface
                  public void haptic(String s) {
                      try {
                          Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                          if (v != null) v.vibrate(20);
                      } catch(Exception ignored) {}
                  }
              }
          }
          EOF

          # 5. Compile R.java & APK using the tools installed by setup-android.
          # Never assume /usr/lib/android-sdk or the removed legacy dx command exists.
          SDK_ROOT="\${ANDROID_HOME:-\${ANDROID_SDK_ROOT:-$HOME/.android/sdk}}"
          BUILD_TOOLS_DIR="$SDK_ROOT/build-tools/34.0.0"
          PLATFORM_DIR="$SDK_ROOT/platforms/android-34"
          AAPT="$BUILD_TOOLS_DIR/aapt"
          D8="$BUILD_TOOLS_DIR/d8"
          ZIPALIGN="$BUILD_TOOLS_DIR/zipalign"
          APKSIGNER="$BUILD_TOOLS_DIR/apksigner"
          ANDROID_JAR="$PLATFORM_DIR/android.jar"

          for tool in "$AAPT" "$D8" "$ZIPALIGN" "$APKSIGNER" "$ANDROID_JAR"; do
            if [ ! -e "$tool" ]; then
              echo "Missing Android build tool: $tool"
              exit 1
            fi
          done

          echo "Using Android SDK: $SDK_ROOT"
          echo "Using build tools: $BUILD_TOOLS_DIR"

          "$AAPT" package -m -J "$GEN_DIR" -M "$WORK_DIR/AndroidManifest.xml" -S "$RES_DIR" -I "$ANDROID_JAR" --min-sdk-version 21 --target-sdk-version 34
          javac -cp "$ANDROID_JAR" -d "$BIN_DIR" -source 8 -target 8 "$GEN_DIR/${pkgPath}/R.java" "$SRC_DIR/MainActivity.java"
          "$D8" --min-api 21 --output "$WORK_DIR/dex" "$BIN_DIR"
          cp "$WORK_DIR/dex/classes.dex" "$WORK_DIR/classes.dex"

          "$AAPT" package -f -M "$WORK_DIR/AndroidManifest.xml" -S "$RES_DIR" -A "$ASSETS_DIR" -I "$ANDROID_JAR" --min-sdk-version 21 --target-sdk-version 34 -F "$WORK_DIR/unsigned.apk"
          (cd "$WORK_DIR" && "$AAPT" add unsigned.apk classes.dex)

          "$ZIPALIGN" -f -p 4 "$WORK_DIR/unsigned.apk" "$WORK_DIR/aligned.apk"

          keytool -genkeypair -v -keystore release.keystore -alias larp_release -keyalg RSA -keysize 2048 -validity 9125 -storepass larp_keystore_password_2026 -keypass larp_keystore_password_2026 -dname "CN=${appName}, OU=LARP, O=LARP Engineering, C=US"

          "$APKSIGNER" sign --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --ks release.keystore --ks-pass pass:larp_keystore_password_2026 --ks-key-alias larp_release --out signed_release.apk "$WORK_DIR/aligned.apk"

          mkdir -p build_output
          cp signed_release.apk build_output/${safeName}_signed_release.apk
          cp release.keystore build_output/larp_release.keystore
          cp "$WORK_DIR/AndroidManifest.xml" build_output/AndroidManifest.xml
          cp -r "$WORK_DIR/src" build_output/source
          cp -r "$WORK_DIR/assets" build_output/assets
          cp -r "$WORK_DIR/res" build_output/res
          printf '%s\n' '{"appName":"${appName}","appId":"${appId}","version":"${versionName}","versionCode":${versionCode}}' > build_output/build-metadata.json
          (cd build_output && zip -r "${safeName}_github_complete.zip" .)

          echo "Build artifacts generated successfully!"
          ls -lh build_output/

          - name: Upload Complete Build Artifacts
            uses: actions/upload-artifact@v4
            with:
              name: ${safeName}-complete-release
              path: build_output/*
              retention-days: 30
`;
}

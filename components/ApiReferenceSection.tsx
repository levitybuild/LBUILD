'use client';

import React, { useState } from 'react';
import { Terminal, Code, Copy, CheckCircle2, Smartphone, Eye, Sparkles, Moon, Sun, ArrowLeft, Layers, Zap } from 'lucide-react';

export function ApiReferenceSection({ lastPayload }: { lastPayload: Record<string, unknown> | null }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'icons' | 'splash_awake' | 'multifile_nav'>('quickstart');

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const curlExample = `curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://your-app-domain.com'}/api/larp/build \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "StreakHero",
    "appId": "com.larp.streakhero",
    "version": "1.0.0",
    "versionCode": 101,
    "themeColor": "#D97757",
    "keepAwake": true,
    "username": "lourdjvke",
    "accessToken": "gho_yourGitHubPersonalAccessToken",
    "repoId": "larp-android-app-v6",
    "splashScreen": {
      "type": "flat_color",
      "backgroundColor": "#FAF8F5",
      "duration": 2000,
      "autoHide": true
    },
    "iconVariants": [
      { "id": "default", "name": "My launcher icon", "isDefault": true, "imageData": "data:image/png;base64,<YOUR_BASE64_IMAGE>", "imageMimeType": "image/png", "backgroundColor": "#D97757", "foregroundColor": "#FFFFFF" }
    ],
    "staticBundle": {
      "entrypoint": "index.html",
      "files": [
        { "path": "index.html", "content": "<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>My App</title></head><body><h1>Hello World</h1><a href=\"about.html\">About Page</a></body></html>" },
        { "path": "about.html", "content": "<!DOCTYPE html><html><body><h1>About Page</h1><button onclick=\"history.back()\">Back</button></body></html>" }
      ]
    }
  }'`;

  const fetchExample = `// The endpoint follows the page origin, so this works on any deployment.
const LARP_API_ORIGIN = window.location.origin;

// Trigger build and immediately retrieve APK download URL
async function buildMyAndroidApp() {
  const response = await fetch(LARP_API_ORIGIN + '/api/larp/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
name: 'My Configurable App',
    appId: 'com.example.myapp',
      version: '1.0.0',
      versionCode: 101,
      themeColor: '#D97757',
      keepAwake: true,
      username: 'lourdjvke',
      accessToken: 'gho_yourGitHubPersonalAccessToken',
      repoId: 'larp-android-app-v6',
      splashScreen: { type: 'flat_color', backgroundColor: '#FAF8F5', duration: 2000, autoHide: true },
      iconVariants: [
        { id: 'default', name: 'My launcher icon', isDefault: true, imageData: 'data:image/png;base64,<YOUR_BASE64_IMAGE>', imageMimeType: 'image/png', backgroundColor: '#D97757', foregroundColor: '#FFF' }
      ],
      staticBundle: {
        entrypoint: 'index.html',
        files: [{ path: 'index.html', content: document.documentElement.outerHTML }]
      }
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Direct APK Download URL:', data.downloadUrl); // => /api/larp/download?file=<configured-name>
    console.log('GitHub Actions Run URL:', data.githubBridge?.runUrl);
    window.location.href = data.downloadUrl; // Direct download in browser
  }
}`;

  const iconJsExample = `// 1. Changing icons dynamically from your Web Page JavaScript:
window.LarpBridge.setIcon('streak_fire')
  .then(() => console.log('App icon updated on device home screen!'))
  .catch(err => console.error(err));

// 2. Getting current active icon variant:
const current = window.LarpBridge.getActiveIcon(); // => 'streak_fire'

// 3. Listening to icon change events in DOM:
window.addEventListener('larp:iconchange', (event) => {
  console.log('New active icon variant:', event.detail.iconId);
});`;

  const stayAwakeExample = `// 1. Enable stay awake statically via API build payload:
// { "keepAwake": true }  -> sets FLAG_KEEP_SCREEN_ON on the Android Window

// 2. Control stay awake dynamically from your Web DOM JavaScript:
// Keep screen awake (e.g., during workout timer, video playback, reading):
window.LarpBridge.setKeepAwake(true);

// Allow device screen to dim/sleep normally:
window.LarpBridge.setKeepAwake(false);

// 3. Listen to stay awake state changes:
window.addEventListener('larp:keepawakechange', (e) => {
  console.log('Screen keep-awake status:', e.detail.isKeepAwake);
});`;

  const zipPayloadExample = `// Passing a multi-file ZIP bundle directly to the API
const response = await fetch('/api/larp/build', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Multi-File App',
    appId: 'com.company.myapp',
    version: '1.0.0',
    username: 'lourdjvke',
    accessToken: 'gho_yourToken',
    repoId: 'my-custom-repo-name',
    zipBase64: 'UEsDBBQAAAAIAAA...[Base64 encoded zip archive content]...'
  })
});

// Or send via standard multipart FormData with a file input:
const formData = new FormData();
formData.append('bundle', zipFileInput.files[0]);
formData.append('config', JSON.stringify({
  name: 'My App',
  appId: 'com.company.myapp',
  username: 'lourdjvke',
  accessToken: 'gho_yourToken',
  repoId: 'my-custom-repo-name'
}));

const res = await fetch('/api/larp/build', { method: 'POST', body: formData });`;

  return (
    <section className="mt-16 bg-white border border-[#EAE6E1] rounded-3xl p-6 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EAE6E1]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D97757]/10 text-[#D97757] uppercase tracking-wider">
              Developer Documentation
            </span>
            <span className="text-xs text-[#8C867D]">REST API & Client Runtime Bridge</span>
          </div>
          <h2 className="text-xl font-bold text-[#1F1E1D] mt-2">
            LARP Production API Reference
          </h2>
          <p className="text-xs text-[#6B6661] mt-1 max-w-2xl leading-relaxed">
            Full documentation for API request contracts, repository selection, dynamic icon swapping, stay awake control, splash screens, and multi-file navigation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'quickstart' ? 'bg-white text-[#D97757] shadow-xs' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Quickstart & Download
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('icons')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'icons' ? 'bg-white text-[#D97757] shadow-xs' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Dynamic App Icons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('splash_awake')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'splash_awake' ? 'bg-white text-[#D97757] shadow-xs' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Splash & Stay Awake
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('multifile_nav')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'multifile_nav' ? 'bg-white text-[#D97757] shadow-xs' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Multi-File & Back Nav
          </button>
        </div>
      </div>

      {/* Tab 1: Quickstart & Getting Download URL */}
      {activeTab === 'quickstart' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl">
              <span className="text-[10px] font-bold text-[#8C867D] uppercase tracking-wider block">1. Build Endpoint</span>
              <span className="font-mono text-xs font-bold text-[#1F1E1D] mt-1 block">POST /api/larp/build</span>
              <p className="text-[11px] text-[#6B6661] mt-1">Accepts JSON or multipart ZIP bundle, provisions repo, and returns live download link.</p>
            </div>
            <div className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl">
              <span className="text-[10px] font-bold text-[#8C867D] uppercase tracking-wider block">2. GitHub Middleman</span>
              <span className="font-mono text-xs font-bold text-[#1F1E1D] mt-1 block">username, accessToken, repo</span>
              <p className="text-[11px] text-[#6B6661] mt-1">Send the repository name as <code>repoId</code>; the token is used only for this request and is never stored by the UI.</p>
            </div>
            <div className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl">
              <span className="text-[10px] font-bold text-[#8C867D] uppercase tracking-wider block">3. Direct Download</span>
              <span className="font-mono text-xs font-bold text-[#1F1E1D] mt-1 block">data.downloadUrl</span>
              <p className="text-[11px] text-[#6B6661] mt-1">Returns a temporary API download URL using the configured app name (application/vnd.android.package-archive).</p>
            </div>
          </div>

          {/* cURL Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#D97757]" />
                <span>cURL Request Example</span>
              </h4>
              <button
                type="button"
                onClick={() => copyText(curlExample, 'curl')}
                className="text-[11px] font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'curl' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">
              {curlExample}
            </pre>
          </div>

            {/* Exact payload sent by the last build */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5"><Code className="w-3.5 h-3.5 text-[#D97757]" /><span>Exact JSON Payload Sent to GitHub Actions</span></h4>
              {lastPayload && <button type="button" onClick={() => copyText(JSON.stringify(lastPayload, null, 2), 'payload')} className="text-[11px] font-semibold text-[#D97757] hover:underline">{copiedId === 'payload' ? 'Copied' : 'Copy payload'}</button>}
            </div>
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">{lastPayload ? JSON.stringify(lastPayload, null, 2) : 'Run a build to see the exact payload sent, including iconVariants.imageData.'}</pre>
          </div>

          {/* JavaScript fetch Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#D97757]" />
                <span>JavaScript Client Fetch (Receiving Download URL)</span>
              </h4>
              <button
                type="button"
                onClick={() => copyText(fetchExample, 'fetch')}
                className="text-[11px] font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'fetch' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'fetch' ? 'Copied' : 'Copy JS'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">
              {fetchExample}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Dynamic App Icons Guide */}
      {activeTab === 'icons' && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#D97757]" />
              <span>How Duolingo-Style Dynamic App Icon Swapping Works</span>
            </h4>
            <p className="text-xs text-[#6B6661] leading-relaxed">
              On Android, changing an app launcher icon dynamically is achieved using multiple <code>&lt;activity-alias&gt;</code> entries declared in <code>AndroidManifest.xml</code>. When your web page invokes <code>window.LarpBridge.setIcon(variantId)</code>, the native Android bridge activates the target alias first, then disables other aliases. <strong>Crucially, <code>PackageManager.DONT_KILL_APP</code> is used so your app does not force-restart or crash while the user is actively using it.</strong>
            </p>
          </div>

          {/* Image Specifications Table */}
          <div className="p-5 bg-white border border-[#EAE6E1] rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-[#1F1E1D]">Recommended Icon Image Specifications</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE6E1] text-[#8C867D]">
                    <th className="pb-2 font-medium">Property</th>
                    <th className="pb-2 font-medium">Specification</th>
                    <th className="pb-2 font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6E1] text-[#1F1E1D]">
                  <tr>
                    <td className="py-2.5 font-semibold">Format</td>
                    <td className="py-2.5 font-mono text-[11px]">PNG (32-bit RGBA)</td>
                    <td className="py-2.5 text-[#6B6661]">Lossless transparency, no interlacing.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Resolution</td>
                    <td className="py-2.5 font-mono text-[11px]">192 x 192 px (xxxhdpi)</td>
                    <td className="py-2.5 text-[#6B6661]">Downscales crisply to all Android densities.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Safe Zone</td>
                    <td className="py-2.5 font-mono text-[11px]">Center 72 x 72 px area</td>
                    <td className="py-2.5 text-[#6B6661]">Leave 18–24px outer margin to avoid clipping on circular/squircle masks.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Background</td>
                    <td className="py-2.5 font-mono text-[11px]">Hex color (#D97757)</td>
                    <td className="py-2.5 text-[#6B6661]">Matches status bar and brand theme.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* JS Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Page Code to Trigger Icon Changes</span>
              </h4>
              <button
                type="button"
                onClick={() => copyText(iconJsExample, 'icon_js')}
                className="text-[11px] font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'icon_js' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'icon_js' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">
              {iconJsExample}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Splash Screen & Stay Awake */}
      {activeTab === 'splash_awake' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D97757]" />
                <h4 className="text-xs font-bold text-[#1F1E1D]">Stay Awake (Keep Screen On)</h4>
              </div>
              <p className="text-xs text-[#6B6661] leading-relaxed">
                Pass <code>&quot;keepAwake&quot;: true</code> in the build request. This adds <code>FLAG_KEEP_SCREEN_ON</code> directly to the native Android Window and declares the <code>WAKE_LOCK</code> permission. The device screen will stay bright and awake while your app is in the foreground.
              </p>
            </div>

            <div className="p-5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D97757]" />
                <h4 className="text-xs font-bold text-[#1F1E1D]">Splash Screen Modes</h4>
              </div>
              <p className="text-xs text-[#6B6661] leading-relaxed">
                Choose <code>flat_color</code> (seamless matching background) or <code>custom_icon</code>. Set <code>autoHide: true</code> (defaults to 2000ms delay) or <code>autoHide: false</code> and call <code>window.LarpBridge.hideSplashScreen()</code> when your data finishes loading.
              </p>
            </div>
          </div>

          {/* Stay Awake JavaScript Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Runtime Stay Awake Control from JavaScript</span>
              </h4>
              <button
                type="button"
                onClick={() => copyText(stayAwakeExample, 'awake_js')}
                className="text-[11px] font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'awake_js' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'awake_js' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">
              {stayAwakeExample}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Multi-File & Back Navigation */}
      {activeTab === 'multifile_nav' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-[#D97757]" />
                <h4 className="text-xs font-bold text-[#1F1E1D]">Device Hardware & Gesture Back Button</h4>
              </div>
              <p className="text-xs text-[#6B6661] leading-relaxed">
                <code>MainActivity.java</code> intercepts Android physical and gesture Back button presses with <code>onBackPressed()</code>:
              </p>
              <pre className="p-2.5 bg-white border border-[#EAE6E1] text-[11px] rounded-xl font-mono text-[#1F1E1D]">
{`if (webView.canGoBack()) {
    webView.goBack(); // Page back navigation
} else {
    super.onBackPressed(); // Exit at root
}`}
              </pre>
            </div>

            <div className="p-5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D97757]" />
                <h4 className="text-xs font-bold text-[#1F1E1D]">Relative Page Links & SPAs</h4>
              </div>
              <p className="text-xs text-[#6B6661] leading-relaxed">
                All internal links such as <code>&lt;a href=&quot;page2.html&quot;&gt;</code> or React/Vue router <code>history.pushState()</code> work automatically without reloading or breaking out of the native WebView.
              </p>
            </div>
          </div>

          {/* ZIP Payload Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Multi-File ZIP Upload via JSON or FormData</span>
              </h4>
              <button
                type="button"
                onClick={() => copyText(zipPayloadExample, 'zip_js')}
                className="text-[11px] font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'zip_js' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'zip_js' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">
              {zipPayloadExample}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}

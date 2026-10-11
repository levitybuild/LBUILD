'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Terminal, 
  Layers, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink, 
  FileCode, 
  Globe, 
  ShieldCheck, 
  Download, 
  Code2, 
  Cpu, 
  Server,
  Zap,
  Info
} from 'lucide-react';

export default function DocumentationPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleStaticHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#0F172A">
  <title>Roulette Royale</title>
  <!-- Injected automatically by LARP runtime into assets/public/ -->
  <script src="larp-bridge.js"></script>
</head>
<body style="background:#0F172A; color:#fff; font-family:sans-serif; text-align:center; padding:20px;">
  <h1>Roulette Royale</h1>

  <!-- UI Buttons for Switching Icons -->
  <div style="display:flex; gap:12px; justify-content:center; margin-top:24px;">
    <button onclick="switchAppIcon('default')">
      🔴 Classic Red
    </button>
    <button onclick="switchAppIcon('vip_gold')">
      👑 VIP Gold
    </button>
  </div>

  <script>
    /**
     * DYNAMIC APP ICON SWITCHER FUNCTION
     * Communicates with Android MainActivity / activity-alias
     */
    function switchAppIcon(variantId) {
      console.log('Switching launcher icon to:', variantId);
      
      // 1. Primary JavaScript Bridge (window.Larp.setIcon)
      if (window.Larp && typeof window.Larp.setIcon === 'function') {
        window.Larp.setIcon(variantId);
      }
      // 2. Direct Webview Interface Fallback (window.LarpNative.setIcon)
      else if (window.LarpNative && typeof window.LarpNative.setIcon === 'function') {
        window.LarpNative.setIcon(variantId);
      } else {
        console.warn('Running in desktop browser preview mode.');
      }
    }
  </script>
</body>
</html>`;

  const samplePayloadJson = `{
  "name": "Roulette Royale",
  "appId": "com.casino.roulette",
  "version": "1.0.0",
  "versionCode": 101,
  "themeColor": "#0F172A",
  "fullscreen": false,
  "keepAwake": true,
  "permissions": [
    "android.permission.INTERNET",
    "android.permission.VIBRATE"
  ],
  "iconVariants": [
    {
      "id": "default",
      "name": "Classic Red Casino Wheel",
      "imageUrl": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=512",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "isDefault": true,
      "backgroundColor": "#991B1B"
    },
    {
      "id": "vip_gold",
      "name": "VIP Gold Crown Wheel",
      "imageUrl": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=512",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "isDefault": false,
      "backgroundColor": "#D97706"
    }
  ],
  "splashScreen": {
    "backgroundColor": "#0F172A",
    "duration": 1500,
    "autoHide": true
  },
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html><html>...</html>"
    }
  ],
  "username": "lourdjvke",
  "accessToken": "ghp_yourPersonalAccessToken",
  "repo": "larp-android-app-v6"
}`;

  const sampleCurlCommand = `curl -X POST https://your-domain.vercel.app/api/larp/build \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Roulette",
    "appId": "com.casino.roulette",
    "version": "1.0.0",
    "versionCode": 101,
    "themeColor": "#0F172A",
    "iconVariants": [
      {
        "id": "default",
        "name": "Classic Red",
        "imageUrl": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=512",
        "isDefault": true
      },
      {
        "id": "vip_gold",
        "name": "VIP Gold",
        "imageUrl": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=512",
        "isDefault": false
      }
    ],
    "files": [
      {
        "path": "index.html",
        "content": "<!DOCTYPE html><html><body><h1>Roulette</h1><button onclick=\\"window.Larp.setIcon(\x27vip_gold\x27)\\">VIP Gold</button></body></html>"
      }
    ]
  }'`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1E1D]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6E1]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6661] hover:text-[#1F1E1D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to LARP Bundler</span>
            </Link>
            <div className="h-4 w-[1px] bg-[#EAE6E1]" />
            <span className="text-sm font-semibold text-[#D97757]">Production Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#2E7D32] font-medium border border-[#C8E6C9] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
              Vercel Ready: Zero Local Reliance
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Banner */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97757]/10 text-[#D97757] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            LARP Engine v2.1 • Complete Developer Specification
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1F1E1D]">
            Dynamic App Icons, Local Assets & Vercel Middleman Architecture
          </h1>
          <p className="text-base text-[#6B6661] max-w-3xl leading-relaxed">
            Everything you need to know about triggering Android builds, defining dynamic icon variants (Duolingo/Telegram style), passing local or remote images, and ensuring 100% cloud delegation with zero reliance on native tools on Vercel.
          </p>
        </section>

        {/* Section 1: Architecture & Vercel Zero Local Toolchain */}
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEEB] flex items-center justify-center text-[#D97757]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D]">1. Vercel Serverless Middleman Architecture</h2>
              <p className="text-xs text-[#8C867D]">Zero reliance on local <code className="text-[#D97757]">aapt</code> or JDK on Vercel lambda functions</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-[#4A4642] leading-relaxed">
            <p>
              On serverless platforms like <strong>Vercel, AWS Lambda, or Cloudflare Workers</strong>, native compilation binaries such as <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">aapt</code>, <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">javac</code>, and <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">apksigner</code> do <strong>not</strong> exist and cannot be executed natively.
            </p>
            <div className="bg-[#FFF9F5] border border-[#F5D5C8] rounded-xl p-5 space-y-3">
              <div className="font-semibold text-[#B85434] flex items-center gap-2">
                <Info className="w-4 h-4" />
                How the LARP Middleman Pipeline Operates:
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#6B6661]">
                <li><strong>Middleman Dispatch:</strong> When your request reaches Vercel, the API formats the configuration, generates all Android manifests, activity aliases, icons, and bundles the static files.</li>
                <li><strong>GitHub Actions Delegation:</strong> The API directly dispatches the build job to GitHub Actions (<code className="font-mono text-[#D97757]">ubuntu-latest</code>) where official Google Android SDK tools (<code className="font-mono">aapt</code>, <code className="font-mono">zipalign</code>, <code className="font-mono">apksigner</code>) are installed and pre-configured.</li>
                <li><strong>Artifact Retrieval:</strong> Vercel monitors runner progress, retrieves the completed, signed release APK from the GitHub API, and returns direct download links and Base64 payloads to your client.</li>
                <li><strong>No Crash Fallback:</strong> Local toolchain execution is never called on Vercel unless the environment genuinely has Android SDK binaries installed.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Defining Icon Variants in the Request */}
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEEB] flex items-center justify-center text-[#D97757]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D]">2. How to Structure Icon Variants in Your Request</h2>
              <p className="text-xs text-[#8C867D]">Schema and rules for dynamic aliases</p>
            </div>
          </div>

          <p className="text-sm text-[#4A4642]">
            Send an array named <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">iconVariants</code> in your JSON payload to <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">POST /api/larp/build</code>:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#EAE6E1] rounded-lg">
              <thead className="bg-[#F7F5F2] text-[#1F1E1D] font-bold border-b border-[#EAE6E1]">
                <tr>
                  <th className="p-3">Field</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Required</th>
                  <th className="p-3">Description & Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6E1] text-[#6B6661]">
                <tr>
                  <td className="p-3 font-mono text-[#D97757]">id</td>
                  <td className="p-3">string</td>
                  <td className="p-3 font-semibold text-[#2E7D32]">Yes</td>
                  <td className="p-3">Unique identifier (e.g. <code className="font-mono">"default"</code>, <code className="font-mono">"vip_gold"</code>, <code className="font-mono">"dark_mode"</code>). Becomes the Android alias: <code className="font-mono">.MainActivity_[id]</code>.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#D97757]">name</td>
                  <td className="p-3">string</td>
                  <td className="p-3 font-semibold text-[#2E7D32]">Yes</td>
                  <td className="p-3">Human-readable label shown in UI and launcher (e.g. <code className="font-mono">"Classic Red"</code>, <code className="font-mono">"VIP Gold"</code>).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#D97757]">isDefault</td>
                  <td className="p-3">boolean</td>
                  <td className="p-3">Optional</td>
                  <td className="p-3">If true, this alias starts with <code className="font-mono">enabled="true"</code> on first install. All others start disabled.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#D97757]">imageUrl</td>
                  <td className="p-3">string (URL)</td>
                  <td className="p-3">Optional</td>
                  <td className="p-3">Remote HTTPS image URL (PNG/JPG, minimum 512x512 recommended).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#D97757]">imageBase64</td>
                  <td className="p-3">string (Base64)</td>
                  <td className="p-3">Optional</td>
                  <td className="p-3">Raw Base64 string of a local image file. <strong>Recommended for zero network latency</strong>.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#D97757]">backgroundColor</td>
                  <td className="p-3">string (Hex)</td>
                  <td className="p-3">Optional</td>
                  <td className="p-3">Fallback canvas background color (e.g. <code className="font-mono">"#991B1B"</code>).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Using Local Images vs Remote Images */}
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEEB] flex items-center justify-center text-[#D97757]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D]">3. How to Use Local Images (Yes, Fully Supported!)</h2>
              <p className="text-xs text-[#8C867D]">Client-side file uploading and Base64 embedding</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-[#4A4642] leading-relaxed">
            <p>
              <strong>Are local images allowed? Yes!</strong> The API accepts local images via either:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-[#EAE6E1] rounded-xl p-4 bg-[#FAF8F5] space-y-2">
                <span className="font-bold text-xs text-[#1F1E1D] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2E7D32]" />
                  Method A: Base64 String in JSON (Recommended)
                </span>
                <p className="text-xs text-[#6B6661]">
                  Read your local image with FileReader or <code className="font-mono">fs.readFileSync()</code> and pass the Base64 string into <code className="font-mono">imageBase64</code>:
                </p>
                <pre className="p-2.5 bg-[#1F1E1D] text-[#EAE6E1] text-[11px] rounded font-mono overflow-x-auto">
{`"iconVariants": [
  {
    "id": "vip_gold",
    "name": "VIP Gold",
    "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
]`}
                </pre>
              </div>

              <div className="border border-[#EAE6E1] rounded-xl p-4 bg-[#FAF8F5] space-y-2">
                <span className="font-bold text-xs text-[#1F1E1D] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#2E7D32]" />
                  Method B: Multipart / FormData File Upload
                </span>
                <p className="text-xs text-[#6B6661]">
                  Upload directly with FormData using field <code className="font-mono">iconFile</code> or pass files inside the static project bundle:
                </p>
                <pre className="p-2.5 bg-[#1F1E1D] text-[#EAE6E1] text-[11px] rounded font-mono overflow-x-auto">
{`const formData = new FormData();
formData.append('name', 'Roulette');
formData.append('iconFile', localFileBlob);
formData.append('iconVariants', JSON.stringify(variants));`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Calling the Icon Switcher in Static HTML/JS */}
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEEB] flex items-center justify-center text-[#D97757]">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D]">4. How to Trigger Icon Changes in App Static Files</h2>
              <p className="text-xs text-[#8C867D]">Client JavaScript code for index.html</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#4A4642]">
              The LARP runtime automatically injects <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">larp-bridge.js</code> into your static HTML entrypoint. Inside your application, invoke <code className="bg-[#F0EEEB] px-1.5 py-0.5 rounded text-xs font-mono">window.Larp.setIcon(variantId)</code>:
            </p>

            <div className="relative">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1F1E1D] text-[#8C867D] text-xs font-mono rounded-t-xl border-b border-[#333]">
                <span>public/index.html (Static App Client Code)</span>
                <button
                  onClick={() => copyToClipboard(sampleStaticHtml, 'static-html')}
                  className="flex items-center gap-1.5 text-xs text-[#EAE6E1] hover:text-white transition-colors"
                >
                  {copiedKey === 'static-html' ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'static-html' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#141312] text-[#EAE6E1] text-xs font-mono overflow-x-auto rounded-b-xl max-h-[380px]">
                {sampleStaticHtml}
              </pre>
            </div>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 text-xs text-[#166534] space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Under the Hood (Android Native Behavior):
              </div>
              <p>
                When <code className="font-mono">window.Larp.setIcon('vip_gold')</code> is called, the native Java engine invokes <code className="font-mono">PackageManager.setComponentEnabledSetting()</code> to enable <code className="font-mono">.MainActivity_vip_gold</code> and disable all other aliases with <code className="font-mono">PackageManager.DONT_KILL_APP</code>. The Android OS updates the home screen icon without restarting or crashing the running app!
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Complete Request Payload Example */}
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEEB] flex items-center justify-center text-[#D97757]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D]">5. Full Production Request Payload Structure</h2>
              <p className="text-xs text-[#8C867D]">Ready-to-use JSON for POST /api/larp/build</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1F1E1D] text-[#8C867D] text-xs font-mono rounded-t-xl border-b border-[#333]">
                <span>Full JSON Request Payload</span>
                <button
                  onClick={() => copyToClipboard(samplePayloadJson, 'payload-json')}
                  className="flex items-center gap-1.5 text-xs text-[#EAE6E1] hover:text-white transition-colors"
                >
                  {copiedKey === 'payload-json' ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'payload-json' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#141312] text-[#EAE6E1] text-xs font-mono overflow-x-auto rounded-b-xl max-h-[380px]">
                {samplePayloadJson}
              </pre>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1F1E1D] text-[#8C867D] text-xs font-mono rounded-t-xl border-b border-[#333]">
                <span>cURL Command</span>
                <button
                  onClick={() => copyToClipboard(sampleCurlCommand, 'curl-cmd')}
                  className="flex items-center gap-1.5 text-xs text-[#EAE6E1] hover:text-white transition-colors"
                >
                  {copiedKey === 'curl-cmd' ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'curl-cmd' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#141312] text-[#EAE6E1] text-xs font-mono overflow-x-auto rounded-b-xl">
                {sampleCurlCommand}
              </pre>
            </div>
          </div>
        </section>

        {/* Section 6: API Endpoints Reference */}
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEEB] flex items-center justify-center text-[#D97757]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D]">6. Endpoints & Response Formats</h2>
              <p className="text-xs text-[#8C867D]">REST APIs with open CORS support</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[#EAE6E1] bg-[#FAF8F5] space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#2E7D32] text-white font-mono text-xs font-bold">POST</span>
                <span className="font-mono text-xs font-bold text-[#1F1E1D]">/api/larp/build</span>
              </div>
              <p className="text-xs text-[#6B6661]">
                Compiles or delegates the build. Returns download URLs, APK Base64, and GitHub runner status.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#EAE6E1] bg-[#FAF8F5] space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#1976D2] text-white font-mono text-xs font-bold">GET</span>
                <span className="font-mono text-xs font-bold text-[#1F1E1D]">/api/larp/build?format=zip</span>
              </div>
              <p className="text-xs text-[#6B6661]">
                Streams the raw binary ZIP file directly. Ideal for client-side blob downloads (<code className="font-mono">res.blob()</code>).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#EAE6E1] bg-[#FAF8F5] space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#1976D2] text-white font-mono text-xs font-bold">GET</span>
                <span className="font-mono text-xs font-bold text-[#1F1E1D]">/api/larp/download?file=lionel.apk</span>
              </div>
              <p className="text-xs text-[#6B6661]">
                Universal binary downloader with open CORS (<code className="font-mono">Access-Control-Allow-Origin: *</code>).
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

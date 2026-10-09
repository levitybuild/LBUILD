'use client';

import React, { useState } from 'react';
import { Terminal, Code, Copy, CheckCircle2, Globe, Sparkles } from 'lucide-react';

export function ApiReferenceSection() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'bridge' | 'analyze'>('build');

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const curlExample = `curl -X POST https://your-domain.com/api/larp/build \\
  -H "Content-Type: application/json" \\
  -d '{
    "appId": "com.mystudio.app",
    "name": "My Offline App",
    "version": "1.0.0",
    "fullscreen": true,
    "themeColor": "#D97757",
    "watchThemeColor": true,
    "splashScreen": {
      "type": "flat_color",
      "backgroundColor": "#FAF8F5",
      "duration": 2000,
      "autoHide": true
    },
    "iconVariants": [
      {
        "id": "default",
        "name": "Classic",
        "isDefault": true,
        "glyph": "⚡",
        "backgroundColor": "#D97757",
        "foregroundColor": "#FFFFFF"
      },
      {
        "id": "streak_fire",
        "name": "Fire Streak",
        "isDefault": false,
        "glyph": "🔥",
        "backgroundColor": "#EA580C",
        "foregroundColor": "#FFFFFF",
        "triggerCondition": "streak >= 7"
      }
    ],
    "staticBundle": {
      "entrypoint": "index.html",
      "files": [
        { "path": "index.html", "content": "<html>...</html>" }
      ]
    }
  }'`;

  const fetchExample = `// One-Click Build Function for your Static Editor
async function publishNativeApp(htmlCode, appName, appId) {
  const response = await fetch('/api/larp/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appId: appId || 'com.editor.export',
      name: appName || 'Static Export',
      version: '1.0.0',
      fullscreen: true,
      themeColor: '#D97757',
      watchThemeColor: true,
      splashScreen: { type: 'flat_color', backgroundColor: '#FAF8F5', duration: 2000, autoHide: true },
      iconVariants: [
        { id: 'default', name: 'Default', isDefault: true, glyph: '🦉', backgroundColor: '#D97757', foregroundColor: '#FFF' },
        { id: 'streak_fire', name: 'Streak', isDefault: false, glyph: '🔥', backgroundColor: '#EA580C', foregroundColor: '#FFF' }
      ],
      staticBundle: {
        entrypoint: 'index.html',
        files: [{ path: 'index.html', content: htmlCode }]
      }
    })
  });

  const result = await response.json();
  console.log('Download APK at:', result.artifacts[0].downloadUrl);
  return result;
}`;

  const bridgeJsExample = `// 1. Swap App Icon Dynamically (Duolingo Style)
LarpBridge.setIcon('streak_fire');

// 2. Change Android / iOS Status Bar & Theme Color
LarpBridge.setThemeColor('#2563EB');
// Or simply update your HTML meta tag:
document.querySelector('meta[name="theme-color"]').setAttribute('content', '#2563EB');

// 3. Toggle True Fullscreen (Immersive Sticky Mode)
LarpBridge.setFullscreen(true);

// 4. Trigger Native Device Haptic
LarpBridge.haptic('HEAVY'); // 'LIGHT' | 'MEDIUM' | 'HEAVY'

// 5. Hide Splash Screen Manually
LarpBridge.hideSplashScreen();`;

  return (
    <section id="api-docs" className="py-12 border-b border-[#EAE6E1]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1">
            Developer Integration Guide
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
            LARP REST API & Bridge Client SDK
          </h2>
          <p className="mt-2 text-sm text-[#6B6661] leading-relaxed">
            Integrate one-click native app compilation directly into your static code editor or build pipeline. Live machine-readable docs: <code className="font-mono text-[#D97757]">/api/docs</code>.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#F3EFEA] rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('build')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'build' ? 'bg-white text-[#1F1E1D] shadow-sm' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            POST /api/larp/build
          </button>
          <button
            onClick={() => setActiveTab('bridge')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'bridge' ? 'bg-white text-[#1F1E1D] shadow-sm' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            LarpBridge Client SDK
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'analyze' ? 'bg-white text-[#1F1E1D] shadow-sm' : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Static Code Editor Integration
          </button>
        </div>

        {/* Code Content */}
        {activeTab === 'build' && (
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-[#1F1E1D]">
                <span className="px-2 py-0.5 bg-[#D97757]/10 text-[#D97757] font-semibold rounded">POST</span>
                <span>/api/larp/build</span>
              </div>
              <button
                type="button"
                onClick={() => copyText(curlExample, 'curl')}
                className="text-xs text-[#6B6661] hover:text-[#1F1E1D] flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'curl' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy cURL</span>
              </button>
            </div>

            <pre className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl font-mono text-xs text-[#1F1E1D] overflow-x-auto leading-relaxed">
              {curlExample}
            </pre>
          </div>
        )}

        {activeTab === 'bridge' && (
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1F1E1D]">
                JavaScript Runtime Controls in your Bundled Web App
              </span>
              <button
                type="button"
                onClick={() => copyText(bridgeJsExample, 'bridge')}
                className="text-xs text-[#6B6661] hover:text-[#1F1E1D] flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'bridge' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JavaScript</span>
              </button>
            </div>

            <pre className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl font-mono text-xs text-[#1F1E1D] overflow-x-auto leading-relaxed">
              {bridgeJsExample}
            </pre>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1F1E1D]">
                Frontend Editor &quot;Export to App&quot; Handler
              </span>
              <button
                type="button"
                onClick={() => copyText(fetchExample, 'fetch')}
                className="text-xs text-[#6B6661] hover:text-[#1F1E1D] flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'fetch' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Fetch</span>
              </button>
            </div>

            <pre className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl font-mono text-xs text-[#1F1E1D] overflow-x-auto leading-relaxed">
              {fetchExample}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

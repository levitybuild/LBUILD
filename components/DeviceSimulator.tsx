'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Maximize2, Minimize2, Palette, Sparkles, RotateCcw, Home, Volume2, Shield, Wifi, Battery, Play } from 'lucide-react';
import { IconVariant } from '@/lib/larp/types';

interface DeviceSimulatorProps {
  htmlContent: string;
  themeColor: string;
  fullscreen: boolean;
  activeIconId: string;
  iconVariants: IconVariant[];
  appName: string;
}

export function DeviceSimulator({
  htmlContent,
  themeColor,
  fullscreen: initialFullscreen,
  activeIconId: initialActiveIconId,
  iconVariants,
  appName,
}: DeviceSimulatorProps) {
  const [overrideThemeColor, setOverrideThemeColor] = useState<string | null>(null);
  const [overrideFullscreen, setOverrideFullscreen] = useState<boolean | null>(null);
  const [overrideIconId, setOverrideIconId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'homescreen'>('app');
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [hapticTriggered, setHapticTriggered] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentThemeColor = overrideThemeColor ?? themeColor;
  const isFullscreen = overrideFullscreen ?? initialFullscreen;
  const activeIconId = overrideIconId ?? initialActiveIconId;

  // Inject script to listen for theme color and icon changes inside iframe
  const processedHtml = React.useMemo(() => {
    const bridgeHook = `
      <script>
        (function() {
          // Listen for theme-color meta mutations
          var meta = document.querySelector('meta[name="theme-color"]');
          if (meta) {
            window.parent.postMessage({ type: 'LARP_THEME_COLOR', color: meta.getAttribute('content') }, '*');
          }
          var obs = new MutationObserver(function() {
            var m = document.querySelector('meta[name="theme-color"]');
            if (m) {
              window.parent.postMessage({ type: 'LARP_THEME_COLOR', color: m.getAttribute('content') }, '*');
            }
          });
          if (meta) obs.observe(meta, { attributes: true });

          // Hook into window.LarpBridge if present
          window.addEventListener('larp:themecolorchange', function(e) {
            window.parent.postMessage({ type: 'LARP_THEME_COLOR', color: e.detail.color }, '*');
          });
          window.addEventListener('larp:iconchange', function(e) {
            window.parent.postMessage({ type: 'LARP_ICON_CHANGE', iconId: e.detail.iconId }, '*');
          });
          window.addEventListener('larp:fullscreenchange', function(e) {
            window.parent.postMessage({ type: 'LARP_FULLSCREEN_CHANGE', isFullscreen: e.detail.isFullscreen }, '*');
          });
        })();
      </script>
    `;

    if (htmlContent.includes('</head>')) {
      return htmlContent.replace('</head>', `${bridgeHook}</head>`);
    }
    return `${bridgeHook}${htmlContent}`;
  }, [htmlContent]);

  // Handle postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'LARP_THEME_COLOR' && e.data.color) {
        setOverrideThemeColor(e.data.color);
      } else if (e.data?.type === 'LARP_ICON_CHANGE' && e.data.iconId) {
        setOverrideIconId(e.data.iconId);
        setHapticTriggered(true);
        setTimeout(() => setHapticTriggered(false), 800);
      } else if (e.data?.type === 'LARP_FULLSCREEN_CHANGE') {
        setOverrideFullscreen(e.data.isFullscreen);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Calculate text contrast for status bar
  const isDarkColor = React.useMemo(() => {
    if (!currentThemeColor || currentThemeColor.charAt(0) !== '#') return false;
    const hex = currentThemeColor.substring(1);
    const num = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
  }, [currentThemeColor]);

  const activeIcon = iconVariants.find(v => v.id === activeIconId) || iconVariants[0];

  const triggerReplaySplash = () => {
    setShowSplash(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 1800);
  };

  return (
    <section id="simulator" className="py-12 border-b border-[#EAE6E1]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1">
            Real-Time Mobile Device Simulator
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
            Hardware & Native Runtime Verification
          </h2>
          <p className="mt-2 text-sm text-[#6B6661] leading-relaxed">
            Test true fullscreen immersion, dynamic status bar theme-color tracking, and Duolingo-style launcher icon swapping directly in the simulated Android / iOS container.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls & Diagnostics (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Simulation Modes */}
            <div className="p-5 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <span className="text-xs font-semibold text-[#1F1E1D] uppercase tracking-wider block">
                Simulator Viewports
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('app')}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    viewMode === 'app'
                      ? 'border-[#D97757] bg-[#D97757]/5 text-[#D97757] font-semibold'
                      : 'border-[#EAE6E1] text-[#6B6661] hover:text-[#1F1E1D]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Running Web App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('homescreen')}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    viewMode === 'homescreen'
                      ? 'border-[#D97757] bg-[#D97757]/5 text-[#D97757] font-semibold'
                      : 'border-[#EAE6E1] text-[#6B6661] hover:text-[#1F1E1D]'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home Screen (Icons)</span>
                </button>
              </div>
            </div>

            {/* Quick Hardware Toggles */}
            <div className="p-5 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <span className="text-xs font-semibold text-[#1F1E1D] uppercase tracking-wider block">
                Hardware Interactions
              </span>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setOverrideFullscreen(!isFullscreen)}
                  className="w-full p-3 rounded-xl border border-[#EAE6E1] hover:border-[#D97757] text-left text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#D97757]" /> : <Maximize2 className="w-4 h-4 text-[#D97757]" />}
                    <div>
                      <div className="font-semibold text-[#1F1E1D]">Toggle Fullscreen Mode</div>
                      <div className="text-[11px] text-[#6B6661]">
                        {isFullscreen ? 'Currently True Immersive (Bars Hidden)' : 'Standard Viewport (Status Bar Visible)'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#D97757]">
                    {isFullscreen ? 'IMMERSIVE' : 'NORMAL'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={triggerReplaySplash}
                  className="w-full p-3 rounded-xl border border-[#EAE6E1] hover:border-[#D97757] text-left text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#D97757]" />
                    <div>
                      <div className="font-semibold text-[#1F1E1D]">Replay Launch Splash Screen</div>
                      <div className="text-[11px] text-[#6B6661]">Experience the flat color fade transition</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#6B6661]">Replay</span>
                </button>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="p-5 bg-white border border-[#EAE6E1] rounded-2xl space-y-3 shadow-xs text-xs">
              <span className="font-semibold text-[#1F1E1D] uppercase tracking-wider block text-[11px]">
                Active Native State
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-[#FAF8F5]">
                  <span className="text-[#6B6661]">Status Bar Color:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: currentThemeColor }}
                    />
                    <span className="font-mono text-[#1F1E1D]">{currentThemeColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#FAF8F5]">
                  <span className="text-[#6B6661]">Status Bar Icons:</span>
                  <span className="font-medium text-[#1F1E1D]">{isDarkColor ? 'Light Icons' : 'Dark Icons'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#FAF8F5]">
                  <span className="text-[#6B6661]">Active Launcher Icon:</span>
                  <span className="font-medium text-[#1F1E1D] flex items-center gap-1.5">
                    <span>{activeIcon?.glyph}</span>
                    <span>{activeIcon?.name}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[#6B6661]">Haptic Engine:</span>
                  <span className={`font-mono transition-colors ${hapticTriggered ? 'text-[#D97757] font-bold' : 'text-[#8C867D]'}`}>
                    {hapticTriggered ? 'PULSE TRIGGERED' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Smartphone Mockup (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-[340px] md:w-[380px] h-[700px] bg-[#111] rounded-[48px] p-3 shadow-2xl border-4 border-[#222] relative flex flex-col overflow-hidden select-none">
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#18181b] mr-3" />
                <div className="w-2 h-2 rounded-full bg-[#09090b]" />
              </div>

              {/* Mobile Screen Container */}
              <div className="w-full h-full bg-white rounded-[38px] overflow-hidden relative flex flex-col">
                {/* 1. Android / iOS Status Bar */}
                <div
                  className={`h-11 px-6 flex items-center justify-between text-xs z-30 transition-all duration-300 ${
                    isFullscreen ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
                  }`}
                  style={{
                    backgroundColor: currentThemeColor,
                    color: isDarkColor ? '#FFFFFF' : '#1F1E1D',
                  }}
                >
                  <span className="font-semibold text-[11px] pt-1 tracking-tight">9:41</span>
                  <div className="flex items-center gap-2 pt-1">
                    <Wifi className="w-3.5 h-3.5" />
                    <Battery className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. Main Screen View */}
                {viewMode === 'app' ? (
                  <div className="flex-1 relative w-full h-full bg-[#FAF8F5] overflow-hidden">
                    {/* Splash Screen Overlay */}
                    {showSplash && (
                      <div
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300"
                        style={{ backgroundColor: currentThemeColor }}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-sm text-white font-bold">
                          {activeIcon?.glyph || 'L'}
                        </div>
                        <span className="mt-3 text-sm font-bold text-white tracking-tight">
                          {appName}
                        </span>
                      </div>
                    )}

                    {/* Web Content iframe */}
                    <iframe
                      ref={iframeRef}
                      srcDoc={processedHtml}
                      title="LARP Preview"
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                ) : (
                  /* 3. Mobile Home Screen Mockup (Showing Dynamic Icons) */
                  <div className="flex-1 bg-gradient-to-b from-[#2E3440] via-[#3B4252] to-[#434C5E] p-6 flex flex-col justify-between text-white relative">
                    <div className="pt-8">
                      <div className="text-center font-light text-4xl mb-1">9:41</div>
                      <div className="text-center text-xs opacity-70">Tuesday, October 8</div>
                    </div>

                    {/* App Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-12">
                      {/* Active LARP App Icon */}
                      <div
                        onClick={() => setViewMode('app')}
                        className="flex flex-col items-center gap-1 cursor-pointer group"
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20 transition-transform active:scale-95 relative"
                          style={{
                            backgroundColor: activeIcon.backgroundColor,
                            color: activeIcon.foregroundColor,
                          }}
                        >
                          {activeIcon.glyph}
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D97757] rounded-full border-2 border-white" />
                        </div>
                        <span className="text-[10px] font-medium text-center truncate max-w-full text-white/90">
                          {appName}
                        </span>
                      </div>

                      {/* Mock Other Apps */}
                      <div className="flex flex-col items-center gap-1 opacity-60">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-md">
                          🧭
                        </div>
                        <span className="text-[10px] text-white/80">Browser</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 opacity-60">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-md">
                          💬
                        </div>
                        <span className="text-[10px] text-white/80">Messages</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 opacity-60">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl shadow-md">
                          📷
                        </div>
                        <span className="text-[10px] text-white/80">Camera</span>
                      </div>
                    </div>

                    {/* Switcher Indicator */}
                    <div className="p-3 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                      <span className="text-[11px] block font-medium">Dynamic App Icon Active:</span>
                      <span className="text-xs font-bold text-[#D97757]">{activeIcon.name} ({activeIcon.glyph})</span>
                    </div>
                  </div>
                )}

                {/* 3. Android Navigation Bar (Home indicator) */}
                <div
                  className={`h-6 flex items-center justify-center z-30 transition-all duration-300 ${
                    isFullscreen ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
                  }`}
                  style={{
                    backgroundColor: isFullscreen ? 'transparent' : (viewMode === 'app' ? '#FAF8F5' : '#434C5E'),
                  }}
                >
                  <div className="w-32 h-1 bg-black/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

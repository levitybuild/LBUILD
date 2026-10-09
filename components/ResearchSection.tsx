'use client';

import React, { useState } from 'react';
import { Layers, ShieldCheck, Smartphone, Maximize2, Palette, Sparkles, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export function ResearchSection() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'fullscreen' | 'themecolor' | 'icons' | 'splash'>('comparison');

  return (
    <section id="research" className="py-12 border-b border-[#EAE6E1]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1">
            Engineering Research & Technical Evaluation
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
            Bundling Static Web Code into Native Apps Without Hosting
          </h2>
          <p className="mt-2 text-sm md:text-base text-[#6B6661] leading-relaxed">
            Detailed evaluation of native mobile app bundlers, comparing offline packaging capabilities, hardware bridge APIs, dynamic launcher icons, and true immersive fullscreen mechanics.
          </p>
        </div>

        {/* Tab Controls (Zero-pill discipline, clean segmented bar) */}
        <div className="flex items-center gap-1 p-1 bg-[#F3EFEA] rounded-xl w-fit mb-8 max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-white text-[#1F1E1D] shadow-sm'
                : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Bundler Comparison
          </button>
          <button
            onClick={() => setActiveTab('fullscreen')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'fullscreen'
                ? 'bg-white text-[#1F1E1D] shadow-sm'
                : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            True Fullscreen Engine
          </button>
          <button
            onClick={() => setActiveTab('themecolor')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'themecolor'
                ? 'bg-white text-[#1F1E1D] shadow-sm'
                : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Reactive Theme Color Sync
          </button>
          <button
            onClick={() => setActiveTab('icons')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'icons'
                ? 'bg-white text-[#1F1E1D] shadow-sm'
                : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Duolingo Dynamic Icons
          </button>
          <button
            onClick={() => setActiveTab('splash')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'splash'
                ? 'bg-white text-[#1F1E1D] shadow-sm'
                : 'text-[#6B6661] hover:text-[#1F1E1D]'
            }`}
          >
            Splash Screen Engine
          </button>
        </div>

        {/* Tab 1: Bundler Comparison */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="overflow-x-auto border border-[#EAE6E1] rounded-2xl bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE6E1] text-[#6B6661]">
                    <th className="py-3 px-4 font-semibold">Bundler / Technology</th>
                    <th className="py-3 px-4 font-semibold">Zero-Hosting Offline Packaging</th>
                    <th className="py-3 px-4 font-semibold">Dynamic Icon Switching</th>
                    <th className="py-3 px-4 font-semibold">Full Screen & Cutouts</th>
                    <th className="py-3 px-4 font-semibold">Suitability for Headless API</th>
                    <th className="py-3 px-4 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6E1] text-[#1F1E1D]">
                  <tr className="bg-[#FAF8F5]/50">
                    <td className="py-3.5 px-4 font-bold text-[#D97757] flex items-center gap-2">
                      <span>Capacitor 6 (Ionic)</span>
                      <span className="text-[10px] bg-[#D97757]/10 text-[#D97757] px-1.5 py-0.5 rounded font-mono font-medium">Recommended</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#2E7D32]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                        <span>Native Local Server</span>
                      </div>
                      <span className="text-xs text-[#6B6661] block mt-0.5">Embeds static files into asset folder; routes via http://localhost without CORS or hosting.</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-[#2E7D32]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Android & iOS Ready</span>
                      </div>
                      <span className="text-xs text-[#6B6661] block mt-0.5">Automated activity-alias & setAlternateIconName support.</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#2E7D32] font-medium">First-class (shortEdges + WindowInsets)</td>
                    <td className="py-3.5 px-4 text-[#2E7D32] font-medium">Excellent (Pure CLI & scriptable)</td>
                    <td className="py-3.5 px-4 font-semibold text-[#D97757]">Top Pick: Selected for LARP</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#1F1E1D]">Google TWA / Bubblewrap</td>
                    <td className="py-3.5 px-4 text-[#C62828]">
                      <div className="flex items-center gap-1.5 font-medium text-[#C62828]">
                        <XCircle className="w-4 h-4" />
                        <span>Requires Hosted URL</span>
                      </div>
                      <span className="text-xs text-[#6B6661] block mt-0.5">Requires assetlinks.json on a public HTTPS domain. Cannot bundle raw local static folders!</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#C62828]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Not Supported</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#C62828]">Standard browser frame only</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">CLI available, but fails offline constraint</td>
                    <td className="py-3.5 px-4 text-[#C62828] font-medium">Unsuitable (No offline zip bundling)</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#1F1E1D]">Apache Cordova</td>
                    <td className="py-3.5 px-4 text-[#2E7D32]">
                      <div className="flex items-center gap-1.5 font-medium text-[#2E7D32]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>file:/// protocol</span>
                      </div>
                      <span className="text-xs text-[#6B6661] block mt-0.5">Relies on file://, triggering modern browser CORS and Web Worker restrictions.</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6661]">Requires legacy third-party plugins</td>
                    <td className="py-3.5 px-4 text-[#D97706]">Partial (Deprecated Android 11+ status bar APIs)</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">Outdated toolchain (deprecated)</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">Legacy (Superseded by Capacitor)</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#1F1E1D]">Tauri Mobile (v2)</td>
                    <td className="py-3.5 px-4 text-[#2E7D32]">
                      <div className="flex items-center gap-1.5 font-medium text-[#2E7D32]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Rust IPC bridge</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#D97706]">Complex (Requires native Kotlin/Rust bridge)</td>
                    <td className="py-3.5 px-4 text-[#2E7D32]">Good (Wry/WKWebView)</td>
                    <td className="py-3.5 px-4 text-[#D97706]">Heavier compile toolchain (Rust + NDK)</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">Promising, but mobile ecosystem is young</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#1F1E1D]">React Native / Expo</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">
                      <span>Requires react-native-webview</span>
                      <span className="text-xs text-[#6B6661] block mt-0.5">Heavy JS runtime (~30MB) designed for React native components, not raw HTML/CSS.</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#2E7D32]">Possible via native modules</td>
                    <td className="py-3.5 px-4 text-[#2E7D32]">Supported</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">Overhead is unnecessarily high</td>
                    <td className="py-3.5 px-4 text-[#6B6661]">Too heavy for static site editors</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white border border-[#EAE6E1] rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-[#1F1E1D]">Why Capacitor 6 is the clear architectural choice:</h4>
                <p className="text-xs text-[#6B6661] mt-1">
                  Capacitor bundles offline HTML/CSS/JS directly into native Android (`android/app/src/main/assets/public`) and iOS (`ios/App/App/public`) without requiring remote web hosting. It runs a local embedded webview server (`http://localhost`), bypassing CORS restrictions while providing direct TypeScript and Kotlin bridge access to native device hardware.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: True Fullscreen Engine */}
        {activeTab === 'fullscreen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl">
              <div className="flex items-center gap-2 text-[#D97757] font-semibold text-sm mb-3">
                <Maximize2 className="w-4 h-4" />
                <span>Why Normal WebViews Fail at Fullscreen</span>
              </div>
              <ul className="space-y-3 text-xs md:text-sm text-[#6B6661] leading-relaxed">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                  <span><strong>fitsSystemWindows forced padding:</strong> Standard Android themes pad the layout by the status bar height, leaving a dead black bar at the top.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                  <span><strong>Camera Notch & Cutout Clipping:</strong> Without `layoutInDisplayCutoutMode = shortEdges`, Android renders a letterbox barrier around camera hole-punches.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                  <span><strong>Accidental System Bar Pops:</strong> Non-sticky fullscreen reveals navigation bars on single touch instead of transient swipe gestures.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl">
              <div className="flex items-center gap-2 text-[#2E7D32] font-semibold text-sm mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>How LARP Implements 100% Working Fullscreen</span>
              </div>
              <div className="space-y-3 text-xs md:text-sm text-[#6B6661] leading-relaxed">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] font-mono text-[11px] text-[#1F1E1D] space-y-1">
                  <div>{'// 1. Android Window Insets Controller'}</div>
                  <div>WindowCompat.setDecorFitsSystemWindows(window, false);</div>
                  <div>controller.hide(WindowInsetsCompat.Type.systemBars());</div>
                  <div>controller.setSystemBarsBehavior(BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);</div>
                  <div>{'// 2. Display Cutout Full Coverage'}</div>
                  <div>layoutParams.layoutInDisplayCutoutMode = SHORT_EDGES;</div>
                </div>
                <p className="text-xs text-[#6B6661]">
                  LARP injects both native Android 12+ `WindowInsetsControllerCompat` configurations AND automatically injects `viewport-fit=cover` into your static HTML&apos;s &lt;meta name=&quot;viewport&quot;&gt; with CSS safe-area variables.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reactive Theme Color Sync */}
        {activeTab === 'themecolor' && (
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#D97757] font-semibold text-sm">
              <Palette className="w-4 h-4" />
              <span>Real-Time Mobile Status Bar & Navigation Bar Synchronization</span>
            </div>
            <p className="text-xs md:text-sm text-[#6B6661] leading-relaxed">
              When a website changes its theme (e.g. user toggles dark mode or clicks a color theme button), LARP ensures the native Android Status Bar and Navigation Bar immediately adapt to match, rather than staying stuck on an arbitrary static color.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1]">
                <div className="font-semibold text-xs text-[#1F1E1D] mb-1">1. Static Editor DOM</div>
                <div className="font-mono text-[11px] text-[#D97757] bg-white p-2 rounded border border-[#EAE6E1]">
                  &lt;meta name=&quot;theme-color&quot; content=&quot;#D97757&quot;&gt;
                </div>
                <p className="text-[11px] text-[#6B6661] mt-2">Any script or stylesheet updates the meta tag in the DOM.</p>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1]">
                <div className="font-semibold text-xs text-[#1F1E1D] mb-1">2. LARP MutationObserver</div>
                <div className="font-mono text-[11px] text-[#1F1E1D] bg-white p-2 rounded border border-[#EAE6E1]">
                  new MutationObserver((mutations) =&gt; &#123; ... &#125;)
                </div>
                <p className="text-[11px] text-[#6B6661] mt-2">Zero-latency observer detects content change and calculates luma contrast.</p>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1]">
                <div className="font-semibold text-xs text-[#1F1E1D] mb-1">3. Native Status Bar API</div>
                <div className="font-mono text-[11px] text-[#2E7D32] bg-white p-2 rounded border border-[#EAE6E1]">
                  StatusBar.setBackgroundColor(&#123; color &#125;)
                </div>
                <p className="text-[11px] text-[#6B6661] mt-2">Native Android &amp; iOS status bar and icon tint adapt instantaneously.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Duolingo Dynamic Icons */}
        {activeTab === 'icons' && (
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#D97757] font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>How Dynamic App Icon Swapping Works on Android &amp; iOS</span>
            </div>
            <p className="text-xs md:text-sm text-[#6B6661] leading-relaxed">
              Duolingo changes its app icon dynamically when a user reaches a 7-day streak or turns on dark mode. In native apps, you cannot simply swap an image file at runtime. Instead, LARP pre-configures native manifest aliases:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] space-y-2">
                <span className="font-semibold text-xs text-[#1F1E1D]">Android Architecture: &lt;activity-alias&gt;</span>
                <p className="text-xs text-[#6B6661]">
                  LARP writes an &lt;activity-alias&gt; in `AndroidManifest.xml` for each icon preset (Fire, Stealth, Golden). At runtime, `LarpBridge.setIcon(&apos;streak_fire&apos;)` calls Android&apos;s `PackageManager.setComponentEnabledSetting()` to enable the target alias and disable the previous one without reinstalling the app!
                </p>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] space-y-2">
                <span className="font-semibold text-xs text-[#1F1E1D]">iOS Architecture: CFBundleAlternateIcons</span>
                <p className="text-xs text-[#6B6661]">
                  LARP configures the `Info.plist` with a `CFBundleAlternateIcons` dictionary for each variant. The runtime bridge calls `UIApplication.shared.setAlternateIconName(&quot;streak_fire&quot;)`.
                </p>
              </div>
            </div>
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-center justify-between">
              <span className="text-xs text-[#1F1E1D] font-medium">Static Web App JavaScript Trigger:</span>
              <code className="text-xs font-mono font-semibold text-[#D97757]">LarpBridge.setIcon(&apos;streak_fire&apos;);</code>
            </div>
          </div>
        )}

        {/* Tab 5: Splash Screen Engine */}
        {activeTab === 'splash' && (
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#D97757] font-semibold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Custom Splash Screen vs Flat Color Options</span>
            </div>
            <p className="text-xs md:text-sm text-[#6B6661] leading-relaxed">
              Most generators force the app icon onto a white square as the splash screen. LARP gives static site creators complete freedom:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1]">
                <h5 className="font-semibold text-xs text-[#1F1E1D] mb-1">Flat Color Splash</h5>
                <p className="text-xs text-[#6B6661]">
                  A clean, modern solid or brand-colored launch screen with seamless zero-jitter transition into the static HTML canvas.
                </p>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1]">
                <h5 className="font-semibold text-xs text-[#1F1E1D] mb-1">Branded Icon Splash</h5>
                <p className="text-xs text-[#6B6661]">
                  Centered vector glyph or company mark with configurable launch duration, fade-in, and fade-out animation curves.
                </p>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1]">
                <h5 className="font-semibold text-xs text-[#1F1E1D] mb-1">Auto-Hide on DOM Ready</h5>
                <p className="text-xs text-[#6B6661]">
                  Automatically dismisses when your static bundle&apos;s DOM and scripts are fully hydrated, avoiding premature white flickers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

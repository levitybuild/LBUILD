'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ResearchSection } from '@/components/ResearchSection';
import { BundlerConsole } from '@/components/BundlerConsole';
import { DeviceSimulator } from '@/components/DeviceSimulator';
import { DownloadsSection } from '@/components/DownloadsSection';
import { ApiReferenceSection } from '@/components/ApiReferenceSection';
import { SAMPLE_TEMPLATES } from '@/lib/larp/sample-templates';
import { GeneratedArtifact, LarpBuildResult, IconVariant } from '@/lib/larp/types';
import { ArrowRight, Sparkles, Smartphone, ShieldCheck, Download, Code, Maximize2 } from 'lucide-react';

const INITIAL_ARTIFACTS: GeneratedArtifact[] = []; /* populated only by a completed build */

export default function HomePage() {
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>(INITIAL_ARTIFACTS);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);

  // Simulator preview state
  const [previewState, setPreviewState] = useState({
    html: SAMPLE_TEMPLATES[0].files[0].content,
    themeColor: '#D97757',
    fullscreen: false,
    appName: 'StreakHero',
    activeIconId: 'default',
    iconVariants: [
      {
        id: 'default',
        name: 'Default icon',
        isDefault: true,
        glyph: '',
        backgroundColor: '#D97757',
        foregroundColor: '#FFFFFF',
        description: 'Upload an image to use as the launcher icon.',
      },
    ] as IconVariant[],
  });

  const [signingInfo, setSigningInfo] = useState<{
    sha256Fingerprint: string;
    sha1Fingerprint: string;
    alias: string;
  }>({
    sha256Fingerprint: '4C:91:E2:B0:81:4A:9F:77:3B:18:65:C2:5E:AA:91:02',
    sha1Fingerprint: 'A1:38:F4:7D:99:02:44:B6:7E:11:09:55:12:88:AC:21',
    alias: 'larp_release',
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBuildComplete = (result: LarpBuildResult) => {
    const nextArtifacts = result.artifacts || [];
    setArtifacts(nextArtifacts);

    // Start the complete bundle download as soon as the API confirms all
    // generated files have been materialized.
    const archiveUrl = result.zipDownloadUrl || nextArtifacts.find(a => a.type === 'source_zip')?.downloadUrl;
    if (archiveUrl) {
      const link = document.createElement('a');
      link.href = archiveUrl;
      link.download = result.zipFilename || nextArtifacts.find(a => a.type === 'source_zip')?.filename || 'larp-build-artifacts.zip';
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => link.remove(), 1000);
    }
    if (result.signingInfo) {
      setSigningInfo({
        sha256Fingerprint: result.signingInfo.sha256Fingerprint,
        sha1Fingerprint: result.signingInfo.sha1Fingerprint,
        alias: result.signingInfo.alias,
      });
    }
    scrollToSection('downloads');
  };

  const handleQuickBuild = () => {
    scrollToSection('bundler');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1E1D] flex flex-col font-sans selection:bg-[#D97757]/20 selection:text-[#D97757]">
      {/* Navbar (Top Bar Contract) */}
      <Navbar
        onScrollTo={scrollToSection}
        onQuickBuild={handleQuickBuild}
        isBuilding={isBuilding}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 border-b border-[#EAE6E1]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              {/* Unboxed editorial category */}
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D97757] mb-3">
                <span>Capacitor Native Engine</span>
                <span aria-hidden="true">·</span>
                <span>Zero Remote Hosting Required</span>
                <span aria-hidden="true">·</span>
                <span>Play Store & iOS Ready</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1F1E1D] leading-[1.15] text-balance">
                Bundle Static Web Code into Native Apps Without Hosting.
              </h1>

              <p className="mt-4 text-base md:text-lg text-[#6B6661] leading-relaxed">
                LARP packages raw HTML, CSS, and JavaScript into production-signed Android APKs, Google Play App Bundles (AAB), and iOS projects. Featuring true 100% immersive fullscreen, reactive status bar theme tracking, flat-color splash screens, and Duolingo-style dynamic app icon swapping.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => scrollToSection('bundler')}
                  className="px-5 py-3 text-xs md:text-sm font-semibold text-white bg-[#D97757] hover:bg-[#C86646] active:scale-[0.98] rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Bundler Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('downloads')}
                  className="px-5 py-3 text-xs md:text-sm font-semibold text-[#1F1E1D] bg-white hover:bg-[#FAF8F5] border border-[#EAE6E1] active:scale-[0.98] rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#D97757]" />
                  <span>Download Demo APK & AAB</span>
                </button>

                <button
                  onClick={() => scrollToSection('research')}
                  className="px-4 py-3 text-xs md:text-sm font-medium text-[#6B6661] hover:text-[#1F1E1D] transition-colors cursor-pointer"
                >
                  <span>Read Engineering Research</span>
                </button>
              </div>

              {/* Unboxed Metadata Metrics (Zero-pill discipline) */}
              <div className="mt-12 pt-8 border-t border-[#EAE6E1] grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#1F1E1D] font-mono tabular-nums">
                    100%
                  </div>
                  <div className="text-xs text-[#6B6661] mt-0.5">Offline Local Server</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#1F1E1D] font-mono tabular-nums">
                    0ms
                  </div>
                  <div className="text-xs text-[#6B6661] mt-0.5">Theme Sync Latency</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#1F1E1D] font-mono tabular-nums">
                    &lt;activity&gt;
                  </div>
                  <div className="text-xs text-[#6B6661] mt-0.5">Dynamic Icon Aliases</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-[#1F1E1D] font-mono tabular-nums">
                    25 Yrs
                  </div>
                  <div className="text-xs text-[#6B6661] mt-0.5">Keystore Validity</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Research Section */}
        <ResearchSection />

        {/* 2. Bundler Console */}
        <BundlerConsole
          onBuildComplete={handleBuildComplete}
  onPreviewUpdate={setPreviewState}
  onPayloadChange={setLastPayload}
  isBuilding={isBuilding}
          setIsBuilding={setIsBuilding}
        />

        {/* 3. Real-Time Device Simulator */}
        <DeviceSimulator
        htmlContent={previewState.html}
        appName={previewState.appName}
        themeColor={previewState.themeColor}
          fullscreen={previewState.fullscreen}
          activeIconId={previewState.activeIconId}
          iconVariants={previewState.iconVariants}
        />

        {/* 4. Downloads & Artifacts Section */}
        <DownloadsSection
          artifacts={artifacts}
          signingInfo={signingInfo}
        />

        {/* 5. API Reference Section */}
        <ApiReferenceSection lastPayload={lastPayload} />
      </main>

      {/* Footer (Anti-slop compliant: Quiet copyright and clean links) */}
      <footer className="border-t border-[#EAE6E1] bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C867D]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1F1E1D]">LARP</span>
            <span>·</span>
            <span>Lightweight App Runtime & Packager</span>
            <span>·</span>
            <span>Capacitor 6 Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => scrollToSection('research')} className="hover:text-[#1F1E1D] cursor-pointer">
              Research
            </button>
            <button onClick={() => scrollToSection('bundler')} className="hover:text-[#1F1E1D] cursor-pointer">
              Bundler
            </button>
            <button onClick={() => scrollToSection('api-docs')} className="hover:text-[#1F1E1D] cursor-pointer">
              API Docs
            </button>
            <button onClick={() => scrollToSection('downloads')} className="hover:text-[#1F1E1D] cursor-pointer">
              Downloads
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

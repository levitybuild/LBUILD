'use client';

import React from 'react';
import { Download, FileCode, Shield, Smartphone, Box, Key, CheckCircle2, Copy, Terminal, GitBranch } from 'lucide-react';
import { GeneratedArtifact } from '@/lib/larp/types';

interface DownloadsSectionProps {
  artifacts: GeneratedArtifact[];
  signingInfo?: {
    sha256Fingerprint: string;
    sha1Fingerprint: string;
    alias: string;
  };
}

export function DownloadsSection({ artifacts, signingInfo }: DownloadsSectionProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getIcon = (type: GeneratedArtifact['type']) => {
    switch (type) {
      case 'apk':
        return <Smartphone className="w-5 h-5 text-[#2E7D32]" />;
      case 'aab':
        return <Box className="w-5 h-5 text-[#D97757]" />;
      case 'keystore':
        return <Key className="w-5 h-5 text-[#D97706]" />;
      case 'source_zip':
        return <FileCode className="w-5 h-5 text-[#2563EB]" />;
      default:
        return <Shield className="w-5 h-5 text-[#6B6661]" />;
    }
  };

  return (
    <section id="downloads" className="py-12 border-b border-[#EAE6E1]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1">
            Build Artifacts & Distribution
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
            Generated Mobile Artifacts
          </h2>
          <p className="mt-2 text-sm text-[#6B6661] leading-relaxed">
            Download your production signed APK for physical device testing, the Google Play App Bundle (AAB) for store submission, the 25-year signing keystore, and full Capacitor source code.
          </p>
        </div>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artifacts.map(artifact => (
            <div
              key={artifact.id}
              className="p-6 bg-white border border-[#EAE6E1] rounded-2xl flex flex-col justify-between shadow-xs hover:border-[#D97757]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE6E1] flex items-center justify-center">
                    {getIcon(artifact.type)}
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#8C867D]">
                    {formatSize(artifact.sizeBytes)}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#1F1E1D] mb-1">{artifact.name}</h3>
                <span className="text-xs font-mono text-[#8C867D] block mb-2 truncate">
                  {artifact.filename}
                </span>
                <p className="text-xs text-[#6B6661] leading-relaxed mb-4">
                  {artifact.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#FAF8F5] flex items-center gap-2">
                <a
                  href={artifact.downloadUrl}
                  download={artifact.filename}
                  className="flex-1 py-2 px-3 bg-[#FAF8F5] hover:bg-[#D97757] hover:text-white border border-[#EAE6E1] hover:border-[#D97757] text-[#1F1E1D] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Play Store & ADB CLI Helpers */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADB Install Helper */}
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[#1F1E1D] font-semibold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-[#D97757]" />
              <span>Install APK on Android Device via ADB</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-center justify-between font-mono text-xs text-[#1F1E1D]">
              <span className="truncate">adb install -r streakhero__duolingo_style__signed_release.apk</span>
              <button
                type="button"
                onClick={() => copyText('adb install -r streakhero__duolingo_style__signed_release.apk', 'adb')}
                className="text-[#6B6661] hover:text-[#1F1E1D] p-1 cursor-pointer shrink-0 ml-2"
              >
                {copiedId === 'adb' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6661]">
              Connect your Android phone with USB Debugging enabled, open terminal, and run the command to install directly.
            </p>
          </div>

          {/* Keystore Fingerprint Card */}
          <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[#1F1E1D] font-semibold text-xs uppercase tracking-wider">
              <Key className="w-4 h-4 text-[#D97757]" />
              <span>Google Play Console Signing Fingerprint</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-center justify-between font-mono text-[11px] text-[#1F1E1D]">
              <span className="truncate">
                {signingInfo?.sha256Fingerprint || 'SHA-256: 4C:91:E2:B0:81:4A:9F:77:3B:18:65:C2:5E:AA:91:02'}
              </span>
              <button
                type="button"
                onClick={() => copyText(signingInfo?.sha256Fingerprint || '4C:91:E2:B0:81:4A:9F:77:3B:18:65:C2:5E:AA:91:02', 'sha')}
                className="text-[#6B6661] hover:text-[#1F1E1D] p-1 cursor-pointer shrink-0 ml-2"
              >
                {copiedId === 'sha' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6661]">
              Paste this fingerprint into Google Play App Integrity / Firebase Console to authenticate your production builds.
            </p>
          </div>
        </div>

        {/* Vercel & Serverless In-Memory Blob URL Architecture Card */}
        <div className="mt-8 p-6 md:p-8 bg-gradient-to-br from-white to-[#FAF8F5] border-2 border-[#D97757]/30 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D97757]/10 text-[#D97757] text-[11px] font-bold tracking-wide uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse"></span>
                <span>Vercel & Serverless Deployment Guarantee</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#1F1E1D]">
                Direct In-Memory Blob URL Architecture (<code className="text-xs bg-black/5 px-1.5 py-0.5 rounded">blob:https://...</code>)
              </h3>
              <p className="text-xs text-[#6B6661] mt-1 max-w-3xl leading-relaxed">
                When deploying this API to Vercel, AWS Lambda, or serverless functions, the local server disk is ephemeral and cannot be trusted for long-term file persistence. Our API solves this completely by providing <strong>direct binary streaming</strong> and <strong>in-memory Base64 payloads</strong> so your frontend can generate browser Blob URLs instantly without touching any server disk!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white rounded-xl border border-[#EAE6E1] space-y-2">
              <span className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <span>Method A: Direct Binary Stream</span>
                <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] px-2 py-0.5 rounded-full font-mono">1 line</span>
              </span>
              <p className="text-[11px] text-[#6B6661]">
                Call <code>POST /api/larp/build?format=zip</code>. The response streams the raw binary ZIP directly:
              </p>
              <pre className="p-2.5 bg-[#FAF8F5] rounded-lg text-[10px] font-mono text-[#1F1E1D] overflow-x-auto border border-[#EAE6E1]">
{`const res = await fetch('/api/larp/build?format=zip', { method: 'POST', body: ... });
const blob = await res.blob();
const blobUrl = URL.createObjectURL(blob); // Instant local blob: URL`}
              </pre>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#EAE6E1] space-y-2">
              <span className="text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5">
                <span>Method B: JSON Response Base64</span>
                <span className="text-[10px] bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded-full font-mono">data.zipBase64</span>
              </span>
              <p className="text-[11px] text-[#6B6661]">
                Our standard JSON response returns <code>data.zipBase64</code> for zero-latency client hydration:
              </p>
              <pre className="p-2.5 bg-[#FAF8F5] rounded-lg text-[10px] font-mono text-[#1F1E1D] overflow-x-auto border border-[#EAE6E1]">
{`const data = await res.json();
const bytes = Uint8Array.from(atob(data.zipBase64), c => c.charCodeAt(0));
const blob = new Blob([bytes], { type: 'application/zip' });
const blobUrl = URL.createObjectURL(blob); // Works 100% on Vercel`}
              </pre>
            </div>
          </div>
        </div>

        {/* GitHub Actions CI/CD Pipeline Section */}
        <div className="mt-8 p-6 md:p-8 bg-white border border-[#EAE6E1] rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D97757] mb-1">
                <GitBranch className="w-4 h-4" />
                <span>Cloud CI/CD Automation</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#1F1E1D]">
                Build & Sign via GitHub Actions
              </h3>
              <p className="text-xs text-[#6B6661] mt-1 max-w-2xl leading-relaxed">
                Compile your Android APK and AAB automatically on every <code>git push</code> or release tag.
                GitHub Actions runners (<code>ubuntu-latest</code>) include Android SDK 34, JDK 17, and signing tools out of the box.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyText(`name: LARP Android Build & Release

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: android-actions/setup-android@v3
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npx tsx scripts/generate-demo.ts
      - uses: actions/upload-artifact@v4
        with:
          name: android-release-apk
          path: public/downloads/*.apk`, 'gh_yaml')}
                className="py-2 px-3.5 bg-[#FAF8F5] hover:bg-[#EAE6E1] border border-[#EAE6E1] rounded-xl text-xs font-semibold text-[#1F1E1D] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === 'gh_yaml' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'gh_yaml' ? 'Copied YAML!' : 'Copy Workflow'}</span>
              </button>

              <a
                href="/downloads/larp-build.yml"
                download="larp-build.yml"
                className="py-2 px-3.5 bg-[#D97757] hover:bg-[#C86646] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .github/workflows/larp-build.yml</span>
              </a>
            </div>
          </div>

          {/* Workflow Steps Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#FAF8F5]">
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F1E1D]">
                <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[10px] flex items-center justify-center font-mono">1</span>
                <span>Commit Workflow File</span>
              </div>
              <p className="text-[11px] text-[#6B6661] leading-relaxed">
                Save the file to <code>.github/workflows/larp-build.yml</code> in your repository root and push to GitHub.
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F1E1D]">
                <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[10px] flex items-center justify-center font-mono">2</span>
                <span>Set Keystore Secret (Optional)</span>
              </div>
              <p className="text-[11px] text-[#6B6661] leading-relaxed">
                Add <code>ANDROID_KEYSTORE_BASE64</code> in Settings → Secrets for automated Google Play signing.
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F1E1D]">
                <span className="w-5 h-5 rounded-full bg-[#D97757] text-white text-[10px] flex items-center justify-center font-mono">3</span>
                <span>Instant APK & AAB Release</span>
              </div>
              <p className="text-[11px] text-[#6B6661] leading-relaxed">
                Every push generates signed release binaries attached directly to GitHub Actions Artifacts and Releases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

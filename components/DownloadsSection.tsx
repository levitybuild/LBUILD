'use client';

import React from 'react';
import { Download, FileCode, Shield, Smartphone, Box, Key, CheckCircle2, Copy, Terminal } from 'lucide-react';
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
      </div>
    </section>
  );
}

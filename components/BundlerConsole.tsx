'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  ShieldCheck,
  Smartphone,
  Maximize2,
  Palette,
  Sparkles,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Code,
  Download,
  Play,
  Eye,
  GitBranch,
  Upload,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  Terminal,
  ExternalLink,
  Flame,
  Zap,
  Box,
} from 'lucide-react';
import { LarpBuildConfig, LarpBuildResult, IconVariant, StaticFile } from '@/lib/larp/types';
import { SAMPLE_TEMPLATES, SampleTemplate } from '@/lib/larp/sample-templates';

interface BundlerConsoleProps {
  onBuildComplete: (result: LarpBuildResult) => void;
  onPreviewUpdate: (state: {
    html: string;
    themeColor: string;
    fullscreen: boolean;
    activeIconId: string;
    iconVariants: IconVariant[];
  }) => void;
  isBuilding: boolean;
  setIsBuilding: (val: boolean) => void;
}

const COMMON_PERMISSIONS = [
  { id: 'android.permission.INTERNET', label: 'Full Internet Access', required: true },
  { id: 'android.permission.CAMERA', label: 'Camera & Video Capture' },
  { id: 'android.permission.RECORD_AUDIO', label: 'Microphone & Audio Record' },
  { id: 'android.permission.ACCESS_FINE_LOCATION', label: 'Precise GPS Location' },
  { id: 'android.permission.POST_NOTIFICATIONS', label: 'Push & Local Notifications' },
  { id: 'android.permission.BLUETOOTH', label: 'Bluetooth Device Communication' },
  { id: 'android.permission.VIBRATE', label: 'Haptic Feedback & Vibration' },
];

export function BundlerConsole({
  onBuildComplete,
  onPreviewUpdate,
  isBuilding,
  setIsBuilding,
}: BundlerConsoleProps) {
  // Selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('streak_habit');

  // App Identity
  const [appId, setAppId] = useState<string>('com.lourdjvke.lionel');
  const [appName, setAppName] = useState<string>('Lionel App');
  const [version, setVersion] = useState<string>('1.0.0');
  const [versionCode, setVersionCode] = useState<number>(101);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>('#D97757');
  const [watchThemeColor, setWatchThemeColor] = useState<boolean>(true);
  const [keepAwake, setKeepAwake] = useState<boolean>(true);

  // GitHub CI/CD Bridge
  const [githubUsername, setGithubUsername] = useState<string>('lourdjvke');
  const [githubToken, setGithubToken] = useState<string>('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');
  const [githubRepo, setGithubRepo] = useState<string>('larp-android-app-v6');

  // Splash Screen Config
  const [splashType, setSplashType] = useState<'flat_color' | 'custom_icon' | 'full_image'>('custom_icon');
  const [splashBgColor, setSplashBgColor] = useState<string>('#FAF8F5');
  const [splashDuration, setSplashDuration] = useState<number>(1500);
  const [splashAutoHide, setSplashAutoHide] = useState<boolean>(true);
  const [splashImageUrl, setSplashImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256'
  );
  const [splashImageBase64, setSplashImageBase64] = useState<string>('');

  // Dynamic Icon Variants (customizable with own image URL, Base64, or custom ID)
  const [iconVariants, setIconVariants] = useState<IconVariant[]>([
    {
      id: 'default',
      name: 'Primary Launcher Icon',
      isDefault: true,
      glyph: '⚡',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=192',
      backgroundColor: '#D97757',
      foregroundColor: '#FFFFFF',
      description: 'Default Android home-screen icon',
    },
    {
      id: 'streak_fire',
      name: 'Fire Streak Alternative',
      isDefault: false,
      glyph: '🔥',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=192',
      backgroundColor: '#EA580C',
      foregroundColor: '#FFFFFF',
      triggerCondition: 'streak >= 7 days',
      description: 'Dynamic icon for active user streaks',
    },
    {
      id: 'stealth_dark',
      name: 'Nocturnal Dark Icon',
      isDefault: false,
      glyph: '🌙',
      imageUrl: '',
      backgroundColor: '#18181B',
      foregroundColor: '#FACC15',
      triggerCondition: 'theme == dark',
      description: 'High-contrast nocturnal icon alias',
    },
  ]);

  // Active editing icon variant index
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(0);

  // Permissions
  const [permissions, setPermissions] = useState<string[]>([
    'android.permission.INTERNET',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.VIBRATE',
  ]);

  // Code editor & ZIP bundle upload
  const [codeContent, setCodeContent] = useState<string>(SAMPLE_TEMPLATES[0].files[0].content);
  const [uploadedZipBase64, setUploadedZipBase64] = useState<string | null>(null);
  const [uploadedZipName, setUploadedZipName] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

  // Payload viewer tab
  const [payloadTab, setPayloadTab] = useState<'js' | 'json' | 'curl'>('js');
  const [isPayloadCopied, setIsPayloadCopied] = useState<boolean>(false);
  const [isGuideCopied, setIsGuideCopied] = useState<boolean>(false);
  const originUrl = React.useSyncExternalStore(
    () => () => {},
    () => (typeof window !== 'undefined' ? window.location.origin : ''),
    () => ''
  );

  const effectiveOrigin = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-tnkazkbrm2nbsbh6tandtv-524636078991.europe-west2.run.app');
  const apiEndpointUrl = `${effectiveOrigin}/api/larp/build`;
  const downloadApiUrl = `${effectiveOrigin}/api/larp/download`;

  // Sync with simulator preview
  const syncPreview = (updates?: Partial<{ html: string; themeColor: string; fullscreen: boolean; variants: IconVariant[] }>) => {
    const vars = updates?.variants ?? iconVariants;
    const defaultVar = vars.find(v => v.isDefault) || vars[0];
    onPreviewUpdate({
      html: updates?.html ?? codeContent,
      themeColor: updates?.themeColor ?? themeColor,
      fullscreen: updates?.fullscreen ?? fullscreen,
      activeIconId: defaultVar?.id || 'default',
      iconVariants: vars,
    });
  };

  // Handle template switch
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = SAMPLE_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;

    setAppName(tpl.name);
    setAppId(tpl.appId);
    setThemeColor(tpl.themeColor);
    setFullscreen(tpl.fullscreen);
    setCodeContent(tpl.files[0].content);

    syncPreview({
      html: tpl.files[0].content,
      themeColor: tpl.themeColor,
      fullscreen: tpl.fullscreen,
    });
  };

  // ZIP upload
  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedZipName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setUploadedZipBase64(b64);
      setAutoDetectNotice(`Loaded multi-file ZIP archive (${file.name})`);
      setTimeout(() => setAutoDetectNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Auto-detect permissions
  const handleAutoDetect = async () => {
    setAutoDetectNotice('Analyzing DOM tags and JS APIs...');
    try {
      const res = await fetch('/api/larp/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [{ path: 'index.html', content: codeContent }],
        }),
      });
      const data = await res.json();
      if (data.detectedPermissions) {
        const detectedIds = data.detectedPermissions.map((p: { permission: string }) => p.permission);
        setPermissions(prev => Array.from(new Set([...prev, ...detectedIds])));
        if (data.detectedThemeColor) {
          setThemeColor(data.detectedThemeColor);
          syncPreview({ themeColor: data.detectedThemeColor });
        }
        setAutoDetectNotice(`Auto-configured ${data.detectedPermissions.length} permissions & theme.`);
        setTimeout(() => setAutoDetectNotice(null), 4000);
      }
    } catch {
      setAutoDetectNotice('Auto-detection notice: using standard set.');
      setTimeout(() => setAutoDetectNotice(null), 3000);
    }
  };

  // Icon Variant operations
  const handleUpdateVariant = (index: number, updates: Partial<IconVariant>) => {
    setIconVariants(prev => {
      const next = prev.map((v, i) => (i === index ? { ...v, ...updates } : v));
      syncPreview({ variants: next });
      return next;
    });
  };

  const handleSetDefaultVariant = (index: number) => {
    setIconVariants(prev => {
      const next = prev.map((v, i) => ({
        ...v,
        isDefault: i === index,
      }));
      syncPreview({ variants: next });
      return next;
    });
  };

  const handleAddVariant = () => {
    const nextNum = iconVariants.length + 1;
    const newVariant: IconVariant = {
      id: `variant_${nextNum}`,
      name: `Custom Variant ${nextNum}`,
      isDefault: false,
      glyph: '⭐',
      backgroundColor: themeColor,
      foregroundColor: '#FFFFFF',
      imageUrl: '',
      imageBase64: '',
      description: 'Alternative app launcher icon',
    };
    const nextList = [...iconVariants, newVariant];
    setIconVariants(nextList);
    setEditingVariantIndex(nextList.length - 1);
    syncPreview({ variants: nextList });
  };

  const handleRemoveVariant = (index: number) => {
    if (iconVariants.length <= 1) return;
    const nextList = iconVariants.filter((_, i) => i !== index);
    if (!nextList.some(v => v.isDefault)) {
      nextList[0].isDefault = true;
    }
    setIconVariants(nextList);
    setEditingVariantIndex(Math.max(0, index - 1));
    syncPreview({ variants: nextList });
  };

  const handleVariantImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      handleUpdateVariant(index, { imageBase64: b64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSplashImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setSplashImageBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const togglePermission = (permId: string) => {
    if (permId === 'android.permission.INTERNET') return;
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  // Compile Current Exact Payload
  const currentBuildPayload = useMemo(() => {
    return {
      name: appName,
      appId,
      version,
      versionCode,
      themeColor,
      watchThemeColor,
      fullscreen,
      keepAwake,
      username: githubUsername,
      accessToken: githubToken,
      repo: githubRepo,
      permissions,
      splashScreen: {
        type: splashType,
        backgroundColor: splashBgColor,
        duration: splashDuration,
        autoHide: splashAutoHide,
        imageUrl: splashImageUrl || undefined,
        imageBase64: splashImageBase64 ? splashImageBase64.substring(0, 36) + '...[base64]' : undefined,
      },
      iconVariants: iconVariants.map(v => ({
        id: v.id,
        name: v.name,
        isDefault: v.isDefault,
        imageUrl: v.imageUrl || undefined,
        imageBase64: v.imageBase64 ? v.imageBase64.substring(0, 36) + '...[base64]' : undefined,
        backgroundColor: v.backgroundColor,
        triggerCondition: v.triggerCondition || undefined,
      })),
      staticBundle: {
        entrypoint: 'index.html',
        files: uploadedZipBase64
          ? [{ path: '[ZIP archive bundle active]', content: uploadedZipName || 'bundle.zip' }]
          : [{ path: 'index.html', content: codeContent.length > 120 ? codeContent.substring(0, 100) + '... (html)' : codeContent }],
      },
    };
  }, [
    appName,
    appId,
    version,
    versionCode,
    themeColor,
    watchThemeColor,
    fullscreen,
    keepAwake,
    githubUsername,
    githubToken,
    githubRepo,
    permissions,
    splashType,
    splashBgColor,
    splashDuration,
    splashAutoHide,
    splashImageUrl,
    splashImageBase64,
    iconVariants,
    uploadedZipBase64,
    uploadedZipName,
    codeContent,
  ]);

  // Code representations for AI / Developers
  const exactJsCode = useMemo(() => {
    const payloadForCode = {
      name: appName,
      appId,
      version,
      versionCode,
      themeColor,
      watchThemeColor,
      fullscreen,
      keepAwake,
      username: githubUsername,
      accessToken: githubToken,
      repo: githubRepo,
      permissions,
      splashScreen: {
        type: splashType,
        backgroundColor: splashBgColor,
        duration: splashDuration,
        autoHide: splashAutoHide,
        imageUrl: splashImageUrl || undefined,
        imageBase64: splashImageBase64 || undefined,
      },
      iconVariants: iconVariants.map(v => ({
        id: v.id,
        name: v.name,
        isDefault: v.isDefault,
        imageUrl: v.imageUrl || undefined,
        imageBase64: v.imageBase64 || undefined,
        backgroundColor: v.backgroundColor,
        triggerCondition: v.triggerCondition || undefined,
      })),
      staticBundle: {
        entrypoint: 'index.html',
        files: [{ path: 'index.html', content: codeContent }],
      },
      zipBase64: uploadedZipBase64 || undefined,
    };

    return `// ============================================================================
// EXACT BUILD & DOWNLOAD INTEGRATION CODE (OPEN CORS ENABLED)
// Target Build API: ${apiEndpointUrl}
// Download Interceptor: ${downloadApiUrl}
// ============================================================================

async function triggerLarpNativeBuild() {
  const endpoint = "${apiEndpointUrl}";
  const payload = ${JSON.stringify(payloadForCode, null, 2)};

  console.log('[LARP] Dispatching build request to:', endpoint);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    console.error('❌ Build failed:', data.error);
    throw new Error(data.error);
  }

  console.log('✅ Android Build Success!');
  console.log('📦 Complete Play Store ZIP:', data.zipDownloadUrl);
  console.log('📱 Signed Release APK:', data.downloadUrl);

  // 1. In-Memory Client Blob URL Generation (100% reliable on Vercel / serverless without server disk)
  let downloadUrl;
  if (data.zipBase64) {
    const binary = atob(data.zipBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/zip' });
    downloadUrl = URL.createObjectURL(blob);
    console.log('⚡ Client Blob URL created in-memory:', downloadUrl);
  } else {
    downloadUrl = "${effectiveOrigin}" + (data.downloadUrl || "/api/larp/download?file=lionel_complete_release_bundle.zip");
  }

  // 2. Trigger automatic browser download from Blob URL
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = "${appName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_complete_release_bundle.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return data;
}

// Alternative: Direct Binary Stream -> Blob
// const res = await fetch("${apiEndpointUrl}?format=zip", { method: 'POST', body: JSON.stringify(payload) });
// const blob = await res.blob();
// const directBlobUrl = URL.createObjectURL(blob);

triggerLarpNativeBuild();`;
  }, [
    appName,
    appId,
    version,
    versionCode,
    themeColor,
    watchThemeColor,
    fullscreen,
    keepAwake,
    githubUsername,
    githubToken,
    githubRepo,
    permissions,
    splashType,
    splashBgColor,
    splashDuration,
    splashAutoHide,
    splashImageUrl,
    splashImageBase64,
    iconVariants,
    uploadedZipBase64,
    codeContent,
    apiEndpointUrl,
    downloadApiUrl,
    effectiveOrigin,
  ]);

  const exactCurlCommand = useMemo(() => {
    const compactPayload = {
      name: appName,
      appId,
      version,
      versionCode,
      themeColor,
      keepAwake,
      username: githubUsername,
      accessToken: githubToken,
      repo: githubRepo,
      splashScreen: {
        type: splashType,
        backgroundColor: splashBgColor,
        duration: splashDuration,
        imageUrl: splashImageUrl || undefined,
      },
      iconVariants: iconVariants.map(v => ({
        id: v.id,
        name: v.name,
        isDefault: v.isDefault,
        imageUrl: v.imageUrl || undefined,
        backgroundColor: v.backgroundColor,
      })),
      staticBundle: {
        entrypoint: 'index.html',
        files: [{ path: 'index.html', content: codeContent }],
      },
    };

    return `curl -X POST "${apiEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(compactPayload, null, 2).replace(/'/g, "'\\''")}'`;
  }, [
    appName,
    appId,
    version,
    versionCode,
    themeColor,
    keepAwake,
    githubUsername,
    githubToken,
    githubRepo,
    splashType,
    splashBgColor,
    splashDuration,
    splashImageUrl,
    iconVariants,
    codeContent,
    apiEndpointUrl,
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsPayloadCopied(true);
    setTimeout(() => setIsPayloadCopied(false), 2000);
  };

  // Trigger Build
  const handleRunBuild = async () => {
    setIsBuilding(true);
    setBuildLogs([
      `[LARP API Middleman] Starting build pipeline for "${appName}" (${appId})...`,
      `[Config] Version ${version} (Code ${versionCode}), Theme: ${themeColor}, Stay Awake: ${keepAwake ? 'Enabled' : 'Disabled'}`,
      `[Icons] Configuring ${iconVariants.length} dynamic icon variants...`,
      `[GitHub CI/CD] Connecting as "${githubUsername}" on repository "${githubRepo}"...`,
    ]);

    const configPayload: LarpBuildConfig = {
      appId,
      name: appName,
      version,
      versionCode,
      fullscreen,
      themeColor,
      watchThemeColor,
      permissions,
      keepAwake,
      username: githubUsername,
      accessToken: githubToken,
      repo: githubRepo,
      repoId: githubRepo,
      repoName: githubRepo,
      splashScreen: {
        type: splashType,
        backgroundColor: splashBgColor,
        duration: splashDuration,
        autoHide: splashAutoHide,
        fadeInDuration: 200,
        fadeOutDuration: 300,
        imageUrl: splashImageUrl || undefined,
        imageBase64: splashImageBase64 || undefined,
      },
      iconVariants: iconVariants.map(v => ({
        id: v.id,
        name: v.name,
        isDefault: v.isDefault,
        imageUrl: v.imageUrl || undefined,
        imageBase64: v.imageBase64 || undefined,
        backgroundColor: v.backgroundColor,
        foregroundColor: v.foregroundColor,
        glyph: v.glyph,
        triggerCondition: v.triggerCondition,
      })),
      plugins: {
        statusBar: true,
        splashScreen: true,
        haptics: true,
        device: true,
        share: true,
        preferences: true,
        dynamicIcons: true,
        screenOrientation: true,
      },
      signing: {
        generateKeystore: true,
        alias: 'larp_release',
        commonName: `${appName} Publisher`,
        organization: 'LARP Mobile Engineering',
        validityYears: 25,
      },
      staticBundle: {
        entrypoint: 'index.html',
        files: [{ path: 'index.html', content: codeContent }],
      },
      zipBase64: uploadedZipBase64 || undefined,
    };

    try {
      const res = await fetch('/api/larp/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPayload),
      });

      const data: LarpBuildResult = await res.json();
      if (data.success) {
        setBuildLogs(data.logs || ['Build completed successfully.']);
        onBuildComplete(data);
      } else {
        setBuildLogs(prev => [
          ...prev,
          '[Error] Build failed: ' + (data as unknown as { error: string }).error,
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      setBuildLogs(prev => [...prev, `[Error] Failed to execute build: ${msg}`]);
    } finally {
      setIsBuilding(false);
    }
  };

  const activeEditingVariant = iconVariants[editingVariantIndex] || iconVariants[0];

  return (
    <section id="bundler" className="py-12 border-b border-[#EAE6E1]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1">
            Production Compiler & Configuration Engine
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
            Nuanced Native Android APK Generator
          </h2>
          <p className="mt-2 text-sm text-[#6B6661] leading-relaxed">
            Every parameter is 100% customizable: specify your own image URLs or upload custom icons, define dynamic icon variant IDs, set branded splash screens, enable Stay Awake, and observe the exact live API payload below.
          </p>
        </div>

        {/* Template Quick Selection */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-[#1F1E1D] mb-2 uppercase tracking-wider">
            Quick Start App Template
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleTemplateChange(tpl.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedTemplateId === tpl.id
                    ? 'border-[#D97757] bg-white ring-2 ring-[#D97757]/15 shadow-sm'
                    : 'border-[#EAE6E1] bg-white hover:border-[#D97757]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#1F1E1D]">{tpl.name}</span>
                  {selectedTemplateId === tpl.id && (
                    <span className="text-[11px] font-semibold text-[#D97757] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6661] mt-1 leading-relaxed">{tpl.description}</p>
                <div className="flex items-center gap-3 mt-3 text-[11px] text-[#8C867D]">
                  <span>App ID: {tpl.appId}</span>
                  <span>·</span>
                  <span>Fullscreen: {tpl.fullscreen ? 'Yes' : 'No'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. App Identity Card */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#D97757]" />
                <span>App Package & Identity</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    App Display Name
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] focus:outline-none focus:border-[#D97757]"
                    placeholder="Lionel App"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Package Identifier (Android ApplicationId)
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={e => setAppId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="com.lourdjvke.lionel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Semantic Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Version Code (Integer)
                  </label>
                  <input
                    type="number"
                    value={versionCode}
                    onChange={e => setVersionCode(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="101"
                  />
                </div>
              </div>
            </div>

            {/* 2. Dynamic Launcher Icons Studio (Nuanced with Custom Image URLs & Base64) */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D97757]" />
                  <span>Custom App Icons & Dynamic Variants</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-2.5 py-1 text-xs font-semibold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/15 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Icon Variant</span>
                </button>
              </div>

              <p className="text-xs text-[#6B6661] leading-relaxed">
                Provide custom image URLs (HTTPS) or upload image files (Base64) for your launcher icons. Define unique variant IDs so web pages can dynamically switch the Android home-screen icon at runtime via <code className="text-[#D97757] font-mono">window.Larp.setIcon(variantId)</code>.
              </p>

              {/* Variant Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {iconVariants.map((v, idx) => (
                  <button
                    key={v.id + idx}
                    type="button"
                    onClick={() => setEditingVariantIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 flex items-center gap-2 border transition-all cursor-pointer ${
                      editingVariantIndex === idx
                        ? 'border-[#D97757] bg-[#D97757]/10 text-[#1F1E1D] font-semibold'
                        : 'border-[#EAE6E1] bg-[#FAF8F5] text-[#6B6661] hover:bg-white'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] overflow-hidden shrink-0 border border-black/10"
                      style={{ backgroundColor: v.backgroundColor }}
                    >
                      {v.imageUrl || v.imageBase64 ? (
                        <img
                          src={v.imageUrl || v.imageBase64}
                          alt={v.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{v.glyph || '★'}</span>
                      )}
                    </div>
                    <span>{v.name}</span>
                    {v.isDefault && (
                      <span className="text-[9px] bg-[#D97757] text-white px-1 py-0.2 rounded font-mono font-medium">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Active Editing Variant Detail Form */}
              {activeEditingVariant && (
                <div className="p-4 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F1E1D] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#D97757]" />
                      <span>Configuring: {activeEditingVariant.name}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {!activeEditingVariant.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultVariant(editingVariantIndex)}
                          className="text-[11px] text-[#D97757] hover:underline font-semibold cursor-pointer"
                        >
                          Make Default Launcher
                        </button>
                      )}
                      {iconVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(editingVariantIndex)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Remove variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                        Variant Identifier (ID used by web app)
                      </label>
                      <input
                        type="text"
                        value={activeEditingVariant.id}
                        onChange={e =>
                          handleUpdateVariant(editingVariantIndex, { id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE6E1] rounded-lg font-mono text-[#1F1E1D]"
                        placeholder="default, streak_fire, gold_mode..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={activeEditingVariant.name}
                        onChange={e => handleUpdateVariant(editingVariantIndex, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE6E1] rounded-lg text-[#1F1E1D]"
                        placeholder="e.g. Amber Pro"
                      />
                    </div>
                  </div>

                  {/* Custom Image URL vs Base64 Upload */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                      Custom Icon Image URL (HTTPS)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={activeEditingVariant.imageUrl || ''}
                        onChange={e =>
                          handleUpdateVariant(editingVariantIndex, {
                            imageUrl: e.target.value,
                            imageBase64: '',
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono"
                        placeholder="https://example.com/icons/my_icon.png"
                      />
                      <label className="cursor-pointer px-2.5 py-1.5 text-xs font-semibold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/15 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleVariantImageUpload(editingVariantIndex, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {activeEditingVariant.imageBase64 && (
                      <div className="text-[10px] text-emerald-600 mt-1 flex items-center justify-between">
                        <span>Using direct Base64 encoded image data</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateVariant(editingVariantIndex, { imageBase64: '' })}
                          className="text-red-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Colors & Trigger Condition */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                        Adaptive Icon Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeEditingVariant.backgroundColor || '#D97757'}
                          onChange={e =>
                            handleUpdateVariant(editingVariantIndex, { backgroundColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-[#EAE6E1] cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={activeEditingVariant.backgroundColor || '#D97757'}
                          onChange={e =>
                            handleUpdateVariant(editingVariantIndex, { backgroundColor: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-xs bg-white border border-[#EAE6E1] rounded-lg font-mono text-[#1F1E1D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                        Trigger Condition (Documentation tag)
                      </label>
                      <input
                        type="text"
                        value={activeEditingVariant.triggerCondition || ''}
                        onChange={e =>
                          handleUpdateVariant(editingVariantIndex, { triggerCondition: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE6E1] rounded-lg font-mono text-[#1F1E1D]"
                        placeholder="e.g. streak >= 7, theme == dark"
                      />
                    </div>
                  </div>

                  {/* Live Thumbnail Preview */}
                  <div className="flex items-center gap-3 pt-2 border-t border-[#EAE6E1]">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-xs border border-black/10 overflow-hidden shrink-0"
                      style={{ backgroundColor: activeEditingVariant.backgroundColor }}
                    >
                      {activeEditingVariant.imageUrl || activeEditingVariant.imageBase64 ? (
                        <img
                          src={activeEditingVariant.imageUrl || activeEditingVariant.imageBase64}
                          alt="Icon Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{activeEditingVariant.glyph || '★'}</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-[#1F1E1D]">
                        Launcher Preview: {activeEditingVariant.name}
                      </div>
                      <div className="text-[11px] text-[#6B6661]">
                        Android Manifest Activity Alias:{' '}
                        <code className="text-[#D97757] font-mono">
                          {appId}.MainActivity_{activeEditingVariant.id}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Splash Screen Configurator (Nuanced with Custom Image & Color) */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#D97757]" />
                <span>Splash Screen & Launch Experience</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSplashType('custom_icon')}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    splashType === 'custom_icon'
                      ? 'border-[#D97757] bg-[#D97757]/5'
                      : 'border-[#EAE6E1] bg-[#FAF8F5]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#1F1E1D]">Branded Logo</div>
                  <div className="text-[11px] text-[#6B6661] mt-0.5">Centered custom icon</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplashType('flat_color')}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    splashType === 'flat_color'
                      ? 'border-[#D97757] bg-[#D97757]/5'
                      : 'border-[#EAE6E1] bg-[#FAF8F5]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#1F1E1D]">Flat Solid Color</div>
                  <div className="text-[11px] text-[#6B6661] mt-0.5">Seamless canvas</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplashType('full_image')}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    splashType === 'full_image'
                      ? 'border-[#D97757] bg-[#D97757]/5'
                      : 'border-[#EAE6E1] bg-[#FAF8F5]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#1F1E1D]">Full Image Poster</div>
                  <div className="text-[11px] text-[#6B6661] mt-0.5">Edge-to-edge art</div>
                </button>
              </div>

              {/* Splash Custom Image URL or Upload */}
              {splashType !== 'flat_color' && (
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                    Splash Screen Image / Logo URL (HTTPS)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={splashImageUrl}
                      onChange={e => {
                        setSplashImageUrl(e.target.value);
                        setSplashImageBase64('');
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono"
                      placeholder="https://example.com/splash_logo.png"
                    />
                    <label className="cursor-pointer px-2.5 py-1.5 text-xs font-semibold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/15 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSplashImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                    Splash Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={splashBgColor}
                      onChange={e => setSplashBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-[#EAE6E1] cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={splashBgColor}
                      onChange={e => setSplashBgColor(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg font-mono text-[#1F1E1D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B6661] mb-1">
                    Splash Duration: {splashDuration}ms
                  </label>
                  <input
                    type="range"
                    min="400"
                    max="4000"
                    step="100"
                    value={splashDuration}
                    onChange={e => setSplashDuration(Number(e.target.value))}
                    className="w-full accent-[#D97757] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EAE6E1]">
                <span className="text-[#6B6661]">Lifecycle: Seamless fade-in to web DOM</span>
                <label className="flex items-center gap-2 text-[#1F1E1D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashAutoHide}
                    onChange={e => setSplashAutoHide(e.target.checked)}
                    className="rounded border-[#EAE6E1] text-[#D97757] focus:ring-0"
                  />
                  <span>Auto-hide when DOM is ready</span>
                </label>
              </div>
            </div>

            {/* 4. Fullscreen, Theme & Stay Awake */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#D97757]" />
                <span>Viewport, Status Bar & Stay Awake</span>
              </h3>

              {/* Stay Awake Toggle */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-xs text-[#1F1E1D] flex items-center gap-2">
                    <span>Keep Screen Awake (Stay Awake)</span>
                    <span className="text-[10px] bg-[#D97757]/10 text-[#D97757] px-1.5 py-0.2 rounded font-mono font-medium">
                      FLAG_KEEP_SCREEN_ON
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                    Prevents the device display from dimming or turning off during use. Essential for fitness workouts, timers, audio/video playback, and presentation dashboards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setKeepAwake(!keepAwake)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    keepAwake ? 'bg-[#D97757]' : 'bg-[#D8D2C9]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      keepAwake ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-xs text-[#1F1E1D] flex items-center gap-2">
                    <span>Immersive Sticky Fullscreen</span>
                    <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] px-1.5 py-0.2 rounded font-mono font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                    Hides system navigation bar and status bar, utilizing notch cutout space via <code className="text-[#D97757] font-mono">viewport-fit=cover</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !fullscreen;
                    setFullscreen(nextVal);
                    syncPreview({ fullscreen: nextVal });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    fullscreen ? 'bg-[#D97757]' : 'bg-[#D8D2C9]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      fullscreen ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Theme Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Theme &amp; Status Bar Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={e => {
                        setThemeColor(e.target.value);
                        syncPreview({ themeColor: e.target.value });
                      }}
                      className="w-9 h-9 rounded-lg border border-[#EAE6E1] cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={e => {
                        setThemeColor(e.target.value);
                        syncPreview({ themeColor: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Dynamic DOM Theme Color Sync
                  </label>
                  <button
                    type="button"
                    onClick={() => setWatchThemeColor(!watchThemeColor)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between cursor-pointer ${
                      watchThemeColor
                        ? 'border-[#D97757] bg-[#D97757]/5 text-[#1F1E1D]'
                        : 'border-[#EAE6E1] bg-[#FAF8F5] text-[#6B6661]'
                    }`}
                  >
                    <span>Observe &lt;meta name=&quot;theme-color&quot;&gt;</span>
                    {watchThemeColor ? (
                      <Check className="w-3.5 h-3.5 text-[#D97757]" />
                    ) : (
                      <span className="text-[10px]">Off</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Device Permissions */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D97757]" />
                  <span>Native Permissions &amp; Hardware</span>
                </h3>

                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="px-2.5 py-1 text-xs font-semibold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/15 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto-Detect from Code</span>
                </button>
              </div>

              {autoDetectNotice && (
                <div className="p-2.5 bg-[#FAF8F5] border border-[#D97757]/30 rounded-lg text-xs text-[#D97757]">
                  {autoDetectNotice}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_PERMISSIONS.map(p => {
                  const isChecked = permissions.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePermission(p.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-[#D97757]/40 bg-[#D97757]/5 text-[#1F1E1D]'
                          : 'border-[#EAE6E1] bg-[#FAF8F5] text-[#6B6661]'
                      }`}
                    >
                      <div className="flex flex-col pr-2">
                        <span className="font-medium text-[#1F1E1D]">{p.label}</span>
                        <span className="text-[10px] text-[#8C867D] font-mono truncate">{p.id}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#D97757] border-[#D97757] text-white' : 'border-[#D8D2C9] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor, GitHub Bridge, and Build Button (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Web App Bundle (Single file or Multi-file ZIP) */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#D97757]" />
                  <span>Web App Bundle &amp; Multi-File ZIP</span>
                </h3>
                <label className="cursor-pointer px-2.5 py-1 text-xs font-semibold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/15 rounded-lg flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>{uploadedZipName ? `ZIP: ${uploadedZipName}` : 'Upload .ZIP Bundle'}</span>
                  <input type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
                </label>
              </div>

              <p className="text-xs text-[#6B6661]">
                Upload a full web project archive (.zip) or customize the entry point HTML directly below. Hardware back-button automatically navigates across pages via <code className="text-[#D97757] font-mono">history.back()</code>.
              </p>

              <div className="relative">
                <textarea
                  value={codeContent}
                  onChange={e => {
                    setCodeContent(e.target.value);
                    syncPreview({ html: e.target.value });
                  }}
                  rows={12}
                  className="w-full p-3 font-mono text-[11px] leading-relaxed bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl text-[#1F1E1D] focus:outline-none focus:border-[#D97757] resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="text-[11px] text-[#8C867D] flex items-center justify-between">
                <span>Changes update simulator live</span>
                <span>{codeContent.length} chars</span>
              </div>
            </div>

            {/* GitHub Actions CI/CD Bridge Credentials */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#D97757]" />
                  <span>GitHub Actions CI/CD Bridge</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded font-mono font-medium">
                  Direct API Middleman
                </span>
              </div>
              <p className="text-xs text-[#6B6661] leading-relaxed">
                Provide your GitHub credentials. The LARP API automatically syncs assets to your designated repository, triggers GitHub Actions runners, downloads the release package, and provides a direct download link.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="lourdjvke"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="gho_..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Target Repository Name (Repo ID)
                  </label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={e => setGithubRepo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="larp-android-app-v6"
                  />
                  <p className="text-[10px] text-[#8C867D] mt-1">
                    Select any repository under your account to run the build actions.
                  </p>
                </div>
              </div>
            </div>

            {/* Build Action Button & Log Stream */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <button
                type="button"
                onClick={handleRunBuild}
                disabled={isBuilding}
                className="w-full py-4 px-4 bg-[#D97757] hover:bg-[#C86646] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isBuilding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compiling APK via Official Android Toolchain &amp; GitHub Actions...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    <span>Compile Signed Native APK (Direct Build)</span>
                  </>
                )}
              </button>

              {/* Build Output Logs */}
              {buildLogs.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold text-[#1F1E1D] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Build Pipeline Execution Stream</span>
                    <span className="text-[10px] text-emerald-600 font-mono">Live</span>
                  </div>
                  <div className="p-3 bg-[#1F1E1D] rounded-xl text-emerald-400 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto">
                    {buildLogs.map((log, i) => (
                      <div key={i} className="leading-tight">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXACT PAYLOAD SECTION (Right Below Formulation - AI & Developer Ready) */}
        {/* ========================================================================= */}
        <div className="mt-12 p-6 md:p-8 bg-white border border-[#EAE6E1] rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Live Generated API Payload &amp; Executable Code</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#1F1E1D]">
                Exact Payload for POST /api/larp/build
              </h3>
              <p className="text-xs text-[#6B6661] mt-1 max-w-2xl leading-relaxed">
                This exact JavaScript code and JSON payload reflects your current customized configuration above. You can give this directly to any AI model, CI pipeline, or terminal script to reliably generate this identical Android APK with download URLs.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE6E1] flex items-center">
                <button
                  type="button"
                  onClick={() => setPayloadTab('js')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    payloadTab === 'js'
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'text-[#6B6661] hover:text-[#1F1E1D]'
                  }`}
                >
                  JavaScript (fetch)
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadTab('json')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    payloadTab === 'json'
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'text-[#6B6661] hover:text-[#1F1E1D]'
                  }`}
                >
                  Raw JSON
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadTab('curl')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    payloadTab === 'curl'
                      ? 'bg-[#D97757] text-white shadow-xs'
                      : 'text-[#6B6661] hover:text-[#1F1E1D]'
                  }`}
                >
                  cURL Command
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const textToCopy =
                    payloadTab === 'js'
                      ? exactJsCode
                      : payloadTab === 'json'
                      ? JSON.stringify(currentBuildPayload, null, 2)
                      : exactCurlCommand;
                  copyToClipboard(textToCopy);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#1F1E1D] bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EAE6E1] rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                {isPayloadCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6B6661]" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Summary Highlights of Customized Aspects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">App Name</span>
              <span className="text-xs font-bold text-[#1F1E1D] truncate block mt-0.5">{appName}</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">Package ID</span>
              <span className="text-xs font-bold text-[#1F1E1D] truncate block mt-0.5">{appId}</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">Version</span>
              <span className="text-xs font-bold text-[#1F1E1D] truncate block mt-0.5">
                v{version} ({versionCode})
              </span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">Theme Color</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
                <span className="text-xs font-bold text-[#1F1E1D] truncate">{themeColor}</span>
              </div>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">Splash Screen</span>
              <span className="text-xs font-bold text-[#1F1E1D] truncate block mt-0.5">
                {splashType} ({splashDuration}ms)
              </span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">Stay Awake</span>
              <span className="text-xs font-bold text-emerald-600 truncate block mt-0.5">
                {keepAwake ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
              <span className="text-[10px] text-[#8C867D] uppercase font-mono block">Dynamic Icons</span>
              <span className="text-xs font-bold text-[#D97757] truncate block mt-0.5">
                {iconVariants.length} Defined
              </span>
            </div>
          </div>

          {/* Active Code Block */}
          <div className="relative">
            <pre className="p-4 bg-[#1F1E1D] text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-96 leading-relaxed selection:bg-emerald-800">
              {payloadTab === 'js'
                ? exactJsCode
                : payloadTab === 'json'
                ? JSON.stringify(currentBuildPayload, null, 2)
                : exactCurlCommand}
            </pre>
          </div>

          {/* ========================================================================= */}
          {/* FRONT-END DOWNLOAD PROCESSING & INTEGRATION SUMMARY (AI & DEVELOPER READY) */}
          {/* ========================================================================= */}
          <div className="pt-6 border-t border-[#EAE6E1] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Front-End Integration &amp; Download Guide</span>
                </div>
                <h4 className="text-sm font-bold text-[#1F1E1D] mt-0.5">
                  How to Process &amp; Download Artifacts in Any External Front-End
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  const guideText = `// ============================================================================
// FRONT-END INTEGRATION GUIDE: BUILD & DOWNLOAD ANDROID ARTIFACTS
// API Endpoint: ${apiEndpointUrl} (CORS Enabled: *)
// Download Interceptor: ${downloadApiUrl}
// ============================================================================

// 1. Build and retrieve all download links:
async function buildAppAndDownload(payload) {
  const res = await fetch("${apiEndpointUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error);

  console.log("APK URL:", data.downloadUrl);
  console.log("Complete ZIP URL:", data.zipDownloadUrl);

  // 2. Download the all-in-one distribution ZIP bundle (APK + AAB + Keystore + Credentials):
  const downloadLink = "${effectiveOrigin}" + (data.zipDownloadUrl || "/api/larp/download?file=lionel_complete_release_bundle.zip");
  
  const a = document.createElement("a");
  a.href = downloadLink;
  a.download = "complete_release_bundle.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return data;
}

// 3. Private GitHub Repositories:
// If your GitHub repository is private, GitHub Actions artifact zip downloads normally require auth.
// Our Download Interceptor handles this automatically with your access token:
// GET ${downloadApiUrl}?owner=${githubUsername}&repo=${githubRepo}&artifact_id=ARTIFACT_ID&token=${githubToken}`;
                  copyToClipboard(guideText);
                  setIsGuideCopied(true);
                  setTimeout(() => setIsGuideCopied(false), 2000);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-[#1F1E1D] bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EAE6E1] rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                {isGuideCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Guide Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6B6661]" />
                    <span>Copy Integration Guide</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1E1D]">
                  <Box className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>1. Complete Play Store ZIP</span>
                </div>
                <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                  Call <code className="text-[#D97757] font-mono">GET {downloadApiUrl}?file=lionel_complete_release_bundle.zip</code> to download the full package containing the Signed APK, Google Play AAB bundle, Release Keystore, and deployment manual.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1E1D]">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Standalone Signed APK</span>
                </div>
                <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                  Call <code className="text-[#D97757] font-mono">GET {downloadApiUrl}?file=lionel.apk</code> or directly access <code className="font-mono">/downloads/lionel.apk</code> for instant APK downloads on physical Android devices.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1E1D]">
                  <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Private Repo Proxy</span>
                </div>
                <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                  For private GitHub repositories, our interceptor proxies the artifact using your PAT: <code className="text-[#D97757] font-mono">{downloadApiUrl}?owner={githubUsername}&amp;repo={githubRepo}&amp;artifact_id=ID&amp;token=TOKEN</code>.
                </p>
              </div>
            </div>

            {/* Ready-to-use Frontend Snippet */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl font-mono text-[11px] text-[#1F1E1D] space-y-1">
              <div className="font-sans font-bold text-xs text-[#1F1E1D] flex items-center justify-between">
                <span>Front-End Download Helper Snippet (Paste into your React/Vue/Node front-end):</span>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded">CORS Allowed: *</span>
              </div>
              <pre className="p-3 bg-[#1F1E1D] text-emerald-400 rounded-lg overflow-x-auto text-[10px] leading-relaxed mt-2">
{`// Front-end download handler
function downloadReleaseBundle(zipUrl) {
  const link = document.createElement('a');
  link.href = zipUrl.startsWith('http') ? zipUrl : ("${effectiveOrigin}" + zipUrl);
  link.download = 'playstore_release_package.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

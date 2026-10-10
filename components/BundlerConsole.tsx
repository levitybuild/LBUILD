'use client';

import React, { useState } from 'react';
import { Package, ShieldCheck, Smartphone, Maximize2, Palette, Sparkles, Check, Plus, Trash2, RefreshCw, Code, Download, Play, Eye, GitBranch, Upload } from 'lucide-react';
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

  // Form State
  const [appId, setAppId] = useState<string>('com.larp.streakhero');
  const [appName, setAppName] = useState<string>('StreakHero');
  const [version, setVersion] = useState<string>('1.0.0');
  const [versionCode, setVersionCode] = useState<number>(101);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>('#D97757');
  const [watchThemeColor, setWatchThemeColor] = useState<boolean>(true);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [githubToken, setGithubToken] = useState<string>('');
  const [githubRepo, setGithubRepo] = useState<string>('');
  const [keepAwake, setKeepAwake] = useState<boolean>(true);

  // Splash Screen
  const [splashType, setSplashType] = useState<'flat_color' | 'custom_icon'>('flat_color');
  const [splashBgColor, setSplashBgColor] = useState<string>('#FAF8F5');
  const [splashDuration, setSplashDuration] = useState<number>(2000);
  const [splashAutoHide, setSplashAutoHide] = useState<boolean>(true);

  // Dynamic Icon Variants
  const [iconVariants, setIconVariants] = useState<IconVariant[]>([
    {
      id: 'default',
      name: 'Classic Hero',
      isDefault: true,
      glyph: '🦉',
      backgroundColor: '#D97757',
      foregroundColor: '#FFFFFF',
      description: 'Standard orange mascot avatar',
    },
    {
      id: 'streak_fire',
      name: 'Fire Streak',
      isDefault: false,
      glyph: '🔥',
      backgroundColor: '#EA580C',
      foregroundColor: '#FFFFFF',
      triggerCondition: 'streak >= 7 days',
      description: 'Unlocked on 7-day learning streak',
    },
    {
      id: 'stealth_dark',
      name: 'Stealth Pro',
      isDefault: false,
      glyph: '⚡',
      backgroundColor: '#18181B',
      foregroundColor: '#FACC15',
      triggerCondition: 'theme == dark',
      description: 'High-contrast nocturnal badge',
    },
    {
      id: 'golden_master',
      name: 'Golden Champion',
      isDefault: false,
      glyph: '🏆',
      backgroundColor: '#CA8A04',
      foregroundColor: '#FFFFFF',
      triggerCondition: 'streak >= 30 days',
      description: '30-day champion emblem',
    },
  ]);

  // Permissions
  const [permissions, setPermissions] = useState<string[]>([
    'android.permission.INTERNET',
    'android.permission.CAMERA',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.VIBRATE',
  ]);

  // Code editor & ZIP bundle upload
  const [activeCodeFile, setActiveCodeFile] = useState<string>('index.html');
  const [codeContent, setCodeContent] = useState<string>(SAMPLE_TEMPLATES[0].files[0].content);
  const [uploadedZipBase64, setUploadedZipBase64] = useState<string | null>(null);
  const [uploadedZipName, setUploadedZipName] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedZipName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setUploadedZipBase64(b64);
      setAutoDetectNotice(`Loaded multi-file ZIP package: ${file.name}`);
      setTimeout(() => setAutoDetectNotice(null), 4000);
    };
    reader.readAsDataURL(file);
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

    onPreviewUpdate({
      html: tpl.files[0].content,
      themeColor: tpl.themeColor,
      fullscreen: tpl.fullscreen,
      activeIconId: iconVariants[0].id,
      iconVariants,
    });
  };

  // Sync state with simulator preview
  const syncPreview = (updates?: Partial<{ html: string; themeColor: string; fullscreen: boolean }>) => {
    onPreviewUpdate({
      html: updates?.html ?? codeContent,
      themeColor: updates?.themeColor ?? themeColor,
      fullscreen: updates?.fullscreen ?? fullscreen,
      activeIconId: iconVariants[0].id,
      iconVariants,
    });
  };

  // Auto-detect permissions from code
  const handleAutoDetect = async () => {
    setAutoDetectNotice('Analyzing static DOM & JavaScript APIs...');
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
        setAutoDetectNotice(`Detected ${data.detectedPermissions.length} permissions & theme settings.`);
        setTimeout(() => setAutoDetectNotice(null), 4000);
      }
    } catch (e) {
      setAutoDetectNotice('Auto-detection error.');
      setTimeout(() => setAutoDetectNotice(null), 3000);
    }
  };

  // Trigger Build
  const handleRunBuild = async () => {
    if (!githubUsername.trim() || !githubToken.trim() || !githubRepo.trim()) {
      setBuildLogs(['[Error] Enter your GitHub username, access token, and repository ID before building.']);
      return;
    }

    setIsBuilding(true);
    setBuildLogs(['[LARP CLI] Initializing build request...', `[Config] Target: ${appId} (${appName})`]);

    const configPayload: LarpBuildConfig = {
      appId,
      name: appName,
      version,
      versionCode,
      fullscreen,
      themeColor,
      watchThemeColor,
      permissions,
      splashScreen: {
        type: splashType,
        backgroundColor: splashBgColor,
        duration: splashDuration,
        autoHide: splashAutoHide,
        fadeInDuration: 300,
        fadeOutDuration: 400,
      },
      iconVariants,
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
        files: [
          { path: 'index.html', content: codeContent },
        ],
      },
      zipBase64: uploadedZipBase64 || undefined,
      keepAwake,
    };

    try {
      const res = await fetch('/api/larp/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configPayload,
          username: githubUsername,
          accessToken: githubToken,
          repoId: githubRepo,
        }),
      });

      const data: LarpBuildResult = await res.json();
      if (data.success) {
        setBuildLogs(data.logs || ['Build completed successfully.']);
        onBuildComplete(data);
      } else {
        setBuildLogs(prev => [...prev, '[Error] Build failed: ' + (data as unknown as { error: string }).error]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      setBuildLogs(prev => [...prev, `[Error] Failed to execute build: ${msg}`]);
    } finally {
      setIsBuilding(false);
    }
  };

  const togglePermission = (permId: string) => {
    if (permId === 'android.permission.INTERNET') return; // required
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  return (
    <section id="bundler" className="py-12 border-b border-[#EAE6E1]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-semibold tracking-wider text-[#D97757] uppercase mb-1">
            Interactive App Bundler
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
            One-Click Native Capacitor App Compiler
          </h2>
          <p className="mt-2 text-sm text-[#6B6661] leading-relaxed">
            Configure package ID, dynamic theme tracking, true fullscreen, splash screens, and Duolingo-style launcher icons. Generates signed APK, Play Store AAB, and complete Capacitor 6 source code.
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
                    placeholder="My Native App"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Package Identifier (Bundle ID)
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={e => setAppId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="com.company.app"
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Version Code (Play Store)
                  </label>
                  <input
                    type="number"
                    value={versionCode}
                    onChange={e => setVersionCode(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Fullscreen & Theme Colors */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#D97757]" />
                <span>Viewport, Fullscreen & Theme Control</span>
              </h3>

              {/* Fullscreen Toggle */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-xs text-[#1F1E1D] flex items-center gap-2">
                    <span>True Immersive Fullscreen Mode</span>
                    <span className="text-[10px] bg-[#2E7D32]/10 text-[#2E7D32] px-1.5 py-0.2 rounded font-mono font-medium">100% Working</span>
                  </div>
                  <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                    Hides status bar and navigation bar via `WindowInsetsControllerCompat`, sets `shortEdges` cutout mode for camera notches, and applies `viewport-fit=cover`.
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

              {/* Stay Awake Toggle */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-xs text-[#1F1E1D] flex items-center gap-2">
                    <span>Keep Screen Awake (Stay Awake)</span>
                    <span className="text-[10px] bg-[#D97757]/10 text-[#D97757] px-1.5 py-0.2 rounded font-mono font-medium">FLAG_KEEP_SCREEN_ON</span>
                  </div>
                  <p className="text-[11px] text-[#6B6661] mt-1 leading-relaxed">
                    Prevents the device display from dimming or locking while the app is active (ideal for workouts, dashboards, video, and presentations).
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

              {/* Theme Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">
                    Default Theme / Status Bar Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={e => {
                        setThemeColor(e.target.value);
                        syncPreview({ themeColor: e.target.value });
                      }}
                      className="w-9 h-9 rounded-lg border border-[#EAE6E1] cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={e => {
                        setThemeColor(e.target.value);
                        syncPreview({ themeColor: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
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
                    {watchThemeColor ? <Check className="w-3.5 h-3.5 text-[#D97757]" /> : <span className="text-[10px]">Off</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Splash Screen Configurator */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#D97757]" />
                <span>Splash Screen Configurator</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <div className="text-[11px] text-[#6B6661] mt-0.5">Seamless zero-icon canvas</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplashType('custom_icon')}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    splashType === 'custom_icon'
                      ? 'border-[#D97757] bg-[#D97757]/5'
                      : 'border-[#EAE6E1] bg-[#FAF8F5]'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#1F1E1D]">Branded App Icon</div>
                  <div className="text-[11px] text-[#6B6661] mt-0.5">Centered adaptive logo</div>
                </button>

                <div>
                  <label className="block text-[11px] font-medium text-[#6B6661] mb-1">Splash Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={splashBgColor}
                      onChange={e => setSplashBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-[#EAE6E1] cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={splashBgColor}
                      onChange={e => setSplashBgColor(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#6B6661]">Launch Duration: {splashDuration}ms</span>
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

            {/* 4. Duolingo Dynamic App Icon Studio */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D97757]" />
                  <span>Dynamic App Icon Variants (Duolingo Style)</span>
                </h3>
                <span className="text-xs text-[#8C867D] font-mono tabular-nums">
                  {iconVariants.length} Active Aliases
                </span>
              </div>

              <p className="text-xs text-[#6B6661] leading-relaxed">
                Configure launcher icons that can be switched dynamically from JavaScript inside the static app using `LarpBridge.setIcon(...)`.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {iconVariants.map(variant => (
                  <div
                    key={variant.id}
                    className="p-3 bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl flex flex-col items-center text-center relative group"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs mb-2 border border-black/5"
                      style={{ backgroundColor: variant.backgroundColor, color: variant.foregroundColor }}
                    >
                      {variant.glyph}
                    </div>
                    <span className="font-semibold text-xs text-[#1F1E1D] truncate max-w-full">
                      {variant.name}
                    </span>
                    <span className="text-[10px] text-[#8C867D] font-mono truncate max-w-full">
                      ID: {variant.id}
                    </span>
                    {variant.triggerCondition && (
                      <span className="text-[9px] text-[#D97757] font-mono mt-1 px-1 bg-[#D97757]/10 rounded">
                        {variant.triggerCondition}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Native Permissions */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D97757]" />
                  <span>Native Device Permissions</span>
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

          {/* Right Column: Code Editor & Build Action (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Code Editor */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#D97757]" />
                  <span>Web App Bundle</span>
                </h3>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-2.5 py-1 text-xs font-semibold text-[#D97757] bg-[#D97757]/10 hover:bg-[#D97757]/15 rounded-lg flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>{uploadedZipName ? `ZIP: ${uploadedZipName}` : 'Upload .ZIP Bundle'}</span>
                    <input type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
                  </label>
                  <span className="text-xs font-mono text-[#8C867D]">index.html</span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={codeContent}
                  onChange={e => {
                    setCodeContent(e.target.value);
                    syncPreview({ html: e.target.value });
                  }}
                  rows={14}
                  className="w-full p-3 font-mono text-[11px] leading-relaxed bg-[#FAF8F5] border border-[#EAE6E1] rounded-xl text-[#1F1E1D] focus:outline-none focus:border-[#D97757] resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="text-[11px] text-[#8C867D] flex items-center justify-between">
                <span>Changes update simulator live</span>
                <span>{codeContent.length} chars</span>
              </div>
            </div>


            {/* GitHub Actions Bridge Credentials */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#D97757]" />
                <span>GitHub Actions CI/CD Bridge (API Middleman)</span>
              </h3>
              <p className="text-xs text-[#6B6661] leading-relaxed">
                Connect your GitHub repository. The LARP API acts as the middleman: commits app assets, triggers GitHub Actions runner, compiles native release packages, and serves a direct download URL.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">GitHub Username</label>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="lourdjvke"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">GitHub Personal Access Token (PAT)</label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="gho_..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6661] mb-1">Target Repository Name</label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={e => setGithubRepo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE6E1] rounded-lg text-[#1F1E1D] font-mono focus:outline-none focus:border-[#D97757]"
                    placeholder="larp-android-app-v6"
                  />
                  <p className="text-[10px] text-[#8C867D] mt-1">
                    Choose which repository under your account will execute the build runner.
                  </p>
                </div>
              </div>
            </div>

            {/* Build Action Button */}
            <div className="p-6 bg-white border border-[#EAE6E1] rounded-2xl space-y-4 shadow-xs">
              <button
                type="button"
                onClick={handleRunBuild}
                disabled={isBuilding}
                className="w-full py-3.5 px-4 bg-[#D97757] hover:bg-[#C86646] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isBuilding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compiling Signed APK & Play Store AAB...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    <span>Compile Signed Native App</span>
                  </>
                )}
              </button>

              {/* Build Output Logs */}
              {buildLogs.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold text-[#1F1E1D] uppercase tracking-wider mb-2">
                    Build Output & Artifact Engine
                  </div>
                  <div className="p-3 bg-[#1F1E1D] rounded-xl text-emerald-400 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto">
                    {buildLogs.map((log, i) => (
                      <div key={i} className="leading-tight">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export interface SplashConfig {
  type: 'flat_color' | 'custom_icon' | 'full_image' | 'none';
  backgroundColor: string;
  duration: number; // milliseconds
  autoHide: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
  spinnerColor?: string;
  showSpinner?: boolean;
}

export interface IconVariant {
  id: string; // e.g. 'default', 'streak_fire', 'stealth_dark', 'golden_trophy'
  name: string; // e.g. 'Fire Streak'
  isDefault: boolean;
  triggerCondition?: string; // e.g. 'streak >= 7' or 'theme == dark'
  glyph: string; // icon symbol or text
  backgroundColor: string;
  foregroundColor: string;
  description?: string;
}

export interface StaticFile {
  path: string;
  content: string;
  isBinary?: boolean;
}

export interface StaticBundleInput {
  entrypoint?: string; // default: 'index.html'
  files: StaticFile[];
}

export interface LarpPluginConfig {
  statusBar: boolean;
  splashScreen: boolean;
  haptics: boolean;
  device: boolean;
  share: boolean;
  preferences: boolean;
  dynamicIcons: boolean;
  screenOrientation: boolean;
}

export interface SigningConfig {
  generateKeystore: boolean;
  alias: string;
  password?: string;
  commonName: string;
  organization: string;
  validityYears: number;
}

export interface LarpBuildConfig {
  appId: string; // e.g. 'com.larp.studio.app'
  name: string; // e.g. 'Zenith Mobile'
  version: string; // e.g. '1.0.0'
  versionCode: number; // e.g. 1
  fullscreen: boolean; // True immersive sticky mode
  themeColor: string; // e.g. '#D97757'
  watchThemeColor: boolean; // Auto-listen to <meta name="theme-color"> changes in DOM
  permissions: string[]; // e.g. ['CAMERA', 'ACCESS_FINE_LOCATION']
  splashScreen: SplashConfig;
  iconVariants: IconVariant[];
  plugins: LarpPluginConfig;
  signing: SigningConfig;
  staticBundle: StaticBundleInput;
}

export interface GeneratedArtifact {
  id: string;
  name: string;
  filename: string;
  type: 'apk' | 'aab' | 'keystore' | 'ios' | 'source_zip' | 'bridge_js' | 'manifest';
  sizeBytes: number;
  downloadUrl: string;
  description: string;
}

export interface LarpBuildResult {
  success: boolean;
  buildId: string;
  timestamp: string;
  appId: string;
  name: string;
  artifacts: GeneratedArtifact[];
  detectedPermissions: string[];
  featuresApplied: {
    fullscreen: boolean;
    dynamicThemeSync: boolean;
    splashType: string;
    iconVariantsCount: number;
    pluginsEnabled: string[];
  };
  signingInfo: {
    keystoreFilename: string;
    alias: string;
    sha256Fingerprint: string;
    sha1Fingerprint: string;
    validityYears: number;
  };
  logs: string[];
}

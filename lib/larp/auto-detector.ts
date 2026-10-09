import { StaticFile } from './types';

export interface CodeAnalysisResult {
  detectedPermissions: {
    permission: string;
    description: string;
    reason: string;
  }[];
  detectedThemeColor: string | null;
  detectedTitle: string | null;
  hasViewportFitCover: boolean;
  hasCanvasOrWebGL: boolean;
  hasAudioContext: boolean;
  hasServiceWorker: boolean;
  recommendations: string[];
}

export function analyzeStaticBundle(files: StaticFile[]): CodeAnalysisResult {
  const allContent = files.map(f => f.content).join('\n');
  const htmlFiles = files.filter(f => f.path.endsWith('.html'));
  const mainHtml = htmlFiles.find(f => f.path === 'index.html' || f.path.endsWith('/index.html')) || htmlFiles[0];

  const permissions: { permission: string; description: string; reason: string }[] = [];

  // Always include INTERNET for offline/online capability
  permissions.push({
    permission: 'android.permission.INTERNET',
    description: 'Full Network Access',
    reason: 'Standard network and local asset routing capability',
  });

  // Geolocation
  if (/navigator\.geolocation|getCurrentPosition|watchPosition/i.test(allContent)) {
    permissions.push({
      permission: 'android.permission.ACCESS_FINE_LOCATION',
      description: 'Precise GPS Location',
      reason: 'Detected navigator.geolocation in script code',
    });
    permissions.push({
      permission: 'android.permission.ACCESS_COARSE_LOCATION',
      description: 'Approximate Location',
      reason: 'Detected geolocation API usage',
    });
  }

  // Camera
  if (/navigator\.mediaDevices\.getUserMedia|mediaDevices\.enumerateDevices|video|capture="camera"/i.test(allContent)) {
    permissions.push({
      permission: 'android.permission.CAMERA',
      description: 'Camera Access',
      reason: 'Detected mediaDevices.getUserMedia or camera input',
    });
  }

  // Microphone / Audio recording
  if (/navigator\.mediaDevices\.getUserMedia.*audio|webkitAudioContext|AudioContext|audio\/webm/i.test(allContent)) {
    permissions.push({
      permission: 'android.permission.RECORD_AUDIO',
      description: 'Microphone & Audio Record',
      reason: 'Detected audio capture or microphone stream usage',
    });
  }

  // Notifications
  if (/Notification\.requestPermission|serviceWorker\.showNotification|PushManager/i.test(allContent)) {
    permissions.push({
      permission: 'android.permission.POST_NOTIFICATIONS',
      description: 'Push & Local Notifications (Android 13+)',
      reason: 'Detected Notification API or serviceWorker push usage',
    });
  }

  // Bluetooth
  if (/navigator\.bluetooth/i.test(allContent)) {
    permissions.push({
      permission: 'android.permission.BLUETOOTH',
      description: 'Bluetooth Hardware',
      reason: 'Detected Web Bluetooth API usage',
    });
    permissions.push({
      permission: 'android.permission.BLUETOOTH_CONNECT',
      description: 'Bluetooth Connect (Android 12+)',
      reason: 'Required for Web Bluetooth on modern Android',
    });
  }

  // Extract theme color from HTML
  let detectedThemeColor: string | null = null;
  if (mainHtml) {
    const themeMatch = mainHtml.content.match(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i) ||
                       mainHtml.content.match(/<meta\s+content=["']([^"']+)["']\s+name=["']theme-color["']/i);
    if (themeMatch && themeMatch[1]) {
      detectedThemeColor = themeMatch[1];
    }
  }

  // Extract Title
  let detectedTitle: string | null = null;
  if (mainHtml) {
    const titleMatch = mainHtml.content.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      detectedTitle = titleMatch[1].trim();
    }
  }

  // Viewport fit
  const hasViewportFitCover = /viewport-fit=cover/i.test(allContent);
  const hasCanvasOrWebGL = /<canvas|getContext\(['"](?:webgl|2d|webgl2)['"]\)/i.test(allContent);
  const hasAudioContext = /AudioContext/i.test(allContent);
  const hasServiceWorker = /serviceWorker\.register/i.test(allContent);

  const recommendations: string[] = [];
  if (hasCanvasOrWebGL) {
    recommendations.push('Immersive Fullscreen is recommended for canvas/game layouts to maximize screen real estate.');
  }
  if (!detectedThemeColor) {
    recommendations.push('No <meta name="theme-color"> was found. Enable Dynamic Theme Sync and specify a primary accent color.');
  }
  if (!hasViewportFitCover) {
    recommendations.push('Viewport lacks "viewport-fit=cover". LARP will automatically inject this to support notch cutouts.');
  }

  return {
    detectedPermissions: permissions,
    detectedThemeColor,
    detectedTitle,
    hasViewportFitCover,
    hasCanvasOrWebGL,
    hasAudioContext,
    hasServiceWorker,
    recommendations,
  };
}

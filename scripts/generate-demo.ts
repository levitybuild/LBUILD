import { buildLarpApp } from '../lib/larp/generator';
import { SAMPLE_TEMPLATES } from '../lib/larp/sample-templates';

async function main() {
  console.log('Generating production demo artifacts with LARP...');
  const template = SAMPLE_TEMPLATES[0]; // StreakHero

  const result = await buildLarpApp({
    appId: template.appId,
    name: template.name,
    version: '1.0.0',
    versionCode: 101,
    fullscreen: false,
    themeColor: '#FAF8F5',
    watchThemeColor: true,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
    ],
    splashScreen: {
      type: 'flat_color',
      backgroundColor: '#FAF8F5',
      duration: 2500,
      autoHide: true,
      fadeInDuration: 250,
      fadeOutDuration: 350,
    },
    iconVariants: [
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
    ],
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
      commonName: 'StreakHero Publisher',
      organization: 'LARP Mobile Engineering',
      validityYears: 25,
    },
    staticBundle: {
      entrypoint: 'index.html',
      files: template.files,
    },
  });

  console.log('Build result:', result.success ? 'SUCCESS' : 'FAILED');
  console.log('Artifacts generated:');
  result.artifacts.forEach(a => {
    console.log(` - ${a.name} (${a.filename}): ${a.sizeBytes} bytes -> ${a.downloadUrl}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

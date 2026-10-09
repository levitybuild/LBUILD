import { NextRequest } from 'next/server';
import { buildLarpApp } from '@/lib/larp/generator';
import { LarpBuildConfig } from '@/lib/larp/types';
import { isSafeFileList, isValidRequestSize, jsonWithCors, optionsResponse, rejectRequest } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const maxDuration = 300;

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest) {
  if (!isValidRequestSize(req)) return rejectRequest('Request body exceeds the 10 MB limit.', 413);
  try {
    const body = await req.json();

    if (!isSafeFileList(body.staticBundle?.files)) {
      return rejectRequest('staticBundle.files must contain valid files (maximum 500 files, 5 MB each).', 400);
    }

    const config: LarpBuildConfig = {
      appId: body.appId || 'com.larp.app',
      name: body.name || 'LARP App',
      version: body.version || '1.0.0',
      versionCode: Number(body.versionCode) || 101,
      fullscreen: body.fullscreen === true,
      themeColor: body.themeColor || '#FAF8F5',
      watchThemeColor: body.watchThemeColor !== false,
      splashScreen: body.splashScreen || {
        type: 'flat_color',
        backgroundColor: body.themeColor || '#FAF8F5',
        duration: 1500,
        autoHide: true,
      },
      iconVariants: Array.isArray(body.iconVariants) && body.iconVariants.length > 0 ? body.iconVariants : [
        { id: 'default', name: 'Classic', isDefault: true, glyph: '🦉', backgroundColor: '#D97757', foregroundColor: '#FFFFFF' },
        { id: 'streak_fire', name: 'Fire Streak', isDefault: false, glyph: '🔥', backgroundColor: '#EA580C', foregroundColor: '#FFFFFF' },
        { id: 'stealth_dark', name: 'Stealth Dark', isDefault: false, glyph: '⚡', backgroundColor: '#1F1E1D', foregroundColor: '#F59E0B' },
        { id: 'golden_master', name: 'Golden Master', isDefault: false, glyph: '👑', backgroundColor: '#F59E0B', foregroundColor: '#1F1E1D' },
      ],
      permissions: Array.isArray(body.permissions) ? body.permissions : [
        'android.permission.INTERNET',
        'android.permission.VIBRATE',
      ],
      plugins: body.plugins || {
        statusBar: true,
        dynamicIcons: true,
        splashScreen: true,
        haptics: true,
        filesystem: false,
        device: true,
      },
      signing: body.signing || {
        alias: 'larp_release',
        password: 'larp_keystore_password_2026',
        commonName: body.name || 'LARP App',
        organization: 'LARP Mobile Engineering',
        validityYears: 25,
      },
      staticBundle: body.staticBundle || {
        entrypoint: 'index.html',
        files: [],
      },
    };

    const result = await buildLarpApp(config);
    return jsonWithCors(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API /api/larp/build] Build error:', err);
    return jsonWithCors({ error: errorMsg, success: false }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { createPngBuffer } from './native-compiler';

export interface ImageResolveOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  label?: string;
}

export const ANDROID_ICON_DENSITIES = [
  { name: 'mdpi', size: 48 },
  { name: 'hdpi', size: 72 },
  { name: 'xhdpi', size: 96 },
  { name: 'xxhdpi', size: 144 },
  { name: 'xxxhdpi', size: 192 },
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16) || 0xd97757;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Resolves an icon or splash image from a remote URL or direct Base64 string into a valid PNG buffer.
 * If conversion is needed, uses ImageMagick convert to guarantee exact dimensions and RGBA format.
 */
export async function resolveImageToPngBuffer(
  source?: string,
  options: ImageResolveOptions = {}
): Promise<Buffer> {
  const targetWidth = options.width || 192;
  const targetHeight = options.height || 192;
  const bgColor = options.backgroundColor || '#D97757';
  const label = (options.label || 'A').trim().charAt(0).toUpperCase();

  if (source && typeof source === 'string' && source.trim().length > 0) {
    const trimmed = source.trim();
    let rawBuffer: Buffer | null = null;

    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const res = await fetch(trimmed, {
          headers: { 'User-Agent': 'LARP-Image-Resolver/2.0' },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          rawBuffer = Buffer.from(await res.arrayBuffer());
        }
      } else {
        // Direct Base64 or Data URI
        const b64 = trimmed.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '');
        rawBuffer = Buffer.from(b64, 'base64');
      }

      if (rawBuffer && rawBuffer.length > 0) {
        const rand = crypto.randomBytes(6).toString('hex');
        const inPath = path.join('/tmp', `larp_in_${rand}`);
        const outPath = path.join('/tmp', `larp_out_${rand}.png`);

        try {
          fs.writeFileSync(inPath, rawBuffer);
          // ImageMagick: resize with aspect ratio preserved, center crop, transparent padding if needed
          execSync(
            `convert "${inPath}" -resize ${targetWidth}x${targetHeight}^ -gravity center -extent ${targetWidth}x${targetHeight} PNG32:"${outPath}"`,
            { stdio: 'pipe' }
          );
          if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
            const pngBuf = fs.readFileSync(outPath);
            return pngBuf;
          }
        } catch (magickErr) {
          const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
          if (rawBuffer.subarray(0, 8).equals(pngSig)) {
            return rawBuffer;
          }
        } finally {
          try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch (_) {}
          try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}
        }
      }
    } catch (fetchErr) {
      console.warn('[LARP Image Resolver] Failed to resolve image from source:', fetchErr);
    }
  }

  // High-fidelity procedural branded icon fallback using ImageMagick
  try {
    const rand = crypto.randomBytes(6).toString('hex');
    const outPath = path.join('/tmp', `larp_fallback_${rand}.png`);
    const pointSize = Math.round(targetHeight * 0.55);
    execSync(
      `convert -size ${targetWidth}x${targetHeight} xc:"${bgColor}" -fill white -gravity center -pointsize ${pointSize} -annotate +0+0 "${label}" PNG32:"${outPath}"`,
      { stdio: 'pipe' }
    );
    if (fs.existsSync(outPath)) {
      const buf = fs.readFileSync(outPath);
      try { fs.unlinkSync(outPath); } catch (_) {}
      return buf;
    }
  } catch (_) {}

  // Pure binary fallback
  const rgb = hexToRgb(bgColor);
  return createPngBuffer(targetWidth, targetHeight, rgb.r, rgb.g, rgb.b);
}

/**
 * Resolves a custom icon source into all standard Android mipmap density buffers:
 * mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192).
 */
export async function resolveMultiDensityIcons(
  source?: string,
  options: ImageResolveOptions = {}
): Promise<Record<string, Buffer>> {
  const result: Record<string, Buffer> = {};

  // First generate the xxxhdpi 192x192 master icon
  const masterBuffer = await resolveImageToPngBuffer(source, {
    ...options,
    width: 192,
    height: 192,
  });

  result['xxxhdpi'] = masterBuffer;
  result['default'] = masterBuffer;

  // Scale down for each Android screen density
  const rand = crypto.randomBytes(6).toString('hex');
  const masterPath = path.join('/tmp', `larp_master_${rand}.png`);
  fs.writeFileSync(masterPath, masterBuffer);

  try {
    for (const d of ANDROID_ICON_DENSITIES) {
      if (d.name === 'xxxhdpi') continue;
      const densityOutPath = path.join('/tmp', `larp_density_${d.name}_${rand}.png`);
      try {
        execSync(
          `convert "${masterPath}" -resize ${d.size}x${d.size} PNG32:"${densityOutPath}"`,
          { stdio: 'pipe' }
        );
        if (fs.existsSync(densityOutPath)) {
          result[d.name] = fs.readFileSync(densityOutPath);
          try { fs.unlinkSync(densityOutPath); } catch (_) {}
        }
      } catch (scaleErr) {
        // Fallback to procedural for this density
        const rgb = hexToRgb(options.backgroundColor || '#D97757');
        result[d.name] = createPngBuffer(d.size, d.size, rgb.r, rgb.g, rgb.b);
      }
    }
  } finally {
    try { if (fs.existsSync(masterPath)) fs.unlinkSync(masterPath); } catch (_) {}
  }

  return result;
}

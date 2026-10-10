import fs from 'fs';
import path from 'path';

const downloads = new Map<string, { body: Buffer; contentType: string; createdAt: number }>();
const downloadsDir = path.join(process.cwd(), 'public', 'downloads');

const MAX_DOWNLOADS = 100;
const MAX_AGE_MS = 60 * 60 * 1000;

function prune() {
  const cutoff = Date.now() - MAX_AGE_MS;
  for (const [name, entry] of downloads) {
    if (entry.createdAt < cutoff) downloads.delete(name);
  }
  while (downloads.size > MAX_DOWNLOADS) {
    const oldest = downloads.keys().next().value;
    if (!oldest) break;
    downloads.delete(oldest);
  }
}

export function saveBuildDownload(filename: string, body: Buffer, contentType: string) {
  prune();
  downloads.set(filename, { body, contentType, createdAt: Date.now() });
}

export function getBuildDownload(filename: string) {
  prune();
  const memoryEntry = downloads.get(filename);
  if (memoryEntry) return memoryEntry;

  // Serverless instances do not share module memory. Fall back to the build
  // output written by the current deployment so a fresh download invocation works.
  const filePath = path.join(downloadsDir, filename);
  if (!fs.existsSync(filePath)) return undefined;
  const body = fs.readFileSync(filePath);
  const contentType = filename.endsWith('.apk')
    ? 'application/vnd.android.package-archive'
    : filename.endsWith('.zip')
      ? 'application/zip'
      : filename.endsWith('.aab')
        ? 'application/octet-stream'
        : 'application/octet-stream';
  return { body, contentType, createdAt: Date.now() };
}

const downloads = new Map<string, { body: Buffer; contentType: string; createdAt: number }>();

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
  return downloads.get(filename);
}

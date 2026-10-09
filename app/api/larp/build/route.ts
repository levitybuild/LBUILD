import { NextRequest } from 'next/server';
import { buildLarpApp } from '@/lib/larp/generator';
import { LarpBuildConfig } from '@/lib/larp/types';
import { isSafeFileList, isValidRequestSize, jsonWithCors, optionsResponse, rejectRequest } from '@/lib/api/cors';

const GITHUB_API = 'https://api.github.com';
const MAX_REPOSITORIES = 100;
const MAX_CONTENT_BYTES = 5 * 1024 * 1024;

type GitHubRepository = { full_name: string; private: boolean; default_branch: string };
type GitHubContent = { type: string; encoding?: string; content?: string; size?: number; path: string };

function parseScalar(value: string): string | number | boolean {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseBuildManifest(source: string): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([a-zA-Z][\w-]*)\s*:\s*(.*?)\s*(?:#.*)?$/);
    if (match && match[2]) result[match[1]] = parseScalar(match[2]);
  }
  return result;
}

async function githubRequest<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`GitHub API request failed (${response.status}). Check the username, token, and repository access.`);
  return response.json() as Promise<T>;
}

async function readRepositoryFile(repository: GitHubRepository, filePath: string, token: string): Promise<string> {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const content = await githubRequest<GitHubContent>(`/repos/${repository.full_name}/contents/${encodedPath}`, token);
  if (content.type !== 'file' || content.encoding !== 'base64' || !content.content || (content.size ?? 0) > MAX_CONTENT_BYTES) {
    throw new Error(`${filePath} must be a base64-encoded file smaller than 5 MB.`);
  }
  return Buffer.from(content.content.replace(/\s/g, ''), 'base64').toString('utf8');
}

function assertToken(token: unknown): asserts token is string {
  if (typeof token !== 'string' || token.length < 10 || token.length > 512 || /[\s]/.test(token)) {
    throw new Error('accessToken is required and must be a valid GitHub token. It is used only for this request and never stored.');
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest) {
  if (!isValidRequestSize(req)) return rejectRequest('Request body exceeds the 10 MB limit.', 413);
  try {
    const body = await req.json();
    let input = body;
    let repository: GitHubRepository | undefined;

    if (body.githubUsername || body.accessToken) {
      assertToken(body.accessToken);
      if (typeof body.githubUsername !== 'string' || !/^[a-zA-Z0-9-]{1,39}$/.test(body.githubUsername)) {
        return rejectRequest('githubUsername must be a valid GitHub username.', 400);
      }

      const repositories = await githubRequest<GitHubRepository[]>(
        `/users/${encodeURIComponent(body.githubUsername)}/repos?type=all&sort=updated&per_page=${MAX_REPOSITORIES}`,
        body.accessToken,
      );
      const candidates = repositories.filter((repo) => repo.full_name && !repo.full_name.endsWith('/.github'));
      if (candidates.length === 0) return rejectRequest('No accessible repositories were found for this GitHub user.', 404);
      repository = candidates[Math.floor(Math.random() * candidates.length)];

      const manifestText = await readRepositoryFile(repository, 'larp-build.yml', body.accessToken);
      const manifest = parseBuildManifest(manifestText);
      const contentPath = typeof manifest.content === 'string' ? manifest.content : 'content/index.html';
      const content = await readRepositoryFile(repository, contentPath, body.accessToken);
      input = {
        ...body,
        ...manifest,
        name: manifest.name ?? repository.full_name.split('/')[1],
        appId: manifest.appId ?? `com.larp.${repository.full_name.split('/')[1].toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
        staticBundle: { entrypoint: contentPath, files: [{ path: contentPath, content }] },
      };
    }

    if (!isSafeFileList(input.staticBundle?.files)) {
      return rejectRequest('staticBundle.files must contain valid files (maximum 500 files, 5 MB each).', 400);
    }

    const config: LarpBuildConfig = {
      appId: input.appId || 'com.larp.app',
      name: input.name || 'LARP App',
      version: input.version || '1.0.0',
      versionCode: Number(input.versionCode) || 101,
      fullscreen: input.fullscreen === true,
      themeColor: input.themeColor || '#FAF8F5',
      watchThemeColor: input.watchThemeColor !== false,
      splashScreen: input.splashScreen || {
        type: 'flat_color',
        backgroundColor: input.themeColor || '#FAF8F5',
        duration: 1500,
        autoHide: true,
      },
      iconVariants: Array.isArray(input.iconVariants) && input.iconVariants.length > 0 ? input.iconVariants : [
        { id: 'default', name: 'Classic', isDefault: true, glyph: '🦉', backgroundColor: '#D97757', foregroundColor: '#FFFFFF' },
        { id: 'streak_fire', name: 'Fire Streak', isDefault: false, glyph: '🔥', backgroundColor: '#EA580C', foregroundColor: '#FFFFFF' },
        { id: 'stealth_dark', name: 'Stealth Dark', isDefault: false, glyph: '⚡', backgroundColor: '#1F1E1D', foregroundColor: '#F59E0B' },
        { id: 'golden_master', name: 'Golden Master', isDefault: false, glyph: '👑', backgroundColor: '#F59E0B', foregroundColor: '#1F1E1D' },
      ],
      permissions: Array.isArray(input.permissions) ? input.permissions : [
        'android.permission.INTERNET',
        'android.permission.VIBRATE',
      ],
      plugins: input.plugins || {
        statusBar: true,
        dynamicIcons: true,
        splashScreen: true,
        haptics: true,
        filesystem: false,
        device: true,
      },
      signing: input.signing || {
        alias: 'larp_release',
        password: 'larp_keystore_password_2026',
        commonName: input.name || 'LARP App',
        organization: 'LARP Mobile Engineering',
        validityYears: 25,
      },
      staticBundle: input.staticBundle || {
        entrypoint: 'index.html',
        files: [],
      },
    };

    const result = await buildLarpApp(config);
    return jsonWithCors({
      ...result,
      ...(repository ? { sourceRepository: repository.full_name, sourceBranch: repository.default_branch } : {}),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API /api/larp/build] Build error:', err);
    return jsonWithCors({ error: errorMsg, success: false }, { status: 500 });
  }
}

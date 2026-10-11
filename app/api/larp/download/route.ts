import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/larp/download
 * Preflight handler for open CORS support.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/larp/download
 * Download Interceptor & Stream Proxy.
 *
 * Supports:
 * 1. Refined direct file downloads: ?file=lionel_complete_release_bundle.zip or ?file=lionel.apk
 * 2. Type shortcuts: ?type=zip | ?type=apk | ?type=aab | ?type=keystore
 * 3. Private GitHub Actions artifact proxying: ?owner=...&repo=...&artifact_id=...&token=...
 *    Fetches from GitHub Actions API with provided credentials and streams to the client without CORS or auth friction!
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const artifactId = searchParams.get('artifact_id') || searchParams.get('artifactId');
    const token = searchParams.get('token') || searchParams.get('accessToken');

    // 1. Private GitHub Repository Artifact Stream Proxy
    if (artifactId && token && owner && repo) {
      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`;
      const ghRes = await fetch(ghUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'LARP-Download-Interceptor/1.0',
        },
      });

      if (!ghRes.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch artifact from GitHub Actions API (${ghRes.status} ${ghRes.statusText})`,
            hint: 'Verify that your GitHub token has repo and actions:read scopes.',
          },
          { status: ghRes.status, headers: CORS_HEADERS }
        );
      }

      const zipArrayBuf = await ghRes.arrayBuffer();
      const zipBuffer = Buffer.from(zipArrayBuf);
      const downloadFilename = `${repo}_artifact_${artifactId}.zip`;

      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Content-Length': zipBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Resolve target file from public/downloads directory
    let targetFilename = searchParams.get('file') || searchParams.get('name');
    const type = searchParams.get('type');

    if (!targetFilename && type) {
      switch (type.toLowerCase()) {
        case 'zip':
        case 'bundle':
          targetFilename = 'lionel_complete_release_bundle.zip';
          break;
        case 'apk':
          targetFilename = 'lionel.apk';
          break;
        case 'aab':
          targetFilename = 'lionel_app_production_playstore.aab';
          break;
        case 'keystore':
          targetFilename = 'larp_release.keystore';
          break;
        default:
          targetFilename = 'lionel_complete_release_bundle.zip';
      }
    }

    if (!targetFilename) {
      targetFilename = 'lionel_complete_release_bundle.zip';
    }

    // Sanitize to prevent path traversal
    const safeFilename = path.basename(targetFilename);
    const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
    let filePath = path.join(downloadsDir, safeFilename);

    // Fallbacks if exact named variant is not found
    if (!fs.existsSync(filePath)) {
      if (safeFilename.endsWith('.zip')) {
        filePath = path.join(downloadsDir, 'lionel_complete_release_bundle.zip');
      } else if (safeFilename.endsWith('.apk')) {
        filePath = path.join(downloadsDir, 'lionel.apk');
      }
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          error: `File not found: ${safeFilename}`,
          availableFiles: fs.existsSync(downloadsDir) ? fs.readdirSync(downloadsDir) : [],
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.apk') {
      contentType = 'application/vnd.android.package-archive';
    } else if (ext === '.zip' || ext === '.aab') {
      contentType = 'application/zip';
    } else if (ext === '.keystore') {
      contentType = 'application/x-java-keystore';
    } else if (ext === '.json') {
      contentType = 'application/json';
    } else if (ext === '.js') {
      contentType = 'application/javascript';
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[LARP Download Interceptor Error]', err);
    return NextResponse.json(
      { error: err.message || 'Download interceptor failure' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

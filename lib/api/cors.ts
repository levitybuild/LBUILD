import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function optionsResponse() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function jsonWithCors(data: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(data, init));
}

export function getApiOrigin(request: Request) {
  return new URL(request.url).origin;
}

export const apiLimits = {
  maxBodyBytes: 10 * 1024 * 1024,
  maxFiles: 500,
  maxFileBytes: 5 * 1024 * 1024,
};

export function isValidRequestSize(request: Request) {
  const contentLength = request.headers.get('content-length');
  return !contentLength || Number(contentLength) <= apiLimits.maxBodyBytes;
}

export function isSafeFileList(files: unknown): files is Array<{ path: string; content: string }> {
  return Array.isArray(files) && files.length <= apiLimits.maxFiles && files.every(
    (file) => file && typeof file === 'object' && typeof file.path === 'string' && typeof file.content === 'string' &&
      file.path.length > 0 && file.path.length <= 255 && file.content.length <= apiLimits.maxFileBytes &&
      !file.path.includes('..') && !file.path.startsWith('/')
  );
}

export function apiDocs(origin: string) {
  return {
    name: 'LARP REST API',
    version: '1',
    baseUrl: `${origin}/api/larp`,
    cors: 'Enabled for all origins',
    endpoints: {
      build: {
        method: 'POST',
        path: '/api/larp/build',
        contentType: 'application/json',
        body: { name: 'My App', appId: 'com.example.app', version: '1.0.0', staticBundle: { entrypoint: 'index.html', files: [{ path: 'index.html', content: '<h1>Hello</h1>' }] } },
        response: 'Build metadata and direct artifact download URLs',
      },
      analyze: {
        method: 'POST',
        path: '/api/larp/analyze',
        body: { files: [{ path: 'index.html', content: '<html></html>' }] },
      },
      docs: { method: 'GET', path: '/api/docs' },
    },
  };
}

export function rejectRequest(message: string, status: number) {
  return jsonWithCors({ error: message, success: false }, { status });
}

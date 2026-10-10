import { NextRequest, NextResponse } from 'next/server';

const allowedOrigin = (origin: string | null) => {
  if (!origin) return null;
  try {
    const hostname = new URL(origin).hostname;
    return hostname.endsWith('.levity.click') || hostname.endsWith('.lbuild.space') ? origin : null;
  } catch {
    return null;
  }
};

export function proxy(request: NextRequest) {
  const origin = allowedOrigin(request.headers.get('origin'));
  if (!origin || !request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Vary', 'Origin');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};

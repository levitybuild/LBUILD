import { NextRequest } from 'next/server';
import { apiDocs, jsonWithCors, optionsResponse } from '@/lib/api/cors';

export const runtime = 'edge';

export function OPTIONS() {
  return optionsResponse();
}

export function GET(request: NextRequest) {
  return jsonWithCors(apiDocs(new URL(request.url).origin), {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  });
}

export function HEAD() {
  return optionsResponse();
}

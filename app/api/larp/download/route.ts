import { NextRequest, NextResponse } from 'next/server';
import { getBuildDownload } from '@/lib/larp/download-store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('file')?.trim() || '';
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ success: false, error: 'Invalid download filename.' }, { status: 400 });
  }

  const download = getBuildDownload(filename);
  if (!download) {
    return NextResponse.json({ success: false, error: 'Download expired or not found.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(download.body), {
    headers: {
      'Content-Type': download.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

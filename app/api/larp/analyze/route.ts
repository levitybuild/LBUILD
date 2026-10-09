import { NextRequest, NextResponse } from 'next/server';
import { analyzeStaticBundle } from '@/lib/larp/auto-detector';
import { StaticFile } from '@/lib/larp/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { files: StaticFile[] };

    if (!body.files || !Array.isArray(body.files)) {
      return NextResponse.json({ error: 'files array is required' }, { status: 400 });
    }

    const analysis = analyzeStaticBundle(body.files);
    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

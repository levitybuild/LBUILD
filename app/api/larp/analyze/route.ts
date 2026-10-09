import { NextRequest } from 'next/server';
import { analyzeStaticBundle } from '@/lib/larp/auto-detector';
import { StaticFile } from '@/lib/larp/types';
import { isSafeFileList, isValidRequestSize, jsonWithCors, optionsResponse, rejectRequest } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const maxDuration = 60;

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest) {
  if (!isValidRequestSize(req)) return rejectRequest('Request body exceeds the 10 MB limit.', 413);
  try {
    const body = await req.json() as { files: StaticFile[] };

    if (!isSafeFileList(body.files)) {
      return rejectRequest('files must contain valid files (maximum 500 files, 5 MB each).', 400);
    }

    const analysis = analyzeStaticBundle(body.files);
    return jsonWithCors(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return jsonWithCors({ error: message }, { status: 500 });
  }
}

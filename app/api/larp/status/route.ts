import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { put } from '@vercel/blob';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept, X-GitHub-Token' };
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing build id' }, { status: 400, headers: cors });
    const token = (req.headers.get('x-github-token') || req.nextUrl.searchParams.get('token') || '').trim().replace(/^\/+/, '');
    if (!token) return NextResponse.json({ success: false, error: 'GitHub token is required while polling' }, { status: 401, headers: cors });
    const decoded = JSON.parse(Buffer.from(id, 'base64url').toString('utf8')) as { username: string; repo: string; runId: number };
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'LARP-Android-Compiler-Bridge', 'X-GitHub-Api-Version': '2022-11-28' };
    const base = `https://api.github.com/repos/${encodeURIComponent(decoded.username)}/${encodeURIComponent(decoded.repo)}`;
    const runRes = await fetch(`${base}/actions/runs/${decoded.runId}`, { headers, cache: 'no-store' });
    if (!runRes.ok) throw new Error(`GitHub run lookup failed (${runRes.status})`);
    const run = await runRes.json();
    if (run.status !== 'completed') return NextResponse.json({ success: true, status: run.status === 'queued' ? 'queued' : 'running', progress: run.status, buildId: id, github: { runId: run.id, runUrl: run.html_url } }, { headers: cors });
    if (run.conclusion !== 'success') return NextResponse.json({ success: false, status: 'failed', buildId: id, error: `GitHub Actions concluded ${run.conclusion}`, github: { runId: run.id, runUrl: run.html_url } }, { status: 500, headers: cors });
    const artsRes = await fetch(`${base}/actions/runs/${decoded.runId}/artifacts`, { headers, cache: 'no-store' });
    const arts = await artsRes.json();
    const artifact = arts.artifacts?.find((a: any) => a.name.includes('release')) || arts.artifacts?.[0];
    if (!artifact) return NextResponse.json({ success: true, status: 'running', progress: 'waiting_for_artifact', buildId: id }, { headers: cors });
    const zipRes = await fetch(`${base}/actions/artifacts/${artifact.id}/zip`, { headers, cache: 'no-store' });
    const artifactBytes = Buffer.from(await zipRes.arrayBuffer());
    const zip = await JSZip.loadAsync(artifactBytes);
    const apkPath = Object.keys(zip.files).find((p) => p.toLowerCase().endsWith('.apk'));
    if (!apkPath) throw new Error('GitHub artifact contains no APK');
    const apkBytes = await zip.file(apkPath)!.async('nodebuffer');
    const prefix = `larp/${id}`;
    const [apkBlob, zipBlob] = await Promise.all([
      put(`${prefix}/${apkPath.split('/').pop()}`, apkBytes, { access: 'public', addRandomSuffix: false, contentType: 'application/vnd.android.package-archive' }),
      put(`${prefix}/${artifact.name}.zip`, artifactBytes, { access: 'public', addRandomSuffix: false, contentType: 'application/zip' }),
    ]);
    return NextResponse.json({ success: true, status: 'completed', buildId: id, apkUrl: apkBlob.url, zipUrl: zipBlob.url, github: { runId: run.id, runUrl: run.html_url, artifactId: artifact.id, artifactName: artifact.name } }, { headers: cors });
  } catch (error: any) { return NextResponse.json({ success: false, status: 'failed', error: error.message || 'Status lookup failed' }, { status: 500, headers: cors }); }
}

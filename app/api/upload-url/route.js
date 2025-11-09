export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../lib/auth';

// Issue a direct-to-Blob upload URL for client-side uploads.
// The client will POST the file directly to Vercel Blob with the returned token.
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN. Create a Blob Store token and add it to project env.' }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch {}
  const originalName = String(body?.originalName || body?.name || '').trim();
  const contentType = String(body?.contentType || body?.type || 'application/octet-stream');
  if (!originalName) {
    return NextResponse.json({ error: 'originalName required' }, { status: 400 });
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9_.가-힣-]+/g, '_');
  // Root endpoint (no /upload path) avoids 405; client will set x-vercel-filename header.
  return NextResponse.json({
    uploadEndpoint: 'https://blob.vercel-storage.com',
    token,
    fileName: safeName,
    contentType
  });
}

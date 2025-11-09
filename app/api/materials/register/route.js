export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { createMaterial } from '../../../../lib/db';

// Register a material after the file is uploaded directly to Vercel Blob
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {}
  const topicId = Number(body?.topicId);
  const title = String(body?.title || '').trim();
  const fileName = String(body?.fileName || '').trim();
  const fileType = String(body?.fileType || 'application/octet-stream');
  const fileSize = body?.fileSize ? Number(body.fileSize) : null;
  const blobUrl = String(body?.blobUrl || '').trim();

  if (!topicId || !blobUrl || !fileName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const material = await createMaterial({
      topicId,
      title: title || fileName,
      fileName,
      fileType,
      fileSize,
      blobUrl
    });
    return NextResponse.json({ material });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Register failed' }, { status: 500 });
  }
}

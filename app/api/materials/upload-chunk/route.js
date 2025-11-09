export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { mkdir, writeFile, stat } from 'fs/promises';
import path from 'path';

// Receive and store a file chunk
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const uploadId = formData.get('uploadId');
  const chunkIndex = Number(formData.get('chunkIndex'));
  const chunkBlob = formData.get('chunk');

  if (!uploadId || chunkIndex === undefined || !chunkBlob) {
    return NextResponse.json({ error: 'Missing uploadId, chunkIndex, or chunk' }, { status: 400 });
  }

  // Write chunk to temp directory so we don't rely on in-memory globals
  try {
    const baseDir = path.join('/tmp', 'uploads', uploadId);
    // Ensure session exists by checking meta.json
    try {
      await stat(path.join(baseDir, 'meta.json'));
    } catch {
      return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
    }
    await mkdir(baseDir, { recursive: true });
    const arrayBuffer = await chunkBlob.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const chunkPath = path.join(baseDir, `${chunkIndex}.part`);
    await writeFile(chunkPath, buf);
    return NextResponse.json({ received: chunkIndex });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Failed to write chunk' }, { status: 500 });
  }
}

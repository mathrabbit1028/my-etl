export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

// Initialize chunked upload session
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileName, fileSize, fileType, topicId, title } = await request.json();
  if (!fileName || !fileSize || !topicId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const uploadId = randomUUID();

  // Persist session metadata to a temp folder to avoid losing state across requests
  // Note: /tmp is writable on most serverless platforms; adjust as needed for self-hosted.
  const baseDir = path.join('/tmp', 'uploads', uploadId);
  try {
    await mkdir(baseDir, { recursive: true });
    const meta = {
      fileName,
      fileSize,
      fileType: fileType || 'application/octet-stream',
      topicId: Number(topicId),
      title: title || fileName,
      createdAt: Date.now()
    };
    await writeFile(path.join(baseDir, 'meta.json'), JSON.stringify(meta));
  } catch (e) {
    return NextResponse.json({ error: 'Failed to initialize upload session' }, { status: 500 });
  }

  return NextResponse.json({ uploadId });
}

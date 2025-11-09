export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { randomUUID } from 'crypto';
import { createUploadSession } from '../../../../lib/db';

// Initialize chunked upload session
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileName, fileSize, fileType, topicId, title } = await request.json();
  if (!fileName || !fileSize || !topicId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const uploadId = randomUUID();
  try {
    await createUploadSession({
      id: uploadId,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize,
      topicId: Number(topicId),
      title: title || fileName
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Failed to initialize upload session' }, { status: 500 });
  }

  return NextResponse.json({ uploadId });
}

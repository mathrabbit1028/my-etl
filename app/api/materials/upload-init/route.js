export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { randomUUID } from 'crypto';

// Initialize chunked upload session
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileName, fileSize, fileType, topicId, title } = await request.json();
  if (!fileName || !fileSize || !topicId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const uploadId = randomUUID();
  
  // Store session metadata (in-memory for now; consider Redis for production)
  global.uploadSessions = global.uploadSessions || {};
  global.uploadSessions[uploadId] = {
    fileName,
    fileSize,
    fileType: fileType || 'application/octet-stream',
    topicId: Number(topicId),
    title: title || fileName,
    chunks: {},
    createdAt: Date.now()
  };

  return NextResponse.json({ uploadId });
}

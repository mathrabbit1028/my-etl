import { NextResponse } from 'next/server';
import { createMaterial } from '../../../lib/db';
import { isAdminFromRequest } from '../../../lib/auth';

export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { topicId, title, fileName, fileType, fileSize, blobUrl } = body || {};
  if (!topicId || !title || !fileName || !blobUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const material = await createMaterial({
    topicId: Number(topicId),
    title: String(title),
    fileName: String(fileName),
    fileType: fileType ? String(fileType) : null,
    fileSize: fileSize ? Number(fileSize) : null,
    blobUrl: String(blobUrl),
  });
  return NextResponse.json({ material });
}

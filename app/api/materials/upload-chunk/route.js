export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';

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

  global.uploadSessions = global.uploadSessions || {};
  const session = global.uploadSessions[uploadId];
  if (!session) {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
  }

  // Store chunk as Buffer
  const arrayBuffer = await chunkBlob.arrayBuffer();
  session.chunks[chunkIndex] = Buffer.from(arrayBuffer);

  return NextResponse.json({ received: chunkIndex });
}

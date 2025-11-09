export const runtime = 'nodejs';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { put } from '@vercel/blob';
import { createMaterial } from '../../../../lib/db';

// Finalize chunked upload: assemble chunks and upload to Blob
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { uploadId } = await request.json();
  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  global.uploadSessions = global.uploadSessions || {};
  const session = global.uploadSessions[uploadId];
  if (!session) {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
  }

  try {
    // Assemble chunks in order
    const chunkIndexes = Object.keys(session.chunks).map(Number).sort((a, b) => a - b);
    const buffers = chunkIndexes.map(idx => session.chunks[idx]);
    const completeFile = Buffer.concat(buffers);

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 });
    }

    const uploaded = await put(session.fileName, completeFile, {
      access: 'public',
      contentType: session.fileType,
      token
    });

    // Save to DB
    const material = await createMaterial({
      topicId: session.topicId,
      title: session.title,
      fileName: session.fileName,
      fileType: session.fileType,
      fileSize: completeFile.length,
      blobUrl: uploaded.url
    });

    // Cleanup session
    delete global.uploadSessions[uploadId];

    return NextResponse.json({ material });
  } catch (e) {
    console.error('FINALIZE_ERROR', e);
    return NextResponse.json({ error: e?.message || 'Finalize failed' }, { status: 500 });
  }
}

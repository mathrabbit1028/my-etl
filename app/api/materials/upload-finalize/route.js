export const runtime = 'nodejs';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { put } from '@vercel/blob';
import { createMaterial, getUploadSession, listUploadChunks, deleteUploadSession } from '../../../../lib/db';

// Finalize chunked upload: assemble chunks and upload to Blob
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { uploadId } = await request.json();
  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  const session = await getUploadSession(uploadId);
  if (!session) {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
  }

  try {
    // Fetch chunks from DB and assemble
    const chunkRows = await listUploadChunks(uploadId);
    if (chunkRows.length === 0) {
      return NextResponse.json({ error: 'No chunks uploaded' }, { status: 400 });
    }
    // Ensure contiguous from 0..n-1
    const sorted = chunkRows.sort((a,b)=>a.chunk_index - b.chunk_index);
    for (let i=0;i<sorted.length;i++) {
      if (sorted[i].chunk_index !== i) {
        return NextResponse.json({ error: 'Missing chunk index '+i }, { status: 400 });
      }
    }
    const buffers = sorted.map(r => r.data);
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

    // Cleanup session & chunks
    try { await deleteUploadSession(uploadId); } catch {}

    return NextResponse.json({ material });
  } catch (e) {
    console.error('FINALIZE_ERROR', e);
    return NextResponse.json({ error: e?.message || 'Finalize failed' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { put } from '@vercel/blob';
import { createMaterial } from '../../../../lib/db';
import { readdir, readFile, unlink, rm, stat } from 'fs/promises';
import path from 'path';

// Finalize chunked upload: assemble chunks and upload to Blob
export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { uploadId } = await request.json();
  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  const baseDir = path.join('/tmp', 'uploads', uploadId);
  // Load metadata and available chunks from disk
  let session;
  try {
    const metaPath = path.join(baseDir, 'meta.json');
    await stat(metaPath); // throws if not exists
    const metaRaw = await readFile(metaPath, 'utf-8');
    session = JSON.parse(metaRaw);
  } catch {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
  }

  try {
    // Assemble chunks in order from files on disk
    const files = await readdir(baseDir);
    const partFiles = files.filter(f => f.endsWith('.part'));
    if (partFiles.length === 0) {
      return NextResponse.json({ error: 'No chunks uploaded' }, { status: 400 });
    }
    const chunkIndexes = partFiles
      .map(f => Number(f.replace('.part', '')))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b);
    const buffers = [];
    for (const idx of chunkIndexes) {
      const buf = await readFile(path.join(baseDir, `${idx}.part`));
      buffers.push(buf);
    }
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

    // Cleanup session directory
    try {
      // Remove part files and meta
      const filesToRemove = await readdir(baseDir);
      await Promise.all(filesToRemove.map(async (f) => {
        try { await unlink(path.join(baseDir, f)); } catch {}
      }));
      await rm(baseDir, { recursive: true, force: true });
    } catch {}

    return NextResponse.json({ material });
  } catch (e) {
    console.error('FINALIZE_ERROR', e);
    return NextResponse.json({ error: e?.message || 'Finalize failed' }, { status: 500 });
  }
}

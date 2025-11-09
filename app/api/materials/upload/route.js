export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for large uploads
import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { put } from '@vercel/blob';
import { createMaterial } from '../../../../lib/db';

export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const topicId = Number(form.get('topicId'));
  let title = String(form.get('title') || '').trim();
  const file = form.get('file');
  if (!topicId || !file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // 제목이 비어있으면 파일 이름 사용
  if (!title) {
    title = file.name;
  }

  const contentType = file.type || 'application/octet-stream';
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN. Create a Blob Store token and add it to project env.' }, { status: 500 });
  }

  try {
    const uploaded = await put(file.name, file, { access: 'public', contentType, token });
    const material = await createMaterial({
      topicId,
      title,
      fileName: file.name,
      fileType: contentType,
      fileSize: file.size || null,
      blobUrl: uploaded.url,
    });
    return NextResponse.json({ material });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}

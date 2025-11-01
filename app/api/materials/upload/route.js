import { NextResponse } from 'next/server';
import { isAdminFromRequest } from '../../../../lib/auth';
import { put } from '@vercel/blob';
import { createMaterial } from '../../../../lib/db';

export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const topicId = Number(form.get('topicId'));
  const title = String(form.get('title') || '').trim();
  const file = form.get('file');
  if (!topicId || !title || !file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const contentType = file.type || 'application/octet-stream';
  const uploaded = await put(file.name, file, { access: 'public', contentType });
  const material = await createMaterial({
    topicId,
    title,
    fileName: file.name,
    fileType: contentType,
    fileSize: file.size || null,
    blobUrl: uploaded.url,
  });

  return NextResponse.json({ material });
}

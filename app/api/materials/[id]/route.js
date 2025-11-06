export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { deleteMaterial, moveMaterialToOwner } from '../../../../lib/db';
import { isAdminFromRequest } from '../../../../lib/auth';
import { del } from '@vercel/blob';

export async function DELETE(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const deleted = await deleteMaterial(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (deleted?.blob_url) {
      const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
      try { await del(deleted.blob_url, token ? { token } : undefined); } catch {}
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolved = await params;
  const id = Number(resolved.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await request.json();
  const owner = String(body?.owner || '').trim();
  if (!owner) return NextResponse.json({ error: 'owner required' }, { status: 400 });
  try {
    await moveMaterialToOwner(id, owner);
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Move failed' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

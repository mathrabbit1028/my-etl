export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { deleteMaterial } from '../../../../lib/db';
import { isAdminFromRequest } from '../../../../lib/auth';
import { del } from '@vercel/blob';

export async function DELETE(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const deleted = await deleteMaterial(id);
  if (deleted?.blob_url) {
    try { await del(deleted.blob_url); } catch {}
  }
  return NextResponse.json({ ok: true });
}

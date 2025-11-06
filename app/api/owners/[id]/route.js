export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getOwnerById, updateOwnerName, deleteOwner } from '../../../../lib/db';
import { isAdminFromRequest } from '../../../../lib/auth';

export async function PATCH(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolved = await params;
  const id = Number(resolved.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await request.json();
  const name = String(body?.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const exists = await getOwnerById(id);
  if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = await updateOwnerName(id, name);
  return NextResponse.json({ owner: updated });
}

export async function DELETE(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolved = await params;
  const id = Number(resolved.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await deleteOwner(id);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Delete failed' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { deleteTopic, updateTopicTitle, updateTopicOwner } from '../../../../lib/db';
import { isAdminFromRequest } from '../../../../lib/auth';

export async function DELETE(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await deleteTopic(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request, { params }) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await request.json();
  const { title, owner } = body;
  if (!title && !owner) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }
  if (title && title.trim()) {
    await updateTopicTitle(id, title.trim());
  }
  if (owner && String(owner).trim()) {
    try {
      await updateTopicOwner(id, String(owner).trim());
    } catch (e) {
      return NextResponse.json({ error: e?.message || 'Owner update failed' }, { status: 400 });
    }
  }
  return NextResponse.json({ ok: true });
}

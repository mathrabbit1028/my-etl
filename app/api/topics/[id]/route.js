export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { deleteTopic } from '../../../../lib/db';
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

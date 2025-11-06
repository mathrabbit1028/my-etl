export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { listOwners, createOwner } from '../../../lib/db';
import { isAdminFromRequest } from '../../../lib/auth';

export async function GET() {
  const owners = await listOwners();
  return NextResponse.json({ owners });
}

export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const slug = String(body?.slug || '').trim();
  const name = String(body?.name || '').trim();
  if (!slug || !name) return NextResponse.json({ error: 'slug and name required' }, { status: 400 });
  const owner = await createOwner({ slug, name, sortOrder: body?.sortOrder ?? 0 });
  return NextResponse.json({ owner });
}

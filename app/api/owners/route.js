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
  const name = String(body?.name || '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  // slug is optional; auto-generate stable unique-ish slug when missing
  let slug = String(body?.slug || '').trim();
  if (!slug) {
    // keep it opaque; we don't expose slug in UI
    slug = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }
  const owner = await createOwner({ slug, name, sortOrder: body?.sortOrder ?? 0 });
  return NextResponse.json({ owner });
}

export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { listTopicsWithMaterials, createTopic } from '../../../lib/db';
import { isAdminFromRequest } from '../../../lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner') || 'default';
  const topics = await listTopicsWithMaterials(owner);
  return NextResponse.json({ topics });
}

export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const title = String(body?.title || '').trim();
  const owner = String(body?.owner || 'default');
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });
  const topic = await createTopic(title, 0, owner);
  return NextResponse.json({ topic });
}

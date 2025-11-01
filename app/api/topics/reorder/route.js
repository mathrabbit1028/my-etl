export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { updateTopicOrder } from '../../../../lib/db';
import { isAdminFromRequest } from '../../../../lib/auth';

export async function POST(request) {
  const admin = await isAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await request.json();
  const { topicIds } = body;
  
  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    return NextResponse.json({ error: 'topicIds array required' }, { status: 400 });
  }
  
  await updateTopicOrder(topicIds);
  return NextResponse.json({ ok: true });
}

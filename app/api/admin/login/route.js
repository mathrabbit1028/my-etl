import { NextResponse } from 'next/server';
import { createAdminCookie } from '../../../../lib/auth';

export async function POST(request) {
  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  const cookie = await createAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

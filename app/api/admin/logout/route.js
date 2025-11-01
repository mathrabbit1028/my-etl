import { NextResponse } from 'next/server';
import { clearAdminCookie } from '../../../../lib/auth';

export async function POST() {
  const cookie = clearAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

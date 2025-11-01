import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_token';

async function isAdminCookie(cookieValue) {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || process.env.SECRET);
    if (!secret) return false;
    const { payload } = await jwtVerify(cookieValue, secret);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookie = request.cookies.get(COOKIE_NAME);
    const ok = cookie && await isAdminCookie(cookie.value);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

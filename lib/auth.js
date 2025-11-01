import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_token';

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.SECRET;
  if (!secret) throw new Error('Missing AUTH_SECRET environment variable');
  return new TextEncoder().encode(secret);
}

export async function createAdminCookie() {
  const secret = getSecret();
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export async function isAdminFromRequest(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (!match) return false;
    const token = match[1];
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function clearAdminCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 0,
    },
  };
}

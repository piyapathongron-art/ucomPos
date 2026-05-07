import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { COOKIE_NAMES } from '@/lib/constants';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/health'];

const PROTECTED_PREFIXES = ['/pos', '/services', '/installments', '/stock', '/reports', '/users', '/audit', '/settings'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    (pathname.startsWith('/api') &&
      !pathname.startsWith('/api/auth/login') &&
      !pathname.startsWith('/api/auth/refresh') &&
      !pathname.startsWith('/api/auth/logout'));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Token หมดอายุ' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-user-username', payload.username);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

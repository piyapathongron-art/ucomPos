import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type AuthTokenPayload } from '@/lib/auth';
import { COOKIE_NAMES } from '@/lib/constants';

export interface AuthedRequest extends NextRequest {
  user: AuthTokenPayload;
}

/**
 * Extract auth payload from a request (uses cookies, falls back to middleware-injected headers).
 * Returns null if unauthenticated.
 */
export async function getAuth(req: NextRequest): Promise<AuthTokenPayload | null> {
  const fromHeaderId = req.headers.get('x-user-id');
  if (fromHeaderId) {
    return {
      sub: fromHeaderId,
      username: req.headers.get('x-user-username') || '',
      role: (req.headers.get('x-user-role') as 'ADMIN' | 'STAFF') || 'STAFF',
      permissions: JSON.parse(req.headers.get('x-user-permissions') || '[]'),
    };
  }

  const token = req.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

/** Wrap an API handler to require authentication. */
export function requireAuth<T>(
  handler: (req: NextRequest, user: AuthTokenPayload) => Promise<T>
) {
  return async (req: NextRequest) => {
    const user = await getAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
    }
    return handler(req, user);
  };
}

/** Wrap an API handler to require a specific permission. */
export function requirePermission<T>(
  permission: string,
  handler: (req: NextRequest, user: AuthTokenPayload) => Promise<T>
) {
  return async (req: NextRequest) => {
    const user = await getAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
    }
    const allowed =
      user.permissions.includes('all') || user.permissions.includes(permission);
    if (!allowed) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    return handler(req, user);
  };
}

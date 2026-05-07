import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-this-in-production-min-32-chars'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-this-in-prod-min-32-chars'
);

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
  permissions: string[];
}

export async function signAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: { sub: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as { sub: string };
  } catch {
    return null;
  }
}

export function hasPermission(
  userPermissions: string[],
  required: string
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('all')) return true;
  return userPermissions.includes(required);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, verifyRefreshToken } from '@/lib/auth';
import { COOKIE_NAMES, COOKIE_OPTIONS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'ไม่พบ refresh token' }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ error: 'Refresh token ไม่ถูกต้อง' }, { status: 401 });
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Refresh token หมดอายุ' }, { status: 401 });
  }

  if (!stored.user.isActive) {
    return NextResponse.json({ error: 'ผู้ใช้ถูกระงับ' }, { status: 401 });
  }

  const accessToken = await signAccessToken({
    sub: stored.user.id,
    username: stored.user.username,
    role: stored.user.role,
    permissions: stored.user.permissions,
  });

  const res = NextResponse.json({ accessToken });
  res.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  });
  return res;
}

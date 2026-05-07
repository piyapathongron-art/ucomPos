import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAMES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;

  if (refreshToken) {
    try {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    } catch (err) {
      console.error('[POST /api/auth/logout]', err);
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
  res.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
  return res;
}

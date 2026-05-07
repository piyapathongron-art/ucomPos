import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAMES } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  if (!token) {
    return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      permissions: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'ผู้ใช้ไม่พบ' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

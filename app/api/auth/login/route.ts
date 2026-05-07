import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/bcrypt';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';
import { COOKIE_NAMES, COOKIE_OPTIONS } from '@/lib/constants';
import type { LoginResponse } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
    });

    const refreshToken = await signRefreshToken({ sub: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
      },
    });

    const response: LoginResponse = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
      accessToken,
    };

    const res = NextResponse.json(response);

    res.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60,
    });

    res.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}

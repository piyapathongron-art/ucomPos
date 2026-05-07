import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { getUser, updateUser, deactivateUser } from '@/server/services/userService';
import { userUpdateSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('users', async () => {
    const { id } = await params;
    const user = await getUser(id);
    if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    return NextResponse.json({ user });
  })(req);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return requirePermission('users', async (req, currentUser) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const user = await updateUser(id, parsed.data);

      await recordAudit({
        userId: currentUser.sub,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: id,
        changes: parsed.data,
      });

      return NextResponse.json({ user });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('users', async (_req, currentUser) => {
    const { id } = await params;

    if (id === currentUser.sub) {
      return NextResponse.json({ error: 'ไม่สามารถปิดบัญชีตัวเองได้' }, { status: 400 });
    }

    try {
      await deactivateUser(id);

      await recordAudit({
        userId: currentUser.sub,
        action: 'DEACTIVATE_USER',
        entityType: 'User',
        entityId: id,
      });

      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

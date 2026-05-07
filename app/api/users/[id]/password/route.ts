import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { changeUserPassword } from '@/server/services/userService';
import { changePasswordSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return requirePermission('users', async (req, currentUser) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      await changeUserPassword(id, parsed.data.newPassword);

      await recordAudit({
        userId: currentUser.sub,
        action: 'CHANGE_USER_PASSWORD',
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

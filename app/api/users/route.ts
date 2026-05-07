import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { listUsers, createUser } from '@/server/services/userService';
import { userCreateSchema } from '@/lib/validators';

export const GET = requirePermission('users', async () => {
  const users = await listUsers();
  return NextResponse.json({ users });
});

export const POST = requirePermission('users', async (req: NextRequest, currentUser) => {
  const body = await req.json();
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await createUser(parsed.data);

    await recordAudit({
      userId: currentUser.sub,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      changes: { username: user.username, role: user.role },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    if (msg.includes('Unique constraint') || msg.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

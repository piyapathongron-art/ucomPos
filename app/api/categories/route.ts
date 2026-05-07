import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

export const GET = requireAuth(async () => {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ categories });
});

export const POST = requirePermission('settings', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลหมวดหมู่ไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const category = await prisma.category.create({ data: parsed.data });
    await recordAudit({
      userId: user.sub,
      action: 'CREATE_CATEGORY',
      entityType: 'Category',
      entityId: category.id,
      changes: { after: parsed.data },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'ชื่อหมวดหมู่ซ้ำ' }, { status: 409 });
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
});

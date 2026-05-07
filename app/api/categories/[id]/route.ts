import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return requirePermission('settings', async (req, user) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
    await recordAudit({
      userId: user.sub,
      action: 'UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      changes: { patch: parsed.data },
    });
    return NextResponse.json({ category });
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('settings', async (_req, user) => {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    await recordAudit({
      userId: user.sub,
      action: 'DELETE_CATEGORY',
      entityType: 'Category',
      entityId: id,
    });
    return NextResponse.json({ success: true });
  })(req);
}

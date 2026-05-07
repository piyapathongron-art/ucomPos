import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { getPartner, updatePartner, deactivatePartner } from '@/server/services/partnerService';
import { partnerUpdateSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async () => {
    const { id } = await params;
    const partner = await getPartner(id);
    if (!partner) {
      return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 });
    }
    return NextResponse.json({ partner });
  })(req);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async (req, user) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = partnerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const partner = await updatePartner(id, parsed.data);

      await recordAudit({
        userId: user.sub,
        action: 'UPDATE_PARTNER',
        entityType: 'Partner',
        entityId: id,
        changes: parsed.data,
      });

      return NextResponse.json({ partner });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async (_req, user) => {
    const { id } = await params;
    try {
      await deactivatePartner(id);

      await recordAudit({
        userId: user.sub,
        action: 'DEACTIVATE_PARTNER',
        entityType: 'Partner',
        entityId: id,
      });

      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

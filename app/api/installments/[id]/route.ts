import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import {
  cancelInstallment,
  getInstallment,
} from '@/server/services/installmentService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async () => {
    const { id } = await params;
    const installment = await getInstallment(id);
    if (!installment) {
      return NextResponse.json({ error: 'ไม่พบบิลผ่อน' }, { status: 404 });
    }
    return NextResponse.json({ installment });
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async (_req, user) => {
    const { id } = await params;
    try {
      const installment = await cancelInstallment(id);
      await recordAudit({
        userId: user.sub,
        action: 'CANCEL_INSTALLMENT',
        entityType: 'Installment',
        entityId: id,
        changes: { customerName: installment.customerName, mode: installment.mode },
      });
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      console.error('[DELETE /api/installments/[id]]', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

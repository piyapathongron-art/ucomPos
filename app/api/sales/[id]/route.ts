import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { getSale, voidSale } from '@/server/services/salesService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('report', async () => {
    const { id } = await params;
    const sale = await getSale(id);
    if (!sale) {
      return NextResponse.json({ error: 'ไม่พบการขาย' }, { status: 404 });
    }
    return NextResponse.json({ sale });
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('report', async (_req, user) => {
    const { id } = await params;
    try {
      const sale = await voidSale(id, user.sub);
      await recordAudit({
        userId: user.sub,
        action: 'VOID_SALE',
        entityType: 'Sale',
        entityId: id,
      });
      return NextResponse.json({ sale });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'ยกเลิกการขายไม่สำเร็จ' },
        { status: 400 }
      );
    }
  })(req);
}

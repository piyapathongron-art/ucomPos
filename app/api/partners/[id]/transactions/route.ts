import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { recordTransaction } from '@/server/services/partnerService';
import { partnerTransactionSchema } from '@/lib/validators';
import type { PartnerTxType } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async (req, user) => {
    const { id: partnerId } = await params;
    const body = await req.json();
    const parsed = partnerTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const tx = await recordTransaction({
        partnerId,
        type: parsed.data.type as PartnerTxType,
        amount: parsed.data.amount,
        description: parsed.data.description,
        userId: user.sub,
      });

      await recordAudit({
        userId: user.sub,
        action: 'RECORD_PARTNER_TRANSACTION',
        entityType: 'PartnerTransaction',
        entityId: tx.id,
        changes: { partnerId, type: tx.type, amount: Number(tx.amount) },
      });

      return NextResponse.json({ transaction: tx }, { status: 201 });
    } catch (err: unknown) {
      console.error('[POST /api/partners/[id]/transactions]', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

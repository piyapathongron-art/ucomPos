import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import {
  recordCommission,
  recordPayment,
} from '@/server/services/installmentService';
import { installmentPaymentSchema } from '@/lib/validators';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async () => {
    const { id } = await params;
    const payments = await prisma.installmentPayment.findMany({
      where: { installmentId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ payments });
  })(req);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  return requirePermission('installments', async (innerReq, user) => {
    const { id } = await params;
    const body = await innerReq.json();
    const parsed = installmentPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const installment = await prisma.installment.findUnique({
      where: { id },
      select: { id: true, mode: true, status: true },
    });
    if (!installment) {
      return NextResponse.json({ error: 'ไม่พบบิลผ่อน' }, { status: 404 });
    }

    try {
      const result =
        installment.mode === 'CONSIGNMENT'
          ? await recordCommission({
              installmentId: id,
              amount: parsed.data.amount,
              paymentMethod: parsed.data.paymentMethod,
              notes: parsed.data.notes ?? null,
              userId: user.sub,
            })
          : await recordPayment({
              installmentId: id,
              amount: parsed.data.amount,
              paymentMethod: parsed.data.paymentMethod,
              notes: parsed.data.notes ?? null,
              userId: user.sub,
            });

      await recordAudit({
        userId: user.sub,
        action:
          installment.mode === 'CONSIGNMENT'
            ? 'RECORD_COMMISSION'
            : 'RECORD_INSTALLMENT_PAYMENT',
        entityType: 'Installment',
        entityId: id,
        changes: {
          amount: Number(result.payment.amount),
          paymentMethod: result.payment.paymentMethod,
        },
      });

      return NextResponse.json(result, { status: 201 });
    } catch (err: unknown) {
      console.error('[POST /api/installments/[id]/payments]', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  })(req);
}

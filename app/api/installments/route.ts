import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import {
  createInstallment,
  listInstallments,
} from '@/server/services/installmentService';
import { installmentSchema } from '@/lib/validators';
import { InstallmentMode, InstallmentStatus } from '@prisma/client';

export const GET = requirePermission('installments', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const mode = searchParams.get('mode');
  const search = searchParams.get('q');
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  const installments = await listInstallments({
    status: (status as InstallmentStatus) || undefined,
    mode: (mode as InstallmentMode) || undefined,
    search: search || undefined,
    from: fromStr ? new Date(fromStr) : undefined,
    to: toStr
      ? (() => {
          const d = new Date(toStr);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : undefined,
    limit: Number(searchParams.get('limit') || '200'),
  });

  return NextResponse.json({ installments });
});

export const POST = requirePermission('installments', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = installmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const installment = await createInstallment({
      mode: parsed.data.mode,
      productId: parsed.data.productId ?? null,
      manualProduct: parsed.data.manualProduct ?? null,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone ?? null,
      customerNote: parsed.data.customerNote ?? null,
      totalAmount: parsed.data.totalAmount,
      notes: parsed.data.notes ?? null,
      userId: user.sub,
    });

    await recordAudit({
      userId: user.sub,
      action: 'CREATE_INSTALLMENT',
      entityType: 'Installment',
      entityId: installment.id,
      changes: {
        mode: installment.mode,
        customerName: installment.customerName,
        totalAmount: Number(installment.totalAmount),
      },
    });

    return NextResponse.json({ installment }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/installments]', err);
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { createSale, listSales } from '@/server/services/salesService';
import { saleSchema } from '@/lib/validators';

export const GET = requirePermission('report', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const sales = await listSales({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit: Number(searchParams.get('limit') || '100'),
  });
  return NextResponse.json({ sales });
});

export const POST = requirePermission('pos', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลการขายไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const sale = await createSale({
      userId: user.sub,
      items: parsed.data.items.map((i) => ({
        productId: i.productId ?? null,
        productName: i.productName,
        productCode: i.productCode ?? null,
        qty: i.qty,
        cost: i.cost,
        price: i.price,
        itemDiscount: i.itemDiscount,
      })),
      billDiscount: parsed.data.billDiscount,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    });

    await recordAudit({
      userId: user.sub,
      action: 'CREATE_SALE',
      entityType: 'Sale',
      entityId: sale.id,
      changes: {
        total: Number(sale.total),
        items: sale.items.length,
        paymentMethod: sale.paymentMethod,
      },
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/sales]', err);
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import {
  createProduct,
  listProducts,
} from '@/server/services/inventoryService';
import { productSchema } from '@/lib/validators';

export const GET = requirePermission('pos', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const products = await listProducts({
    search: searchParams.get('q') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    favoritesOnly: searchParams.get('favorites') === '1',
    includeInactive: searchParams.get('includeInactive') === '1',
  });
  return NextResponse.json({ products });
});

export const POST = requirePermission('stock', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลสินค้าไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const product = await createProduct(parsed.data);
    await recordAudit({
      userId: user.sub,
      action: 'CREATE_PRODUCT',
      entityType: 'Product',
      entityId: String(product.id),
      changes: { after: parsed.data },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'รหัสสินค้านี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }
    console.error('[POST /api/inventory]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
});

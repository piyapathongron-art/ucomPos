import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import {
  getProduct,
  softDeleteProduct,
  updateProduct,
} from '@/server/services/inventoryService';
import { productSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('pos', async () => {
    const { id } = await params;
    const product = await getProduct(Number(id));
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json({ product });
  })(req);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return requirePermission('stock', async (req, user) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลสินค้าไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const product = await updateProduct(Number(id), parsed.data);
    await recordAudit({
      userId: user.sub,
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: String(product.id),
      changes: { patch: parsed.data },
    });
    return NextResponse.json({ product });
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('stock', async (_req, user) => {
    const { id } = await params;
    await softDeleteProduct(Number(id));
    await recordAudit({
      userId: user.sub,
      action: 'DELETE_PRODUCT',
      entityType: 'Product',
      entityId: id,
    });
    return NextResponse.json({ success: true });
  })(req);
}

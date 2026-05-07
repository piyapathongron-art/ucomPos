import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { bulkCreateProducts } from '@/server/services/inventoryService';
import { productSchema } from '@/lib/validators';

const bulkSchema = z.object({
  products: z.array(productSchema).min(1).max(500),
});

export const POST = requirePermission('stock', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const created = await bulkCreateProducts(parsed.data.products);
    await recordAudit({
      userId: user.sub,
      action: 'BULK_IMPORT_PRODUCTS',
      entityType: 'Product',
      changes: { count: created.length },
    });
    return NextResponse.json({ count: created.length, products: created });
  } catch (err) {
    console.error('[POST /api/inventory/bulk-import]', err);
    return NextResponse.json({ error: 'นำเข้าไม่สำเร็จ' }, { status: 500 });
  }
});

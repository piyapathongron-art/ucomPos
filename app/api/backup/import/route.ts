import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { prisma } from '@/lib/prisma';

export const POST = requirePermission('settings', async (req: NextRequest, currentUser) => {
  let backup: Record<string, unknown>;
  try {
    backup = await req.json();
  } catch {
    return NextResponse.json({ error: 'ไฟล์ไม่ถูกต้อง' }, { status: 400 });
  }

  if (!backup.version || !backup.products) {
    return NextResponse.json({ error: 'ไฟล์ backup ไม่ถูกรูปแบบ' }, { status: 400 });
  }

  const stats = { categories: 0, products: 0 };

  try {
    // Upsert categories
    if (Array.isArray(backup.categories)) {
      for (const cat of backup.categories as Array<{ name: string; description?: string; order?: number }>) {
        await prisma.category.upsert({
          where: { name: cat.name },
          create: { name: cat.name, description: cat.description ?? null, order: cat.order ?? 0 },
          update: { description: cat.description ?? null, order: cat.order ?? 0 },
        });
        stats.categories++;
      }
    }

    // Upsert products (by productId)
    if (Array.isArray(backup.products)) {
      for (const p of backup.products as Array<{
        productId: string;
        name: string;
        category?: string | null;
        description?: string;
        qty: number;
        cost: number;
        price: number;
        isFavorite?: boolean;
        isActive?: boolean;
      }>) {
        let categoryId: string | null = null;
        if (p.category) {
          const cat = await prisma.category.findFirst({ where: { name: p.category } });
          categoryId = cat?.id ?? null;
        }

        await prisma.product.upsert({
          where: { productId: p.productId },
          create: {
            productId: p.productId,
            name: p.name,
            categoryId,
            description: p.description ?? null,
            qty: p.qty ?? 0,
            cost: p.cost ?? 0,
            price: p.price ?? 0,
            isFavorite: p.isFavorite ?? false,
            isActive: p.isActive ?? true,
          },
          update: {
            name: p.name,
            categoryId,
            description: p.description ?? null,
            qty: { increment: p.qty ?? 0 },
            cost: p.cost ?? 0,
            price: p.price ?? 0,
            isFavorite: p.isFavorite ?? false,
          },
        });
        stats.products++;
      }
    }

    await recordAudit({
      userId: currentUser.sub,
      action: 'IMPORT_BACKUP',
      entityType: 'System',
      entityId: 'backup',
      changes: stats,
    });

    return NextResponse.json({ ok: true, stats });
  } catch (err: unknown) {
    console.error('[POST /api/backup/import]', err);
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

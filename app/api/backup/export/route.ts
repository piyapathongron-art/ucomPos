import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { prisma } from '@/lib/prisma';

export const GET = requirePermission('settings', async (_req: NextRequest) => {
  const [categories, products, partners, partnerTransactions] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { productId: 'asc' },
    }),
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    prisma.partnerTransaction.findMany({ orderBy: { date: 'asc' } }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    categories,
    products: products.map((p) => ({
      productId: p.productId,
      name: p.name,
      category: p.category?.name ?? null,
      description: p.description,
      qty: p.qty,
      cost: Number(p.cost),
      price: Number(p.price),
      isFavorite: p.isFavorite,
      isActive: p.isActive,
    })),
    partners: partners.map((p) => ({
      ...p,
      totalDebt: Number(p.totalDebt),
      totalCommission: Number(p.totalCommission),
    })),
    partnerTransactions: partnerTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
  };

  const filename = `ucompos-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});

import { prisma } from '@/lib/prisma';

function saleDateWhere(from?: Date, to?: Date) {
  const where: { voided: boolean; date?: { gte?: Date; lte?: Date } } = {
    voided: false,
  };
  if (from || to) {
    where.date = { gte: from, lte: to };
  }
  return where;
}

export async function getRangeSummary(from?: Date, to?: Date) {
  const where = saleDateWhere(from, to);

  const [agg, cashAgg, transferAgg] = await Promise.all([
    prisma.sale.aggregate({
      where,
      _sum: { total: true, profit: true, cost: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { ...where, paymentMethod: 'CASH' },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { ...where, paymentMethod: 'TRANSFER' },
      _sum: { total: true },
      _count: { id: true },
    }),
  ]);

  const revenue = Number(agg._sum.total ?? 0);
  const saleCount = agg._count.id;

  return {
    revenue,
    profit: Number(agg._sum.profit ?? 0),
    cost: Number(agg._sum.cost ?? 0),
    saleCount,
    avgTicket: saleCount > 0 ? revenue / saleCount : 0,
    cashTotal: Number(cashAgg._sum.total ?? 0),
    cashCount: cashAgg._count.id,
    transferTotal: Number(transferAgg._sum.total ?? 0),
    transferCount: transferAgg._count.id,
  };
}

export async function getTopProducts(from?: Date, to?: Date, limit = 10) {
  const where = saleDateWhere(from, to);

  const groups = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: { sale: where, productId: { not: null } },
    _sum: { qty: true, subtotal: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: limit,
  });

  if (groups.length === 0) return [];

  const productIds = groups.map((g) => g.productId!);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, productId: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return groups.map((g) => ({
    productId: g.productId,
    productName: productMap.get(g.productId!)?.name ?? '(ลบแล้ว)',
    productCode: productMap.get(g.productId!)?.productId ?? null,
    totalQty: Number(g._sum.qty ?? 0),
    totalRevenue: Number(g._sum.subtotal ?? 0),
  }));
}

export async function getTopCategories(from?: Date, to?: Date, limit = 10) {
  const where = saleDateWhere(from, to);

  const items = await prisma.saleItem.findMany({
    where: { sale: where },
    select: {
      qty: true,
      subtotal: true,
      product: {
        select: {
          categoryId: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  const map = new Map<string, { name: string; totalRevenue: number; totalQty: number }>();
  for (const item of items) {
    const catId = item.product?.categoryId ?? '__none__';
    const catName = item.product?.category?.name ?? 'ไม่มีหมวดหมู่';
    const cur = map.get(catId) ?? { name: catName, totalRevenue: 0, totalQty: 0 };
    cur.totalRevenue += Number(item.subtotal);
    cur.totalQty += item.qty;
    map.set(catId, cur);
  }

  return Array.from(map.entries())
    .map(([id, v]) => ({
      categoryId: id === '__none__' ? null : id,
      categoryName: v.name,
      totalRevenue: v.totalRevenue,
      totalQty: v.totalQty,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

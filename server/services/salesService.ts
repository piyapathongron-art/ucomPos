import { Prisma, type PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface SaleItemInput {
  productId: number | null;
  productName: string;
  productCode?: string | null;
  qty: number;
  cost: number;
  price: number;
  itemDiscount: number;
}

export interface SaleCreateInput {
  userId: string;
  items: SaleItemInput[];
  billDiscount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface SaleTotals {
  subtotal: number;
  itemDiscount: number;
  billDiscount: number;
  total: number;
  cost: number;
  profit: number;
}

export function computeSaleTotals(
  items: SaleItemInput[],
  billDiscount: number
): SaleTotals {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemDiscount = items.reduce((s, i) => s + i.itemDiscount, 0);
  const cost = items.reduce((s, i) => s + i.cost * i.qty, 0);
  const total = Math.max(0, subtotal - itemDiscount - billDiscount);
  const profit = total - cost;
  return { subtotal, itemDiscount, billDiscount, total, cost, profit };
}

export async function createSale(input: SaleCreateInput) {
  if (input.items.length === 0) {
    throw new Error('ต้องมีสินค้าอย่างน้อย 1 รายการ');
  }

  const totals = computeSaleTotals(input.items, input.billDiscount);

  return prisma.$transaction(async (tx) => {
    // Validate stock before any writes
    for (const item of input.items) {
      if (item.productId != null) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { qty: true },
        });
        if (!product) throw new Error(`ไม่พบสินค้า "${item.productName}"`);
        if (product.qty < item.qty) {
          throw new Error(
            `"${item.productName}" สต็อกไม่พอ (มี ${product.qty} ชิ้น ต้องการ ${item.qty} ชิ้น)`
          );
        }
      }
    }

    // Decrement stock for items linked to a product
    for (const item of input.items) {
      if (item.productId != null) {
        await tx.product.update({
          where: { id: item.productId },
          data: { qty: { decrement: item.qty } },
        });
      }
    }

    const sale = await tx.sale.create({
      data: {
        userId: input.userId,
        itemDiscount: totals.itemDiscount,
        billDiscount: totals.billDiscount,
        subtotal: totals.subtotal,
        total: totals.total,
        cost: totals.cost,
        profit: totals.profit,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            productCode: i.productCode ?? null,
            qty: i.qty,
            cost: i.cost,
            price: i.price,
            itemDiscount: i.itemDiscount,
            subtotal: i.price * i.qty - i.itemDiscount,
          })),
        },
      },
      include: { items: true },
    });

    return sale;
  });
}

export async function listSales(opts: {
  from?: Date;
  to?: Date;
  userId?: string;
  paymentMethod?: PaymentMethod;
  voided?: boolean;
  limit?: number;
} = {}) {
  const where: Prisma.SaleWhereInput = {};
  if (opts.from || opts.to) {
    where.date = {
      gte: opts.from,
      lte: opts.to,
    };
  }
  if (opts.userId) where.userId = opts.userId;
  if (opts.paymentMethod) where.paymentMethod = opts.paymentMethod;
  if (typeof opts.voided === 'boolean') where.voided = opts.voided;

  return prisma.sale.findMany({
    where,
    include: {
      items: true,
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: { date: 'desc' },
    take: opts.limit ?? 100,
  });
}

export async function getSale(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function voidSale(id: string, voidedBy: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new Error('ไม่พบการขาย');
    if (sale.voided) throw new Error('การขายนี้ถูกยกเลิกไปแล้ว');

    // Restore stock
    for (const item of sale.items) {
      if (item.productId != null) {
        await tx.product.update({
          where: { id: item.productId },
          data: { qty: { increment: item.qty } },
        });
      }
    }

    return tx.sale.update({
      where: { id },
      data: {
        voided: true,
        voidedAt: new Date(),
        voidedBy,
      },
    });
  });
}

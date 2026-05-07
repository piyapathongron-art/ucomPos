import {
  InstallmentMode,
  InstallmentStatus,
  type Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ManualProductInput {
  name: string;
  productId: string;
  categoryId?: string | null;
  cost: number;
  price: number;
  description?: string;
}

export interface CreateInstallmentInput {
  mode: InstallmentMode;
  productId?: number | null;
  manualProduct?: ManualProductInput | null;
  customerName: string;
  customerPhone?: string | null;
  customerNote?: string | null;
  totalAmount?: number;
  notes?: string | null;
  userId: string;
}

export interface ListInstallmentsFilter {
  status?: InstallmentStatus;
  mode?: InstallmentMode;
  search?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export function calcProportionalProfit(
  totalAmount: number,
  cost: number,
  paidBefore: number,
  paidNow: number
): number {
  const totalProfit = totalAmount - cost;
  const paidAfter = paidBefore + paidNow;
  if (paidAfter >= totalAmount) {
    const before = (paidBefore / totalAmount) * totalProfit;
    return totalProfit - before;
  }
  return (paidNow / totalAmount) * totalProfit;
}

export async function listInstallments(filter: ListInstallmentsFilter = {}) {
  const where: Prisma.InstallmentWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.mode) where.mode = filter.mode;
  if (filter.from || filter.to) {
    where.date = { gte: filter.from, lte: filter.to };
  }
  if (filter.search) {
    where.OR = [
      { customerName: { contains: filter.search, mode: 'insensitive' } },
      { customerPhone: { contains: filter.search } },
    ];
  }

  return prisma.installment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { date: 'desc' },
    take: filter.limit ?? 200,
  });
}

export async function getInstallment(id: string) {
  return prisma.installment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, productId: true, qty: true } },
      payments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      },
    },
  });
}

export async function createInstallment(input: CreateInstallmentInput) {
  if (input.productId == null && !input.manualProduct) {
    throw new Error('ต้องเลือกสินค้าหรือเพิ่มข้อมูลเครื่องใหม่');
  }

  return prisma.$transaction(async (tx) => {
    let productId: number;
    let snapshot: { name: string; productCode: string | null; cost: number; price: number };

    if (input.productId != null) {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: { id: true, productId: true, name: true, qty: true, cost: true, price: true },
      });
      if (!product) throw new Error('ไม่พบสินค้า');
      if (product.qty < 1) throw new Error('สินค้าหมดสต็อก');

      await tx.product.update({
        where: { id: product.id },
        data: { qty: { decrement: 1 } },
      });

      productId = product.id;
      snapshot = {
        name: product.name,
        productCode: product.productId,
        cost: Number(product.cost),
        price: Number(product.price),
      };
    } else {
      const m = input.manualProduct!;
      const created = await tx.product.create({
        data: {
          productId: m.productId,
          name: m.name,
          categoryId: m.categoryId ?? null,
          description: m.description ?? null,
          qty: 0,
          cost: m.cost,
          price: m.price,
        },
        select: { id: true, productId: true, name: true, cost: true, price: true },
      });
      productId = created.id;
      snapshot = {
        name: created.name,
        productCode: created.productId,
        cost: Number(created.cost),
        price: Number(created.price),
      };
    }

    const cost = snapshot.cost;
    const basePrice = snapshot.price;
    const totalAmount =
      input.mode === 'SELF_MANAGED'
        ? Number(input.totalAmount ?? 0)
        : 0;

    const status: InstallmentStatus =
      input.mode === 'CONSIGNMENT' ? 'PENDING_COMMISSION' : 'ACTIVE';

    const installment = await tx.installment.create({
      data: {
        mode: input.mode,
        status,
        productId,
        productSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        customerName: input.customerName,
        customerPhone: input.customerPhone ?? null,
        customerNote: input.customerNote ?? null,
        cost,
        basePrice,
        totalAmount,
        paidAmount: 0,
        commission: 0,
        notes: input.notes ?? null,
        userId: input.userId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return installment;
  });
}

export interface RecordPaymentInput {
  installmentId: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  notes?: string | null;
  userId: string;
}

export async function recordCommission(input: RecordPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const inst = await tx.installment.findUnique({ where: { id: input.installmentId } });
    if (!inst) throw new Error('ไม่พบบิลผ่อน');
    if (inst.mode !== 'CONSIGNMENT') throw new Error('บิลนี้ไม่ใช่แบบฝากผ่อน');
    if (inst.status !== 'PENDING_COMMISSION') throw new Error('บิลนี้ไม่อยู่ในสถานะรอคอมมิชชัน');

    const payment = await tx.installmentPayment.create({
      data: {
        installmentId: inst.id,
        type: 'COMMISSION',
        amount: input.amount,
        profitRecognized: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
        userId: input.userId,
      },
    });

    const updated = await tx.installment.update({
      where: { id: inst.id },
      data: {
        commission: input.amount,
        status: 'COMPLETED',
        closedAt: new Date(),
      },
    });

    return { installment: updated, payment };
  });
}

export async function recordPayment(input: RecordPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const inst = await tx.installment.findUnique({ where: { id: input.installmentId } });
    if (!inst) throw new Error('ไม่พบบิลผ่อน');
    if (inst.mode !== 'SELF_MANAGED') throw new Error('บิลนี้ไม่ใช่แบบผ่อนเอง');
    if (inst.status !== 'ACTIVE') throw new Error('บิลนี้ปิดแล้วหรือถูกยกเลิก');

    const totalAmount = Number(inst.totalAmount);
    const paidBefore = Number(inst.paidAmount);
    const remaining = totalAmount - paidBefore;
    if (remaining <= 0) throw new Error('บิลนี้ชำระครบแล้ว');

    const amount = Math.min(input.amount, remaining);
    const profit = calcProportionalProfit(
      totalAmount,
      Number(inst.cost),
      paidBefore,
      amount
    );

    const payment = await tx.installmentPayment.create({
      data: {
        installmentId: inst.id,
        type: 'INSTALLMENT',
        amount,
        profitRecognized: profit,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
        userId: input.userId,
      },
    });

    const newPaid = paidBefore + amount;
    const isCompleted = newPaid >= totalAmount;

    const updated = await tx.installment.update({
      where: { id: inst.id },
      data: {
        paidAmount: newPaid,
        ...(isCompleted ? { status: 'COMPLETED', closedAt: new Date() } : {}),
      },
    });

    return { installment: updated, payment, completed: isCompleted };
  });
}

export async function cancelInstallment(id: string) {
  return prisma.$transaction(async (tx) => {
    const inst = await tx.installment.findUnique({ where: { id } });
    if (!inst) throw new Error('ไม่พบบิลผ่อน');
    if (inst.status === 'COMPLETED') throw new Error('บิลนี้จบแล้ว ไม่สามารถยกเลิกได้');
    if (inst.status === 'CANCELLED') throw new Error('บิลนี้ถูกยกเลิกแล้ว');

    if (inst.productId) {
      await tx.product.update({
        where: { id: inst.productId },
        data: { qty: { increment: 1 } },
      });
    }

    return tx.installment.update({
      where: { id },
      data: { status: 'CANCELLED', closedAt: new Date() },
    });
  });
}

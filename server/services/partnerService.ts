import { Prisma, type PartnerTxType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function listPartners(includeInactive = false) {
  return prisma.partner.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getPartner(id: string) {
  return prisma.partner.findUnique({
    where: { id },
    include: {
      transactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      },
    },
  });
}

export async function createPartner(data: {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  return prisma.partner.create({
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    },
  });
}

export async function updatePartner(
  id: string,
  data: { name?: string; phone?: string; email?: string; notes?: string }
) {
  return prisma.partner.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
    },
  });
}

export async function deactivatePartner(id: string) {
  return prisma.partner.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function recordTransaction(data: {
  partnerId: string;
  type: PartnerTxType;
  amount: number;
  description: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const delta: Prisma.PartnerUpdateInput = {};
    if (data.type === 'DEBT') {
      delta.totalDebt = { increment: data.amount };
    } else if (data.type === 'PAYMENT') {
      delta.totalDebt = { decrement: data.amount };
    } else if (data.type === 'COMMISSION') {
      delta.totalCommission = { increment: data.amount };
    }

    await tx.partner.update({ where: { id: data.partnerId }, data: delta });

    return tx.partnerTransaction.create({
      data: {
        partnerId: data.partnerId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        userId: data.userId,
      },
    });
  });
}

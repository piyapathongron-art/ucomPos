import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const expenseSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
});

const dailyCloseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ไม่ถูกต้อง'),
  expenses: z.array(expenseSchema).default([]),
  notes: z.string().optional(),
});

export const POST = requirePermission('settings', async (req: NextRequest, currentUser) => {
  const body = await req.json();
  const parsed = dailyCloseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, expenses, notes } = parsed.data;
  const dayStart = new Date(date + 'T00:00:00');
  const dayEnd = new Date(date + 'T23:59:59');

  // Aggregate sales for the day
  const sales = await prisma.sale.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      voided: false,
    },
    select: { paymentMethod: true, total: true, profit: true },
  });

  const cashSales = sales
    .filter((s) => s.paymentMethod === 'CASH')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const transferSales = sales
    .filter((s) => s.paymentMethod === 'TRANSFER')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const grossProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  try {
    const dailyClose = await prisma.dailyClose.upsert({
      where: { date: dayStart },
      create: {
        date: dayStart,
        cashSales,
        transferSales,
        totalExpenses,
        profit: netProfit,
        notes: notes ?? null,
        closedById: currentUser.sub,
        expenses: {
          create: expenses.map((e) => ({
            name: e.name,
            amount: e.amount,
            category: e.category ?? null,
            date: dayStart,
          })),
        },
      },
      update: {
        cashSales,
        transferSales,
        totalExpenses,
        profit: netProfit,
        notes: notes ?? null,
        closedById: currentUser.sub,
        expenses: {
          deleteMany: {},
          create: expenses.map((e) => ({
            name: e.name,
            amount: e.amount,
            category: e.category ?? null,
            date: dayStart,
          })),
        },
      },
      include: { expenses: true },
    });

    await recordAudit({
      userId: currentUser.sub,
      action: 'DAILY_CLOSE',
      entityType: 'DailyClose',
      entityId: dailyClose.id,
      changes: { date, cashSales, transferSales, totalExpenses, netProfit },
    });

    return NextResponse.json({
      dailyClose: {
        ...dailyClose,
        cashSales: Number(dailyClose.cashSales),
        transferSales: Number(dailyClose.transferSales),
        totalExpenses: Number(dailyClose.totalExpenses),
        profit: Number(dailyClose.profit),
        expenses: dailyClose.expenses.map((e) => ({
          ...e,
          amount: Number(e.amount),
        })),
      },
    });
  } catch (err: unknown) {
    console.error('[POST /api/reports/daily-close]', err);
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

export const GET = requirePermission('settings', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'ต้องระบุวันที่' }, { status: 400 });
  }

  const dayStart = new Date(date + 'T00:00:00');
  const dayEnd = new Date(date + 'T23:59:59');

  // Get existing daily close if any
  const dailyClose = await prisma.dailyClose.findFirst({
    where: { date: dayStart },
    include: { expenses: true },
  });

  // Always return live sales summary
  const sales = await prisma.sale.findMany({
    where: { date: { gte: dayStart, lte: dayEnd }, voided: false },
    select: { paymentMethod: true, total: true, profit: true },
  });

  const cashSales = sales
    .filter((s) => s.paymentMethod === 'CASH')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const transferSales = sales
    .filter((s) => s.paymentMethod === 'TRANSFER')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const grossProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);
  const saleCount = sales.length;

  return NextResponse.json({
    summary: { cashSales, transferSales, grossProfit, saleCount },
    dailyClose: dailyClose
      ? {
          ...dailyClose,
          cashSales: Number(dailyClose.cashSales),
          transferSales: Number(dailyClose.transferSales),
          totalExpenses: Number(dailyClose.totalExpenses),
          profit: Number(dailyClose.profit),
          expenses: dailyClose.expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
        }
      : null,
  });
});

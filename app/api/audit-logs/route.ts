import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const GET = requirePermission('audit', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const action = searchParams.get('action') ?? '';
  const userId = searchParams.get('userId') ?? '';
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const where: Prisma.AuditLogWhereInput = {};

  if (q) {
    where.OR = [
      { action: { contains: q, mode: 'insensitive' } },
      { entityType: { contains: q, mode: 'insensitive' } },
      { entityId: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (userId) where.userId = userId;
  if (from || to) {
    where.timestamp = {};
    if (from) (where.timestamp as Prisma.DateTimeFilter).gte = new Date(from);
    if (to) (where.timestamp as Prisma.DateTimeFilter).lte = new Date(to + 'T23:59:59');
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, username: true } } },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
});

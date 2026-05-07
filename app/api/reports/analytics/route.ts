import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import {
  getRangeSummary,
  getTopProducts,
  getTopCategories,
} from '@/server/services/reportService';

export const GET = requirePermission('report', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  const from = fromStr ? new Date(fromStr) : undefined;
  // Set to end-of-day for the `to` date
  let to: Date | undefined;
  if (toStr) {
    to = new Date(toStr);
    to.setHours(23, 59, 59, 999);
  }

  try {
    const [summary, topProducts, topCategories] = await Promise.all([
      getRangeSummary(from, to),
      getTopProducts(from, to, 10),
      getTopCategories(from, to, 10),
    ]);

    return NextResponse.json({ summary, topProducts, topCategories });
  } catch (err: unknown) {
    console.error('[GET /api/reports/analytics]', err);
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

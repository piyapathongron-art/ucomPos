import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — no auth required.
// Vercel / uptime monitors can ping GET /api/health to verify DB connectivity.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      ts: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ status: 'error', db: 'disconnected', error: msg }, { status: 503 });
  }
}

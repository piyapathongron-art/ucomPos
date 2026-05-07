import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { listServices, createService } from '@/server/services/serviceService';
import { serviceSchema } from '@/lib/validators';
import type { ServiceType, ServiceStatus } from '@prisma/client';

export const GET = requirePermission('services', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as ServiceType | null;
  const status = searchParams.get('status') as ServiceStatus | null;

  const services = await listServices({
    type: type ?? undefined,
    status: status ?? undefined,
  });
  return NextResponse.json({ services });
});

export const POST = requirePermission('services', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const service = await createService({
      ...parsed.data,
      details: parsed.data.details as Record<string, unknown> | undefined,
      userId: user.sub,
    });

    await recordAudit({
      userId: user.sub,
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      entityId: service.id,
      changes: { type: service.type, name: service.name },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/services]', err);
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

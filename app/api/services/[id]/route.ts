import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { getService, updateService, deleteService } from '@/server/services/serviceService';
import { serviceUpdateSchema } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return requirePermission('services', async () => {
    const { id } = await params;
    const service = await getService(id);
    if (!service) {
      return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    }
    return NextResponse.json({ service });
  })(req);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return requirePermission('services', async (req, user) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = serviceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const service = await updateService(id, {
        ...parsed.data,
        details: parsed.data.details as Record<string, unknown> | undefined,
      });

      await recordAudit({
        userId: user.sub,
        action: 'UPDATE_SERVICE',
        entityType: 'Service',
        entityId: id,
        changes: parsed.data,
      });

      return NextResponse.json({ service });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return requirePermission('services', async (_req, user) => {
    const { id } = await params;
    try {
      const service = await getService(id);
      if (!service) {
        return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
      }

      await deleteService(id);

      await recordAudit({
        userId: user.sub,
        action: 'DELETE_SERVICE',
        entityType: 'Service',
        entityId: id,
        changes: { name: service.name, type: service.type },
      });

      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  })(req);
}

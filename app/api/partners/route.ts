import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/server/middleware/auth';
import { recordAudit } from '@/server/services/auditService';
import { listPartners, createPartner } from '@/server/services/partnerService';
import { partnerSchema } from '@/lib/validators';

export const GET = requirePermission('installments', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get('includeInactive') === '1';
  const partners = await listPartners(includeInactive);
  return NextResponse.json({ partners });
});

export const POST = requirePermission('installments', async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = partnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const partner = await createPartner(parsed.data);

    await recordAudit({
      userId: user.sub,
      action: 'CREATE_PARTNER',
      entityType: 'Partner',
      entityId: partner.id,
      changes: { name: partner.name },
    });

    return NextResponse.json({ partner }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/partners]', err);
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในระบบ';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

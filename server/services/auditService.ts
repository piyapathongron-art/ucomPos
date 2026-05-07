import { prisma } from '@/lib/prisma';

export interface AuditEvent {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAudit(event: AuditEvent) {
  return prisma.auditLog.create({
    data: {
      userId: event.userId,
      action: event.action,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      changes: (event.changes as any) ?? null,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent ?? null,
    },
  });
}

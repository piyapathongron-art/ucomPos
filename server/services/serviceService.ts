import { type ServiceType, type ServiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function listServices(opts: {
  type?: ServiceType;
  status?: ServiceStatus;
  limit?: number;
} = {}) {
  return prisma.service.findMany({
    where: {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: { date: 'desc' },
    take: opts.limit ?? 200,
  });
}

export async function getService(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function createService(data: {
  type: ServiceType;
  name: string;
  description?: string;
  cost: number;
  price: number;
  status?: ServiceStatus;
  details?: Record<string, unknown>;
  userId: string;
}) {
  return prisma.service.create({
    data: {
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      cost: data.cost,
      price: data.price,
      status: data.status ?? 'PENDING',
      details: data.details ? (data.details as Prisma.InputJsonObject) : undefined,
      userId: data.userId,
    },
  });
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    description?: string;
    cost?: number;
    price?: number;
    status?: ServiceStatus;
    details?: Record<string, unknown>;
  }
) {
  return prisma.service.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.cost !== undefined ? { cost: data.cost } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.details !== undefined ? { details: data.details as Prisma.InputJsonObject } : {}),
    },
  });
}

export async function deleteService(id: string) {
  return prisma.service.delete({ where: { id } });
}

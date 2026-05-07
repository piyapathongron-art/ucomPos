import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  name: true,
  role: true,
  permissions: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export async function listUsers(includeInactive = false) {
  return prisma.user.findMany({
    where: includeInactive ? {} : { isActive: true },
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
}

export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  email?: string;
  role?: 'ADMIN' | 'STAFF';
  permissions?: string[];
}) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      name: data.name,
      email: data.email ?? null,
      role: data.role ?? 'STAFF',
      permissions: data.permissions ?? [],
    },
    select: USER_SELECT,
  });
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string | null;
    role?: 'ADMIN' | 'STAFF';
    permissions?: string[];
    isActive?: boolean;
  }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
}

export async function changeUserPassword(id: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true },
  });
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true },
  });
}

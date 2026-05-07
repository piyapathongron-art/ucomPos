import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '@/lib/constants';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/features/layout/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (!payload) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      permissions: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect('/login');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

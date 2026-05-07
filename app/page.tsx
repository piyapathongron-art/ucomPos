import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '@/lib/constants';
import { verifyAccessToken } from '@/lib/auth';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (payload) {
    redirect('/pos');
  }

  redirect('/login');
}

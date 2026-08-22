import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';

import AuthenticatedShell from './AuthenticatedShell';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!userId || !accessToken) {
    redirect('/login');
  }

  const initialData = await getCurrentUser();

  return <AuthenticatedShell initialData={initialData}>{children}</AuthenticatedShell>;
}

import { cookies } from 'next/headers';

import { Dashboard } from '@/ts/interfaces/Dashboard';
import { User } from '@/ts/interfaces/User';

export type UserBootstrapData = {
  user: User;
  dashboard: Dashboard;
};

export async function getCurrentUser(): Promise<UserBootstrapData | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  const accessToken = cookieStore.get('accessToken')?.value;
  const apiUrl = process.env.API_URL;

  if (!userId || !accessToken || !apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/v1/users/${userId}/v2`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!res.ok) return null;

    const body = await res.json();
    if (!body?.data?.user) return null;

    return {
      user: body.data.user as User,
      dashboard: body.data.dashboard
    };
  } catch {
    return null;
  }
}

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveLocale } from '@/i18n/locale';
import { loadMessages } from '@/i18n/loadMessages';
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
  const acceptLanguage = headers().get('accept-language');
  const locale = resolveLocale(initialData?.user?.language, acceptLanguage);
  const messages = await loadMessages(locale);

  return (
    <AuthenticatedShell
      initialData={initialData}
      locale={locale}
      messages={messages}
      acceptLanguage={acceptLanguage}
    >
      {children}
    </AuthenticatedShell>
  );
}

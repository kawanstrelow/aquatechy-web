import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveLocale } from '@/i18n/locale';
import { loadMessages } from '@/i18n/loadMessages';
import { getCompanies, getCurrentUser } from '@/lib/getCurrentUser';

import AuthenticatedShell from './AuthenticatedShell';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!userId || !accessToken) {
    redirect('/login');
  }

  const [initialData, initialCompanies] = await Promise.all([getCurrentUser(), getCompanies()]);
  const acceptLanguage = headers().get('accept-language');
  const locale = resolveLocale(initialData?.user?.language, acceptLanguage);
  const messages = await loadMessages(locale);

  return (
    <AuthenticatedShell
      initialData={initialData}
      initialCompanies={initialCompanies}
      locale={locale}
      messages={messages}
      acceptLanguage={acceptLanguage}
    >
      {children}
    </AuthenticatedShell>
  );
}

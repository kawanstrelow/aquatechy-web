'use client';

import { useQueryClient } from '@tanstack/react-query';
import { setDefaultOptions } from 'date-fns';
import { enUS, es as esLocale, ptBR } from 'date-fns/locale';
import Cookies from 'js-cookie';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
import { I18nProvider } from 'react-aria';

import { ProductTour } from '@/components/product-tour/ProductTour';
import { VideoModal } from '@/components/VideoModal';
import useGetUser, { ensureClientUserLoad, hydrateUserBootstrap } from '@/hooks/react-query/user/getUser';
import type { UserQueryData } from '@/hooks/react-query/user/getUser';
import type { AppLocale } from '@/i18n/locale';
import { resolveLocale } from '@/i18n/locale';
import { loadMessages } from '@/i18n/loadMessages';
import { setActiveMessages } from '@/i18n/runtime';
import { UserBootstrapProvider, useUserStore } from '@/store/user';
import type { CompanyWithMyRole } from '@/ts/interfaces/Company';

import { HelpButton } from './HelpButton';
import PageHeader from './PageHeader';
import { SideMenu } from './SideMenuNav';

const dateLocales = {
  en: enUS,
  'pt-BR': ptBR,
  es: esLocale
} as const;

function applyLocale(locale: AppLocale, messages: AbstractIntlMessages) {
  setActiveMessages(messages);
  setDefaultOptions({ locale: dateLocales[locale] });
}

function needsOnboarding(user?: { id?: string; firstName?: string | null; lastName?: string | null }) {
  if (!user?.id) return false;
  return !user.firstName?.trim() && !user.lastName?.trim();
}

type Props = {
  children: React.ReactNode;
  initialData?: UserQueryData | null;
  initialCompanies?: CompanyWithMyRole[] | null;
  locale: AppLocale;
  messages: AbstractIntlMessages;
  acceptLanguage?: string | null;
};

function seedCompaniesCache(queryClient: ReturnType<typeof useQueryClient>, companies?: CompanyWithMyRole[] | null) {
  if (companies == null || queryClient.getQueryData(['companies']) != null) return;
  queryClient.setQueryData(['companies'], companies);
}

export default function AuthenticatedShell({
  children,
  initialData,
  initialCompanies,
  locale,
  messages,
  acceptLanguage
}: Props) {
  const queryClient = useQueryClient();
  seedCompaniesCache(queryClient, initialCompanies);
  const { data } = useGetUser();
  const user = data?.user ?? initialData?.user;
  const resolvedLocale = resolveLocale(user?.language, acceptLanguage);
  const [catalog, setCatalog] = useState({ locale, messages });

  applyLocale(catalog.locale, catalog.messages);

  useEffect(() => {
    if (resolvedLocale === catalog.locale) return;
    let cancelled = false;
    loadMessages(resolvedLocale).then((nextMessages) => {
      if (cancelled) return;
      setCatalog({ locale: resolvedLocale, messages: nextMessages });
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedLocale, catalog.locale]);

  useLayoutEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = catalog.locale;
    return () => {
      document.documentElement.lang = previous || 'en';
    };
  }, [catalog.locale]);

  useLayoutEffect(() => {
    return () => {
      setActiveMessages(null);
      setDefaultOptions({ locale: enUS });
    };
  }, []);

  return (
    <NextIntlClientProvider
      locale={catalog.locale}
      messages={catalog.messages}
      timeZone="UTC"
      onError={(error) => {
        if (error.code === 'MISSING_MESSAGE') return;
      }}
      getMessageFallback={({ namespace, key }) => (namespace ? `${namespace}.${key}` : key)}
    >
      <I18nProvider locale={catalog.locale}>
        <ShellFrame initialData={initialData}>{children}</ShellFrame>
      </I18nProvider>
    </NextIntlClientProvider>
  );
}

function usePublishUserBootstrap(initialData?: UserQueryData | null) {
  const [revision, setRevision] = useState(0);

  useLayoutEffect(() => {
    if (initialData) hydrateUserBootstrap(initialData);
    else ensureClientUserLoad();
    setRevision((value) => value + 1);
    return useUserStore.subscribe(() => {
      setRevision((value) => value + 1);
    });
  }, [initialData]);

  return revision;
}

function ShellFrame({ children, initialData }: { children: React.ReactNode; initialData?: UserQueryData | null }) {
  const revision = usePublishUserBootstrap(initialData);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [tourEnabled, setTourEnabled] = useState(false);
  const { data } = useGetUser();
  const user = data?.user ?? initialData?.user;
  const userId = user?.id;
  const profileIncomplete = needsOnboarding(user);
  const isRedirectingToOnboarding = profileIncomplete && pathname !== '/onboarding';
  const isUserLoading = (!data && !initialData) || isRedirectingToOnboarding;

  useLayoutEffect(() => {
    if (!Cookies.get('userId')) {
      router.replace('/login');
      return;
    }
    if (isRedirectingToOnboarding) {
      window.location.replace('/onboarding');
    }
  }, [isRedirectingToOnboarding, router]);

  useLayoutEffect(() => {
    if (isUserLoading || !userId) return;
    if (localStorage.getItem(`welcome-video-${userId}`)) {
      setTourEnabled(true);
      return;
    }
    setShowWelcomeVideo(true);
  }, [isUserLoading, userId]);

  const handleCloseWelcomeVideo = () => {
    if (userId) {
      localStorage.setItem(`welcome-video-${userId}`, 'true');
    }
    setShowWelcomeVideo(false);
    setTourEnabled(true);
  };

  return (
    <UserBootstrapProvider initialData={initialData} revision={revision}>
      <ProductTour enabled={tourEnabled && !showWelcomeVideo && pathname !== '/onboarding'} userId={userId} />
      {!isUserLoading && showWelcomeVideo && (
        <VideoModal
          isOpen={showWelcomeVideo}
          onClose={handleCloseWelcomeVideo}
          videoUrl="https://vimeo.com/1237020080?title=0&byline=0&portrait=0"
          title={t('welcomeTitle')}
        />
      )}
      <div className="min-h-screen bg-canvas lg:flex">
        <div className="sticky top-0 z-30 hidden h-screen shrink-0 lg:block">
          <SideMenu />
        </div>
        <div className="min-w-0 flex-1">
          <PageHeader />
          <main>
            <div className="px-4 py-5 lg:px-8 lg:py-6">
              {isUserLoading ? (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-8 border-line border-t-accent" />
                </div>
              ) : (
                children
              )}
            </div>
          </main>
          <HelpButton />
        </div>
      </div>
    </UserBootstrapProvider>
  );
}

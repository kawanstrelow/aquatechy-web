'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getPortalAccessToken, portalAxios, setPortalAccessToken } from '@/lib/portalAxios';
import {
  clientPortalHeaderBarClassName,
  clientPortalNavLinkClassName,
  clientPortalOutlineAccentButtonClassName,
  clientPortalPageBgClassName,
  clientPortalFocusSpinnerClassName
} from '@/constants/clientPortal';
import type { ClientPortalMeResponse } from '@/ts/interfaces/ClientPortal';

/** Paths that must work before JWT exists (exchange token vs request-link form). */
function isPortalEntryWithoutSession(pathname: string): boolean {
  return pathname === '/client-portal/request-link' || pathname === '/client-portal/auth';
}

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const portalEntryPublic = isPortalEntryWithoutSession(pathname);
  const [gateReady, setGateReady] = useState(portalEntryPublic);

  useEffect(() => {
    if (portalEntryPublic) {
      setGateReady(true);
      return;
    }

    const token = getPortalAccessToken();
    if (!token) {
      router.replace('/client-portal/request-link');
      return;
    }

    setGateReady(true);
  }, [pathname, router, portalEntryPublic]);

  const handleLogout = () => {
    setPortalAccessToken(null);
    router.push('/client-portal/request-link');
  };

  if (portalEntryPublic) {
    return (
      <div className={`flex min-h-screen flex-col ${clientPortalPageBgClassName}`}>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6">
        <div className="flex justify-center">
          <Link href="/" className="inline-block outline-offset-4 rounded-md" aria-label="Aquatechy home">
            <Image
              priority
              width={0}
              height={0}
              sizes="100vw"
              className="h-auto w-52 max-w-[min(13rem,85vw)]"
              src="/images/logoHor.png"
              alt="Aquatechy"
            />
          </Link>
        </div>
        {children}
        </div>
      </div>
    );
  }

  if (!gateReady) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${clientPortalPageBgClassName}`}
      >
        <Loader2 className={`h-10 w-10 animate-spin ${clientPortalFocusSpinnerClassName}`} aria-hidden />
      </div>
    );
  }

  return (
    <ClientPortalAuthedChrome onLogout={handleLogout}>{children}</ClientPortalAuthedChrome>
  );
}

function ClientPortalAuthedChrome({
  children,
  onLogout
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const meQuery = useQuery({
    queryKey: ['client-portal-me'],
    queryFn: async () => {
      const { data } = await portalAxios.get<ClientPortalMeResponse>('/client-portal/me');
      return data;
    },
    staleTime: 60 * 1000
  });

  const company = meQuery.data?.company;
  const logoUrl = company?.imageUrl?.trim();
  const logoAlt = company?.name ? `${company.name} logo` : 'Company logo';

  return (
    <div className={`flex min-h-screen flex-col ${clientPortalPageBgClassName}`}>
      <header className={clientPortalHeaderBarClassName}>
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
            {logoUrl ? (
              <Link
                href="/client-portal"
                className="order-first shrink-0 self-center"
                aria-label={company?.name ? `Home — ${company.name}` : 'Client portal home'}
              >
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  className="max-h-9 w-auto max-w-[min(9rem,28vw)] object-contain object-left"
                />
              </Link>
            ) : null}
            <nav className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium ${clientPortalNavLinkClassName}`}>
              <Link href="/client-portal">Overview</Link>
              <Link href="/client-portal/invoices">Invoices</Link>
              <Link href="/client-portal/estimates">Estimates</Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={clientPortalOutlineAccentButtonClassName}
              onClick={onLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

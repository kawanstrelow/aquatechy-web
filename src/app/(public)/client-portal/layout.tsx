'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getPortalAccessToken, setPortalAccessToken } from '@/lib/portalAxios';

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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Aquatechy
        </Link>
        {children}
      </div>
    );
  }

  if (!gateReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
            <Link href="/client-portal" className="hover:text-slate-900">
              Overview
            </Link>
            <Link href="/client-portal/invoices" className="hover:text-slate-900">
              Invoices
            </Link>
            <Link href="/client-portal/payment-method" className="hover:text-slate-900">
              Payment method
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

import { setPortalAccessToken } from '@/lib/portalAxios';
import type { ClientPortalExchangeTokenResponse } from '@/ts/interfaces/StripeConnect';
import { Button } from '@/components/ui/button';

function apiOrigin(): string {
  const raw = typeof window !== 'undefined' ? process.env.API_URL ?? '' : process.env.API_URL ?? '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function ClientPortalAuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setMessage('This link is missing a token. Request a new link from your pool company.');
      return;
    }

    let cancelled = false;

    async function exchange() {
      try {
        const base = apiOrigin();
        const { data } = await axios.post<ClientPortalExchangeTokenResponse>(
          `${base}/api/v1/client-portal/exchange-token`,
          { token },
          { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 }
        );
        if (cancelled) return;
        setPortalAccessToken(data.accessToken);
        router.replace('/client-portal');
      } catch {
        if (cancelled) return;
        setMessage('This link is invalid or has expired. Please request a new one.');
      }
    }

    void exchange();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      {!message ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-slate-600" aria-hidden />
          <p className="text-center text-sm text-slate-600">Signing you in...</p>
        </>
      ) : (
        <>
          <p className="max-w-md text-center text-sm text-slate-700">{message}</p>
          <Button asChild variant="outline">
            <Link href="/client-portal/request-link">Email me a new link</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default function ClientPortalAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-slate-600">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
      </div>
    }>
      <ClientPortalAuthInner />
    </Suspense>
  );
}

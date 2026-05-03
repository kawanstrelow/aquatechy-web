'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

function InvoiceCheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') ?? searchParams.get('checkout_session_id');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Payment received</h1>
      <p className="max-w-lg text-sm text-slate-600">
        Thank you for your payment. Your invoice status will update automatically when Stripe confirms the charge.
      </p>
      {sessionId ? (
        <p className="font-mono text-xs text-slate-500">
          Checkout session ID: <span className="break-all">{sessionId}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="default">
          <Link href="/client-portal">Back to invoices</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Staff login</Link>
        </Button>
      </div>
    </div>
  );
}

export default function InvoiceCheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6 text-slate-600">Loading…</div>
      }
    >
      <InvoiceCheckoutSuccessInner />
    </Suspense>
  );
}

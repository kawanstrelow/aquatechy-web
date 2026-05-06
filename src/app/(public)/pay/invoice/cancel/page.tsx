'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

function InvoiceCheckoutCancelInner() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Checkout canceled</h1>
      <p className="max-w-lg text-sm text-slate-600">
        No charge was completed. You can try again anytime from your invoice email or portal.
      </p>
      {invoiceId ? (
        <Button asChild variant="default">
          <Link href={`/client-portal/invoices/${invoiceId}`}>Return to invoice</Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href="/client-portal">Client portal home</Link>
        </Button>
      )}
      <Button asChild variant="ghost">
        <Link href="/login">Staff login</Link>
      </Button>
    </div>
  );
}

export default function InvoiceCheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6 text-slate-600">Loading…</div>
      }
    >
      <InvoiceCheckoutCancelInner />
    </Suspense>
  );
}

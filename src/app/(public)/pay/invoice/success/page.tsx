'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

const invoicePayGradient =
  'bg-[linear-gradient(135deg,#1c57d5_0%,#102d7c_100%)]';

function InvoiceCheckoutSuccessInner() {
  const searchParams = useSearchParams();
  // Stripe Checkout success URL includes {CHECKOUT_SESSION_ID}; webhook finalizes the invoice.
  const sessionId = searchParams.get('session_id') ?? searchParams.get('checkout_session_id');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1
        className={`${invoicePayGradient} bg-clip-text text-2xl font-semibold text-transparent`}
      >
        Payment received
      </h1>
      <p className="mb-4 max-w-lg text-sm text-slate-600">
        Thank you for your payment. Your invoice status will update automatically when Stripe confirms the charge.
      </p>
      {sessionId ? (
        <p className="max-w-lg break-all text-xs text-slate-400">Reference: {sessionId}</p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          asChild
          variant="default"
          className={`border-0 ${invoicePayGradient} text-white shadow hover:brightness-110 hover:text-white focus-visible:ring-[#1c57d5]`}
        >
          <Link href="/client-portal">Back to invoices</Link>
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

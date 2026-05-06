'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const QUERY_KEY = 'payment-method-setup';

function PaymentMethodSetupFeedbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get(QUERY_KEY);

  if (status !== 'success' && status !== 'cancel') {
    return null;
  }

  const dismiss = () => {
    router.replace('/invoices');
  };

  const isSuccess = status === 'success';

  return (
    <Alert
      className={cn(
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950 [&>svg]:text-emerald-600'
          : 'border-amber-200 bg-amber-50 text-amber-950 [&>svg]:text-amber-700'
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : (
        <XCircle className="h-4 w-4" aria-hidden />
      )}
      <AlertTitle>{isSuccess ? 'Payment method saved' : 'Payment method setup cancelled'}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {isSuccess
            ? 'The card can now be used for this client when charging invoices.'
            : 'No changes were made. You can try adding a payment method again when you are ready.'}
        </span>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={dismiss}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function PaymentMethodSetupFeedback() {
  return (
    <Suspense fallback={null}>
      <PaymentMethodSetupFeedbackInner />
    </Suspense>
  );
}

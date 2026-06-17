'use client';

import { format } from 'date-fns';
import { CreditCard, ExternalLink, FileText, Loader2, ShieldAlert } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import useCancelWithRefund from '@/hooks/react-query/subscriptions/useCancelWithRefund';
import useCreatePortalSession from '@/hooks/react-query/subscriptions/useCreatePortalSession';
import { SubscriptionStatusResponse } from '@/ts/interfaces/Subscription';

import { formatCardBrand, formatMoney } from './subscriptionUtils';

type Props = {
  status: SubscriptionStatusResponse;
};

export function SubscriptionManagement({ status }: Props) {
  const { mutate: openPortal, isPending: isPortalPending, variables: portalFlow } = useCreatePortalSession();
  const { mutate: requestRefund, isPending: isRefundPending } = useCancelWithRefund();

  const stripe = status.stripe;
  const actions = status.availableActions;

  const isPortalLoading = (flow?: string) => isPortalPending && portalFlow === flow;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#DCE1F5] text-[#364D9D]">
              <CreditCard className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Payment method</h3>
              <p className="text-xs text-slate-500">Card on file for renewals</p>
            </div>
          </div>

          {status.paymentMethod ? (
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-900">
                {formatCardBrand(status.paymentMethod.brand)} •••• {status.paymentMethod.last4}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                Expires {String(status.paymentMethod.expMonth).padStart(2, '0')}/{status.paymentMethod.expYear}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No payment method on file.</p>
          )}

          {actions.canOpenPortal && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isPortalPending}
              onClick={() => openPortal('payment_method_update')}
            >
              {isPortalLoading('payment_method_update') ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Update card
            </Button>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#DCE1F5] text-[#364D9D]">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Billing history</h3>
              <p className="text-xs text-slate-500">Invoices and receipts</p>
            </div>
          </div>

          {status.latestInvoice ? (
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-900">
                {formatMoney(status.latestInvoice.amountPaid, stripe?.currency ?? 'usd')}
              </p>
              <p className="mt-0.5 text-sm capitalize text-slate-500">{status.latestInvoice.status}</p>
              {status.latestInvoice.hostedInvoiceUrl && (
                <a
                  href={status.latestInvoice.hostedInvoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#364D9D] hover:underline"
                >
                  Open latest invoice
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No invoices yet.</p>
          )}

          {actions.canOpenPortal && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isPortalPending}
              onClick={() => openPortal('default')}
            >
              {isPortalLoading('default') ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              View all invoices
            </Button>
          )}
        </section>
      </div>

      {(actions.canCancelAtPeriodEnd || actions.canRequestRefundCancel) && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Manage subscription</h3>
              <p className="text-xs text-slate-500">Cancellation options</p>
            </div>
          </div>

          <div className="space-y-4">
            {actions.canCancelAtPeriodEnd && (
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Cancel at end of billing period</p>
                <p className="mt-1 text-sm text-slate-600">
                  Keep Grow until{' '}
                  {stripe?.currentPeriodEnd
                    ? format(new Date(stripe.currentPeriodEnd), 'MMMM d, yyyy')
                    : 'your renewal date'}
                  . No refund for the current period.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={isPortalPending}
                  onClick={() => openPortal('subscription_cancel')}
                >
                  {isPortalLoading('subscription_cancel') ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Schedule cancellation
                </Button>
              </div>
            )}

            {actions.canCancelAtPeriodEnd && actions.canRequestRefundCancel && <Separator />}

            {actions.canRequestRefundCancel && (
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                <p className="font-medium text-slate-900">Cancel now & request refund</p>
                <p className="mt-1 text-sm text-slate-600">
                  End access immediately. We calculate unused time and process a refund to your card after review.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-3" disabled={isRefundPending}>
                      {isRefundPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Submit refund request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Request immediate cancellation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your Grow access will end as soon as the request is processed. We will calculate unused time and
                        process a refund to your card after review. Contact support if you need help.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                      <AlertDialogAction onClick={() => requestRefund()}>Submit refund request</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

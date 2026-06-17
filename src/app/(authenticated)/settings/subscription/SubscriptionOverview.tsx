'use client';

import { format } from 'date-fns';
import { CalendarDays, CreditCard, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubscriptionStatusResponse } from '@/ts/interfaces/Subscription';
import { UserSubscription } from '@/ts/enums/enums';

import { formatMoney, getPlanLabel, getStatusBadge } from './subscriptionUtils';

type Props = {
  status: SubscriptionStatusResponse;
  onUpdateCard?: () => void;
  onViewInvoices?: () => void;
  isPortalPending?: boolean;
};

export function SubscriptionOverview({ status, onUpdateCard, onViewInvoices, isPortalPending }: Props) {
  const badge = getStatusBadge(status);
  const stripe = status.stripe;
  const isGrow = status.plan === UserSubscription.GROW;
  const renewalDate = stripe?.currentPeriodEnd ? format(new Date(stripe.currentPeriodEnd), 'MMM d, yyyy') : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#DCE1F5] bg-gradient-to-br from-[#364D9D] via-[#3d56a8] to-[#647AC7] p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={badge.variant} className="border-white/20 bg-white/15 text-white hover:bg-white/15">
              {badge.label}
            </Badge>
            {!isGrow && (
              <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                <Sparkles className="size-4" />
                Upgrade to unlock advanced features
              </span>
            )}
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-white/70">Current plan</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{getPlanLabel(status.plan)}</h2>
            {stripe ? (
              <p className="mt-2 text-lg text-white/90">
                {formatMoney(stripe.amount, stripe.currency)}
                <span className="text-white/70"> / {stripe.interval}</span>
              </p>
            ) : (
              <p className="mt-2 text-white/80">Free forever — no credit card required</p>
            )}
          </div>

          {stripe?.cancelAtPeriodEnd && renewalDate && (
            <p className="max-w-xl rounded-lg border border-amber-300/30 bg-amber-400/15 px-4 py-2.5 text-sm text-amber-50">
              Scheduled to cancel on {renewalDate}. You keep full Grow access until then.
            </p>
          )}

          {!stripe?.cancelAtPeriodEnd && renewalDate && (
            <p className="inline-flex items-center gap-2 text-sm text-white/80">
              <CalendarDays className="size-4" />
              Renews on {renewalDate}
            </p>
          )}
        </div>

        {status.availableActions.canOpenPortal && onUpdateCard && onViewInvoices && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button
              variant="secondary"
              className="border-0 bg-white/95 text-[#364D9D] hover:bg-white"
              disabled={isPortalPending}
              onClick={onUpdateCard}
            >
              <CreditCard className="mr-2 size-4" />
              Update card
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              disabled={isPortalPending}
              onClick={onViewInvoices}
            >
              View invoices
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

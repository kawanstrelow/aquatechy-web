import { translateMessage } from '@/i18n/runtime';
import { SubscriptionStatusResponse, SubscriptionStripeDetails } from '@/ts/interfaces/Subscription';
import { UserSubscription } from '@/ts/enums/enums';

function cadenceUnit(interval: string, plural: boolean) {
  const key = plural ? `${interval}s` : interval;
  const fallback = plural ? `${interval}s` : interval;
  return translateMessage(`settings.subscription.cadence.${key}`, fallback);
}

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

export function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function isPaidSubscription(plan: string | null | undefined) {
  return plan === UserSubscription.ROUTE || plan === UserSubscription.GROW || plan === UserSubscription.PRO;
}

export function getPlanLabel(plan: UserSubscription) {
  if (plan === UserSubscription.GROW) return translateMessage('settings.subscription.planNames.grow', 'Grow');
  if (plan === UserSubscription.PRO) return translateMessage('settings.subscription.planNames.pro', 'Pro');
  if (plan === UserSubscription.ROUTE) return translateMessage('settings.subscription.planNames.route', 'Route');
  return translateMessage('settings.subscription.planNames.starter', 'Starter');
}

export function formatBillingCadence(interval: SubscriptionStripeDetails['interval'], intervalCount: number) {
  if (interval === 'month' && intervalCount === 1)
    return translateMessage('settings.subscription.cadence.month', 'month');
  if (interval === 'month' && intervalCount === 3)
    return translateMessage('settings.subscription.cadence.quarter', 'quarter');
  if (interval === 'year' && intervalCount === 1) return translateMessage('settings.subscription.cadence.year', 'year');

  const unit = cadenceUnit(interval, intervalCount !== 1);
  if (intervalCount === 1) return unit;
  return translateMessage('settings.subscription.cadence.every', 'every {count} {unit}')
    .replace('{count}', String(intervalCount))
    .replace('{unit}', unit);
}

export function getStatusBadge(status: SubscriptionStatusResponse) {
  const stripe = status.stripe;

  if (!status.hasStripeSubscription || !stripe) {
    return {
      label: translateMessage('settings.subscription.planNames.starter', 'Starter'),
      variant: 'secondary' as const
    };
  }

  if (stripe.status === 'past_due') {
    return {
      label: translateMessage('settings.subscription.status.pastDue', 'Past due'),
      variant: 'destructive' as const
    };
  }

  if (status.isPendingCancellation) {
    return {
      label: translateMessage('settings.subscription.status.canceling', 'Canceling'),
      variant: 'outline' as const
    };
  }

  if (stripe.status === 'active' || stripe.status === 'trialing') {
    return { label: translateMessage('settings.subscription.status.active', 'Active'), variant: 'default' as const };
  }

  return {
    label: translateMessage(`settings.subscription.status.${stripe.status}`, stripe.status.replace(/_/g, ' ')),
    variant: 'secondary' as const
  };
}

export function hasBillingManagement(status: SubscriptionStatusResponse, userPlan?: string | null) {
  return (
    Boolean(status.hasStripeSubscription) ||
    Boolean(status.stripe) ||
    isPaidSubscription(status.plan) ||
    isPaidSubscription(userPlan)
  );
}

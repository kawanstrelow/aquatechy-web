import { SubscriptionStatusResponse } from '@/ts/interfaces/Subscription';
import { UserSubscription } from '@/ts/enums/enums';

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

export function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function getPlanLabel(plan: UserSubscription) {
  if (plan === UserSubscription.GROW) return 'Grow';
  return 'Starter';
}

export function getStatusBadge(status: SubscriptionStatusResponse) {
  const stripe = status.stripe;

  if (!status.hasStripeSubscription || !stripe) {
    return { label: 'Free', variant: 'secondary' as const };
  }

  if (stripe.status === 'past_due') {
    return { label: 'Past due', variant: 'destructive' as const };
  }

  if (stripe.cancelAtPeriodEnd) {
    return { label: 'Canceling', variant: 'outline' as const };
  }

  if (stripe.status === 'active' || stripe.status === 'trialing') {
    return { label: 'Active', variant: 'default' as const };
  }

  return { label: stripe.status.replace(/_/g, ' '), variant: 'secondary' as const };
}

export function hasBillingManagement(status: SubscriptionStatusResponse) {
  return status.hasStripeSubscription || status.plan === UserSubscription.GROW;
}

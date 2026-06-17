import { UserSubscription } from '@/ts/enums/enums';

export type SubscriptionStripeStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export type PortalSessionFlow =
  | 'default'
  | 'payment_method_update'
  | 'subscription_cancel'
  | 'subscription_update';

export type SubscriptionStripeDetails = {
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStripeStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceId: string;
  priceLabel: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
};

export type SubscriptionPaymentMethod = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type SubscriptionLatestInvoice = {
  id: string;
  status: string;
  amountPaid: number;
  hostedInvoiceUrl: string | null;
};

export type SubscriptionAvailableActions = {
  canSubscribe: boolean;
  canOpenPortal: boolean;
  canCancelAtPeriodEnd: boolean;
  canRequestRefundCancel: boolean;
};

export type SubscriptionStatusResponse = {
  plan: UserSubscription;
  hasStripeSubscription: boolean;
  stripe: SubscriptionStripeDetails | null;
  paymentMethod: SubscriptionPaymentMethod | null;
  latestInvoice: SubscriptionLatestInvoice | null;
  availableActions: SubscriptionAvailableActions;
};

export type PortalSessionResponse = {
  url: string;
};

export type CancelWithRefundResponse = {
  status: 'pending_review';
  estimatedRefundCents: number;
  currency: string;
  message: string;
};

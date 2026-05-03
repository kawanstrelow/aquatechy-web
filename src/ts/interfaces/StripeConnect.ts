export type StripeAccountStatus = 'not_started' | 'onboarding' | 'restricted' | 'active' | 'rejected';

export interface ConnectRequirements {
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
}

export interface ConnectStatusResponse {
  stripeAccountId: string | null;
  stripeAccountStatus: StripeAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: ConnectRequirements | null;
}

export interface ConnectOnboardResponse {
  url: string;
  stripeAccountId: string;
}

export interface ConnectDashboardLinkResponse {
  url: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId?: string;
}

export interface ClientSetupCheckoutResponse {
  url: string;
}

export type ChargeCardOnFileResponse =
  | { status: 'succeeded'; paymentIntentId: string }
  | { status: 'requires_action'; message: string; checkoutRecoveryNeeded: boolean };

export interface ClientPortalExchangeTokenResponse {
  accessToken: string;
  expiresIn: string;
}

import { UserSubscription } from '@/ts/enums/enums';

export type Plan = {
  id: 'starter' | 'route' | 'grow' | 'enterprise';
  title: string;
  subtitle: string;
  priceLabel: string;
  perMonth: boolean;
  poolLines: string[];
  features: string[];
  buttonLabel: string;
  subscriptionPlan?: UserSubscription;
  highlighted?: boolean;
};

import { UserSubscription } from '@/ts/enums/enums';
import { Plan } from '@/ts/interfaces/Pricing';

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    title: 'Starter',
    name: UserSubscription.FREE,
    price: 0,
    features: [
      { text: 'Up to 30 pools', include: true },
      { text: 'Full mobile app access', include: true },
      { text: 'Route optimization', include: true },
      { text: 'Basic reports & support', include: true },
      { text: 'Service email reports (not customizable)', include: true },
      { text: 'SMS link after service', include: false }
    ]
  },
  {
    title: 'Grow',
    name: UserSubscription.GROW,
    price: 69,
    features: [
      { text: 'Up to 300 pools', include: true },
      { text: 'Full mobile app access', include: true },
      { text: 'Route optimization', include: true },
      { text: 'Advanced reports & priority support', include: true },
      { text: 'Customizable service email reports', include: true },
      { text: 'SMS link after service', include: true }
    ],
    extra: 'Extra pools: $0.23 each beyond 300'
  }
];

export const FEATURE_COMPARISON = [
  { feature: 'Pool limit', starter: '30 pools', grow: '300 pools (+ $0.23 each extra)' },
  { feature: 'Support', starter: 'Basic', grow: 'Priority' },
  { feature: 'Route optimization', starter: true, grow: true },
  { feature: 'Mobile app', starter: true, grow: true },
  { feature: 'Service email reports', starter: 'Included (not customizable)', grow: 'Included (customizable)' },
  { feature: 'SMS link after service', starter: false, grow: true }
] as const;

export const SUBSCRIPTION_FAQ = [
  {
    question: 'What happens if I exceed my pool limit?',
    answer:
      'On Grow, additional pools beyond 300 cost $0.23 each per month. You can scale as your route book grows without switching plans.'
  },
  {
    question: 'Can I change plans later?',
    answer:
      'Upgrade anytime from this page. To leave Grow, cancel at period end to keep access until your billing cycle ends, or request immediate cancellation with a refund for unused time.'
  },
  {
    question: 'How do I update my payment method?',
    answer:
      'Open the Billing tab and click Update card. You will be redirected to Stripe’s secure billing portal to manage your card on file.'
  },
  {
    question: 'Where can I view past invoices?',
    answer:
      'Use View all invoices in the Billing tab to open Stripe’s billing portal, where you can download PDFs and review payment history.'
  }
] as const;

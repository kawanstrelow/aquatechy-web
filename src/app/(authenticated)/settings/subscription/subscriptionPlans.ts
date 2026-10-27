import { UserSubscription } from '@/ts/enums/enums';
import { Plan } from '@/ts/interfaces/Pricing';

export const SALES_CALENDLY_URL = 'https://calendly.com/aquatechy/onboarding';

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'starter',
    title: 'Starter',
    subtitle: "Run this week's route.",
    priceLabel: '$0',
    perMonth: false,
    poolLines: ['20 active pools'],
    features: [
      'Schedule and mobile app',
      'Readings, photos, and checklists',
      'Service email to the customer',
      'Import your Skimmer or spreadsheet book'
    ],
    buttonLabel: 'Start free',
    subscriptionPlan: UserSubscription.FREE
  },
  {
    id: 'route',
    title: 'Route',
    subtitle: 'Optimize the route and get paid.',
    priceLabel: '$39',
    perMonth: true,
    poolLines: ['75 active pools'],
    features: [
      'Route optimization',
      'Card and ACH payments in the client portal',
      'Estimates, recurring invoices, and work orders',
      'Custom service emails and 150 texts a month'
    ],
    buttonLabel: 'Start Route',
    subscriptionPlan: UserSubscription.ROUTE,
    highlighted: true
  },
  {
    id: 'grow',
    title: 'Grow',
    subtitle: 'For a crew and an office.',
    priceLabel: '$89',
    perMonth: true,
    poolLines: ['200 active pools, then $0.45'],
    features: [
      'Everything in Route',
      'AI answers on your company data',
      'Chemical, team, and filter reports',
      '1,000 texts a month and priority email'
    ],
    buttonLabel: 'Choose Grow',
    subscriptionPlan: UserSubscription.GROW
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    subtitle: 'For a larger book.',
    priceLabel: 'Custom',
    perMonth: false,
    poolLines: ['The sales team will price your book.', 'Priced with the sales team'],
    features: [
      'Everything in Grow',
      'A price set for your book',
      'Past the $0.45 per-pool rate',
      'The sales team sets it up with you'
    ],
    buttonLabel: 'Talk to sales'
  }
];

export const FEATURE_COMPARISON = [
  { feature: 'Monthly price', starter: '$0', route: '$39', grow: '$89', enterprise: 'Custom' },
  { feature: 'Active pools', starter: '20', route: '75', grow: '200, then $0.45', enterprise: 'Custom' },
  { feature: 'Schedule and mobile app', starter: true, route: true, grow: true, enterprise: true },
  { feature: 'Readings, photos, and checklists', starter: true, route: true, grow: true, enterprise: true },
  { feature: 'Service email', starter: 'Included', route: 'Custom', grow: 'Custom', enterprise: 'Custom' },
  { feature: 'Import your book', starter: true, route: true, grow: true, enterprise: true },
  { feature: 'Route optimization', starter: false, route: true, grow: true, enterprise: true },
  { feature: 'Card and ACH payments', starter: false, route: true, grow: true, enterprise: true },
  {
    feature: 'Estimates, recurring invoices, and work orders',
    starter: false,
    route: true,
    grow: true,
    enterprise: true
  },
  { feature: 'Texts a month', starter: false, route: '150', grow: '1,000', enterprise: 'Custom' },
  { feature: 'AI answers on your company data', starter: false, route: false, grow: true, enterprise: true },
  { feature: 'Chemical, team, and filter reports', starter: false, route: false, grow: true, enterprise: true }
] as const;

export const SUBSCRIPTION_FAQ = [
  {
    question: 'What happens if I go past my pool limit?',
    answer:
      'Starter includes 20 active pools, and the app stops you from adding more. Route is $39 a month for 75 active pools. The app stops new pools at 75, and Stripe does not cancel the subscription at 75. Grow is $89 a month for the first 200 active pools, then $0.45 for each pool after that.'
  },
  {
    question: 'Can I change plans later?',
    answer:
      'You can move up to Route or Grow from this page. To leave a paid plan, cancel at period end and keep access until the billing cycle ends, or request immediate cancellation with a refund for unused time.'
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
  },
  {
    question: 'How does Enterprise work?',
    answer:
      'Enterprise is priced for a larger book. Talk to sales and the team sets it up with you. It includes everything in Grow, past the $0.45 per-pool rate.'
  }
] as const;

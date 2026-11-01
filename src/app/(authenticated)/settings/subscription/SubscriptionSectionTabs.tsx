'use client';

import { CreditCard, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const triggerClassName = cn(
  'h-11 gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors',
  'hover:text-slate-900',
  'focus-visible:ring-[#364D9D]',
  'data-[state=active]:!bg-[#364D9D] data-[state=active]:!text-white data-[state=active]:!shadow-sm',
  'data-[state=active]:hover:!text-white'
);

export function SubscriptionSectionTabs() {
  const t = useTranslations('settings');

  return (
    <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-[#DCE1F5] bg-[#F3F5FB] p-1.5 shadow-sm">
      <TabsTrigger value="billing" className={triggerClassName}>
        <CreditCard className="size-4 shrink-0" />
        {t('subscription.billing')}
      </TabsTrigger>
      <TabsTrigger value="plans" className={triggerClassName}>
        <LayoutGrid className="size-4 shrink-0" />
        {t('subscription.plansAndPricing')}
      </TabsTrigger>
    </TabsList>
  );
}

'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { UserSubscription } from '@/ts/enums/enums';
import { planDisplayName } from '@/utils/planAccess';

type Props = {
  reason: 'feature' | 'pools';
  requiredPlan?: UserSubscription;
};

export function PlanUpgradePrompt({ reason, requiredPlan }: Props) {
  const planName = requiredPlan ? planDisplayName(requiredPlan) : 'a higher plan';
  const title = reason === 'pools' ? 'Pool limit reached' : `${planName} plan`;
  const description =
    reason === 'pools'
      ? 'You have reached the pool limit on your plan. Upgrade to add more pools.'
      : `This is included on the ${planName} plan.`;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <Button asChild className="bg-[#364D9D] hover:bg-[#2d4082]">
        <Link href="/settings/subscription">View plans</Link>
      </Button>
    </div>
  );
}

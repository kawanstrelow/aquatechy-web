'use client';

import { Check, X } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChangeSubscription } from '@/hooks/react-query/user/changeSubscription';
import { cn } from '@/lib/utils';
import { UserSubscription } from '@/ts/enums/enums';
import { Plan } from '@/ts/interfaces/Pricing';

type Props = {
  plan: Plan;
  currentUserPlan: UserSubscription;
  canSubscribe?: boolean;
  highlighted?: boolean;
};

export function SubscriptionCard({ plan, currentUserPlan, canSubscribe = true, highlighted = false }: Props) {
  const { title, price, features, extra } = plan;
  const isCurrentPlan = plan.name === currentUserPlan;
  const isGrowSubscribe = plan.name === UserSubscription.GROW && !isCurrentPlan;
  const isFreeDowngrade = plan.name === UserSubscription.FREE && currentUserPlan === UserSubscription.GROW;
  const subscribeDisabled = isCurrentPlan || isFreeDowngrade || (isGrowSubscribe && !canSubscribe);

  const { mutate, isPending } = useChangeSubscription(plan.name);

  const buttonLabel = isCurrentPlan
    ? 'Current plan'
    : plan.name !== UserSubscription.GROW
      ? 'Contact support to downgrade'
      : 'Upgrade to Grow';

  return (
    <>
      {isPending && <LoadingSpinner />}
      <article
        className={cn(
          'relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
          isCurrentPlan && 'border-[#364D9D] ring-2 ring-[#364D9D]/20',
          highlighted && !isCurrentPlan && 'border-[#647AC7]',
          !isCurrentPlan && !highlighted && 'border-slate-200'
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {plan.name === UserSubscription.FREE ? 'For getting started' : 'For growing pool routes'}
            </p>
          </div>
          {isCurrentPlan && (
            <Badge className="shrink-0 bg-[#364D9D] hover:bg-[#364D9D]">Current</Badge>
          )}
          {highlighted && !isCurrentPlan && (
            <Badge variant="secondary" className="shrink-0 bg-[#DCE1F5] text-[#364D9D] hover:bg-[#DCE1F5]">
              Popular
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">${price}</span>
            <span className="text-slate-500">/month</span>
          </div>
          {extra && <p className="mt-2 text-xs text-slate-500">{extra}</p>}
        </div>

        <Button
          onClick={() => mutate()}
          disabled={subscribeDisabled}
          className={cn(
            'mb-6 w-full',
            highlighted && !isCurrentPlan && 'bg-[#364D9D] hover:bg-[#2d4082]'
          )}
          variant={highlighted && !isCurrentPlan ? 'default' : isCurrentPlan ? 'secondary' : 'outline'}
        >
          {buttonLabel}
        </Button>

        <ul className="flex-1 space-y-3">
          {features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                  feature.include ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                )}
              >
                {feature.include ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={2.5} />}
              </span>
              <span className={cn(feature.include ? 'text-slate-700' : 'text-slate-400')}>{feature.text}</span>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}

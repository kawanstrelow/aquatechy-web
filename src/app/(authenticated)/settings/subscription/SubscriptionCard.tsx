'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChangeSubscription } from '@/hooks/react-query/user/changeSubscription';
import { cn } from '@/lib/utils';
import { UserSubscription } from '@/ts/enums/enums';
import { Plan } from '@/ts/interfaces/Pricing';
import { isPlanUpgrade } from '@/utils/planAccess';

import { SALES_CALENDLY_URL } from './subscriptionPlans';

type Props = {
  plan: Plan;
  currentUserPlan: UserSubscription;
};

function CheckoutButton({
  subscriptionPlan,
  label,
  highlighted
}: {
  subscriptionPlan: UserSubscription;
  label: string;
  highlighted: boolean;
}) {
  const { mutate, isPending } = useChangeSubscription(subscriptionPlan);

  return (
    <>
      {isPending && <LoadingSpinner />}
      <Button
        onClick={() => mutate()}
        className={cn('w-full', highlighted && 'bg-[#364D9D] hover:bg-[#2d4082]')}
        variant={highlighted ? 'default' : 'outline'}
      >
        {label}
      </Button>
    </>
  );
}

export function SubscriptionCard({ plan, currentUserPlan }: Props) {
  const t = useTranslations('settings');
  const highlighted = Boolean(plan.highlighted);
  const isCurrentPlan = plan.subscriptionPlan === currentUserPlan;
  const isUpgrade =
    Boolean(plan.subscriptionPlan) &&
    plan.subscriptionPlan !== UserSubscription.FREE &&
    isPlanUpgrade(currentUserPlan, plan.subscriptionPlan as UserSubscription);
  const isSales = plan.id === 'enterprise';

  const buttonLabel = isCurrentPlan
    ? t('subscription.currentPlan')
    : isUpgrade || isSales
      ? t(`subscription.plans.${plan.id}.buttonLabel`)
      : t('subscription.manageInBilling');

  return (
    <div className="pt-3">
      <article
        className={cn(
          'relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm',
          highlighted ? 'border-2 border-[#364D9D]' : 'border-slate-200',
          isCurrentPlan && !highlighted && 'ring-2 ring-[#364D9D]/20'
        )}
      >
        {highlighted && (
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#364D9D] px-3 py-1 text-xs font-medium text-white">
            {t('subscription.mostCompanies')}
          </span>
        )}

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{t(`subscription.plans.${plan.id}.title`)}</h3>
            <p className="mt-1 text-sm text-slate-500">{t(`subscription.plans.${plan.id}.subtitle`)}</p>
          </div>
          {isCurrentPlan && (
            <Badge className="shrink-0 bg-[#364D9D] hover:bg-[#364D9D]">{t('subscription.current')}</Badge>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">
              {plan.priceLabel === 'Custom' ? t('subscription.custom') : plan.priceLabel}
            </span>
            {plan.perMonth && <span className="text-slate-500">{t('subscription.perMonth')}</span>}
          </div>
          {plan.poolLines.map((line, index) => (
            <p key={line} className="mt-2 text-sm text-slate-600">
              {t(`subscription.plans.${plan.id}.poolLines.${index}`)}
            </p>
          ))}
        </div>

        <ul className="flex-1 space-y-3">
          {plan.features.map((feature, index) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>{t(`subscription.plans.${plan.id}.features.${index}`)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isSales ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(SALES_CALENDLY_URL, '_blank', 'noopener,noreferrer')}
            >
              {t(`subscription.plans.${plan.id}.buttonLabel`)}
            </Button>
          ) : isUpgrade && plan.subscriptionPlan ? (
            <CheckoutButton
              subscriptionPlan={plan.subscriptionPlan}
              label={t(`subscription.plans.${plan.id}.buttonLabel`)}
              highlighted={highlighted && !isCurrentPlan}
            />
          ) : (
            <Button className="w-full" variant={isCurrentPlan ? 'secondary' : 'outline'} disabled>
              {buttonLabel}
            </Button>
          )}
        </div>
      </article>
    </div>
  );
}

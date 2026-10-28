'use client';

import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Colors } from '@/constants/colors';
import useCreatePortalSession from '@/hooks/react-query/subscriptions/useCreatePortalSession';
import useGetSubscriptionStatus from '@/hooks/react-query/subscriptions/useGetSubscriptionStatus';
import { clientAxios } from '@/lib/clientAxios';
import { useUserStore } from '@/store/user';

import { PlanComparison } from './PlanComparison';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionFaq } from './SubscriptionFaq';
import { SubscriptionManagement } from './SubscriptionManagement';
import { SubscriptionOverview } from './SubscriptionOverview';
import { SubscriptionSectionTabs } from './SubscriptionSectionTabs';
import { SUBSCRIPTION_PLANS } from './subscriptionPlans';
import { getPlanLabel, hasBillingManagement, isPaidSubscription } from './subscriptionUtils';

type AlertKey = 'success' | 'cancelled' | 'pending';

const alertType: Record<
  AlertKey,
  {
    variant: 'destructive' | 'default' | null | undefined;
    title: string;
    description?: string;
    CustomAlertIcon: React.FC<React.SVGProps<SVGSVGElement>>;
    customClassName?: string;
    iconClassName?: string;
    iconColor?: string;
  }
> = {
  success: {
    title: 'Payment approved',
    variant: undefined,
    description: 'Your subscription is active. Enjoy your upgraded features.',
    CustomAlertIcon: Check,
    customClassName: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconColor: '#059669',
    iconClassName: ''
  },
  pending: {
    title: 'Payment processing',
    variant: undefined,
    description: 'We are confirming your payment with Stripe. This usually takes a few seconds.',
    CustomAlertIcon: Loader2,
    customClassName: 'border-blue-200 bg-blue-50 text-blue-900',
    iconClassName: 'animate-spin',
    iconColor: Colors.blue[500]
  },
  cancelled: {
    title: 'Payment failed',
    description: 'We could not process your payment. Please try again or use a different card.',
    variant: 'destructive',
    CustomAlertIcon: AlertCircle
  }
};

function SubscriptionPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const session_id = searchParams.get('session_id');
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const { setUser, user } = useUserStore(
    useShallow((state) => ({
      setUser: state.setUser,
      user: state.user
    }))
  );

  const {
    data: subscriptionStatus,
    isLoading: isStatusLoading,
    isError: isStatusError
  } = useGetSubscriptionStatus(user.firstName !== '');
  const { mutate: openPortal, isPending: isPortalPending } = useCreatePortalSession();

  const showBilling = subscriptionStatus
    ? hasBillingManagement(subscriptionStatus, user.subscription)
    : isPaidSubscription(user.subscription);
  const defaultTab = showBilling ? 'billing' : 'plans';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (isStatusLoading) return;
    setActiveTab(showBilling ? 'billing' : 'plans');
  }, [isStatusLoading, showBilling]);

  let alertData;

  if (status === 'success' || status === 'cancelled' || status === 'pending') {
    alertData = alertType[status as AlertKey];
  }

  useEffect(() => {
    if (subscriptionStatus?.plan && subscriptionStatus.plan !== user.subscription) {
      setUser({ ...user, subscription: subscriptionStatus.plan });
    }
  }, [subscriptionStatus?.plan, setUser, user]);

  useEffect(() => {
    if (status === 'pending' && session_id) {
      const checkPaymentStatus = async () => {
        try {
          const response = await clientAxios.get(`/subscriptions/checkpayment/${session_id}`);

          if (response.data.paymentStatus === 'unpaid') {
            push('/settings/subscription?status=cancelled');
            toast({
              title: 'Failed to process payment',
              variant: 'error'
            });
            return;
          }

          if (response.data.paymentStatus === 'paid') {
            setUser({ ...user, subscription: response.data.subscription });
            await queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
            push('/settings/subscription?status=success');
            toast({
              title: 'Payment processed successfully',
              description: 'You can now enjoy your new subscription',
              variant: 'success'
            });
          }
        } catch {
          push('/settings/subscription?status=cancelled');
        }
      };

      checkPaymentStatus();
      const interval = setInterval(checkPaymentStatus, 5000);

      return () => clearInterval(interval);
    }
  }, [status, session_id, setUser, user, push, queryClient]);

  useEffect(() => {
    if (user.firstName === '') {
      push('/settings/profile');
    }
  }, [user, push]);

  const currentUserPlan = subscriptionStatus?.plan ?? user.subscription;

  const plansContent = useMemo(
    () => (
      <div className="space-y-8">
        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionCard key={plan.id} plan={plan} currentUserPlan={currentUserPlan} />
          ))}
        </div>

        <PlanComparison />
        <SubscriptionFaq />
      </div>
    ),
    [currentUserPlan]
  );

  return (
    <div className="flex w-full flex-col gap-6 pb-12">
      {alertData && (
        <Alert className={alertData.customClassName} variant={alertData.variant}>
          <alertData.CustomAlertIcon className={alertData.iconClassName} color={alertData.iconColor} />
          <AlertTitle>{alertData.title}</AlertTitle>
          <AlertDescription>{alertData.description}</AlertDescription>
        </Alert>
      )}

      {isStatusLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : showBilling && subscriptionStatus ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <SubscriptionSectionTabs />

          <TabsContent value="billing" className="mt-0 space-y-6">
            <SubscriptionOverview
              status={subscriptionStatus}
              isPortalPending={isPortalPending}
              onUpdateCard={() => openPortal('payment_method_update')}
              onViewInvoices={() => openPortal('default')}
            />
            <SubscriptionManagement status={subscriptionStatus} />
          </TabsContent>

          <TabsContent value="plans" className="mt-0 space-y-6">
            <SubscriptionOverview status={subscriptionStatus} />
            {plansContent}
          </TabsContent>
        </Tabs>
      ) : showBilling ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <SubscriptionSectionTabs />

          <TabsContent value="billing" className="mt-0">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{getPlanLabel(user.subscription)} billing</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isStatusError
                  ? 'We could not load your billing details. You can still open the billing portal to update your card or view invoices.'
                  : 'Open the billing portal to update your card or view invoices.'}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => openPortal('payment_method_update')} disabled={isPortalPending}>
                  Update card
                </Button>
                <Button variant="outline" onClick={() => openPortal('default')} disabled={isPortalPending}>
                  View invoices
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="plans" className="mt-0">
            {plansContent}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          {subscriptionStatus && <SubscriptionOverview status={subscriptionStatus} />}
          {plansContent}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SubscriptionPage />
    </Suspense>
  );
}

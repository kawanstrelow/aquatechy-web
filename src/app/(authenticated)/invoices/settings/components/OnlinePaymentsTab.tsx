'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { translateMessage } from '@/i18n/runtime';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AlertCircle, CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useConnectStatus from '@/hooks/react-query/payments/useConnectStatus';
import { useConnectOnboard } from '@/hooks/react-query/payments/useConnectOnboard';
import { useConnectDashboardLink } from '@/hooks/react-query/payments/useConnectDashboardLink';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import type { StripeAccountStatus } from '@/ts/interfaces/StripeConnect';
import { isCompanyPlanDeniedMessage } from '@/utils/subscriptionDenied';

interface OnlinePaymentsTabProps {
  selectedCompany: CompanyWithMyRole;
}

function statusLabel(status: StripeAccountStatus): string {
  return translateMessage(`invoices.payments.status.${status}`, status);
}

export function OnlinePaymentsTab({ selectedCompany }: OnlinePaymentsTabProps) {
  const t = useTranslations('invoices');
  const searchParams = useSearchParams();
  const companyId = selectedCompany.id;
  const role = selectedCompany.role;
  const canManageConnect = role === 'Owner' || role === 'Admin';
  const canUpgradePlan = role === 'Owner';

  const { data: status, isLoading, refetch, isFetching, error } = useConnectStatus(companyId);
  const onboard = useConnectOnboard();
  const dashboardLink = useConnectDashboardLink();

  useEffect(() => {
    const st = searchParams.get('status');
    if (st === 'refresh' || st === 'return') {
      refetch();
    }
  }, [searchParams, refetch]);

  const handleContinueStripe = async () => {
    if (!companyId) return;
    const res = await onboard.mutateAsync(companyId);
    window.location.href = res.url;
  };

  const handleOpenStripeDashboard = async () => {
    if (!companyId) return;
    const url = await dashboardLink.mutateAsync(companyId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showRequirements =
    status?.requirements && (status.requirements.currentlyDue.length > 0 || status.requirements.pastDue.length > 0);

  const is403 = !!error && isAxiosError(error) && error.response?.status === 403;
  const deniedByPlan =
    is403 && isCompanyPlanDeniedMessage((error.response?.data as { message?: string } | undefined)?.message);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-100 p-3">
            <CreditCard className="h-6 w-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('payments.title')}</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-600">{t('payments.description')}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isFetching}>
          {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t('payments.refreshStatus')}
        </Button>
      </div>

      {deniedByPlan && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('payments.planRequired')}</AlertTitle>
          <AlertDescription>
            <p>{t('payments.planDenied')}</p>
            {canUpgradePlan ? (
              <Button asChild className="mt-3" size="sm">
                <Link href="/settings/subscription">{t('payments.viewPlans')}</Link>
              </Button>
            ) : (
              <p className="mt-2">{t('payments.ownerMustUpgrade')}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {is403 && !deniedByPlan && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('payments.accessDenied')}</AlertTitle>
          <AlertDescription>{t('payments.accessDeniedDescription')}</AlertDescription>
        </Alert>
      )}

      {!is403 && isLoading && (
        <div className="flex items-center gap-2 py-12 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('payments.loadingStatus')}
        </div>
      )}

      {!is403 && !isLoading && status && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('payments.stripeStatus')}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-semibold text-slate-900">
                  {statusLabel(status.stripeAccountStatus)}
                </span>
                {status.stripeAccountStatus === 'active' && (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
                )}
              </div>
              {!status.stripeAccountId && <p className="mt-2 text-sm text-slate-600">{t('payments.noAccount')}</p>}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('payments.capabilities')}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-800">
                <li>
                  {t('payments.chargesEnabled')}{' '}
                  <strong>{status.chargesEnabled ? t('actions.yes') : t('actions.no')}</strong>
                </li>
                <li>
                  {t('payments.payoutsEnabled')}{' '}
                  <strong>{status.payoutsEnabled ? t('actions.yes') : t('actions.no')}</strong>
                </li>
              </ul>
            </div>
          </div>

          {showRequirements && status.requirements && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('payments.needsInfo')}</AlertTitle>
              <AlertDescription className="space-y-2">
                {status.requirements.disabledReason ? (
                  <p className="text-sm">{status.requirements.disabledReason}</p>
                ) : null}
                {status.requirements.pastDue.length > 0 && (
                  <div>
                    <span className="font-medium">{t('payments.pastDue')}</span>
                    <ul className="list-inside list-disc text-sm">
                      {status.requirements.pastDue.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {status.requirements.currentlyDue.length > 0 && (
                  <div>
                    <span className="font-medium">{t('payments.currentlyDue')}</span>
                    <ul className="list-inside list-disc text-sm">
                      {status.requirements.currentlyDue.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {canManageConnect && (
              <>
                <Button
                  type="button"
                  onClick={handleContinueStripe}
                  disabled={onboard.isPending || status.stripeAccountStatus === 'rejected'}
                >
                  {onboard.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  {status.stripeAccountStatus === 'not_started' ? t('payments.connect') : t('payments.continue')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenStripeDashboard}
                  disabled={
                    dashboardLink.isPending || !status.stripeAccountId || status.stripeAccountStatus === 'not_started'
                  }
                >
                  {dashboardLink.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  {t('payments.openDashboard')}
                </Button>
              </>
            )}
            {!canManageConnect && <p className="text-sm text-slate-600">{t('payments.managersOnly')}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

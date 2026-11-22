'use client';

import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { StatusBadge, Surface } from '@/components/design';
import { Button } from '@/components/ui/button';
import useGetEstimateById from '@/hooks/react-query/estimates/useGetEstimateById';
import { useLinkEstimateRequest } from '@/hooks/react-query/estimates/useLinkEstimateRequest';
import { cn } from '@/lib/utils';
import { Estimate, EstimateStatus } from '@/ts/interfaces/Estimate';
import { Request, RequestEstimateSummary } from '@/ts/interfaces/Request';

type Props = {
  request: Request;
};

const estimateStatusTone: Record<EstimateStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral',
  sent: 'warning',
  accepted: 'success',
  declined: 'danger',
  expired: 'warning',
  cancelled: 'danger'
};

type TimelineStage = {
  key: string;
  label: string;
  at?: string | null;
};

function formatEstimateDate(value: string | null | undefined) {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'MMM d, yyyy');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy · h:mm a');
}

function dollars(cents: number | null | undefined) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

function RequestEstimateItem({
  summary,
  onUnlink,
  unlinkPending
}: {
  summary: RequestEstimateSummary;
  onUnlink: (estimateId: string) => void;
  unlinkPending: boolean;
}) {
  const t = useTranslations('requests');
  const invoices = useTranslations('invoices');
  const { data } = useGetEstimateById(summary.id);
  const estimate = data?.estimate;
  const status = estimate?.status || summary.status;
  const total = estimate?.total ?? summary.total;

  const stages = estimate
    ? buildStages(
        estimate,
        invoices('fields.issuedDate'),
        invoices('status.sent'),
        invoices('status.accepted'),
        invoices('status.declined'),
        invoices('status.expired'),
        invoices('status.cancelled'),
        t('estimateConverted')
      )
    : [];
  const currentIndex = stages.reduce((latest, stage, index) => (stage.at ? index : latest), -1);

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/invoices/estimates/${summary.id}`}
              className="text-sm font-semibold text-ink hover:text-accent"
            >
              #{summary.estimateNumber}
            </Link>
            <StatusBadge tone={estimateStatusTone[status]}>{invoices(`status.${status}`)}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="tabular-nums">{dollars(total)}</span>
            {estimate?.validUntil ? (
              <span>
                {' '}
                · {invoices('fields.validUntil')} {formatEstimateDate(estimate.validUntil)}
              </span>
            ) : null}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={unlinkPending} onClick={() => onUnlink(summary.id)}>
          {t('unlinkEstimate')}
        </Button>
      </div>

      {stages.length > 0 && (
        <ol className="mt-4">
          {stages.map((stage, index) => {
            const reached = Boolean(stage.at);
            const isLast = index === stages.length - 1;
            return (
              <li key={stage.key} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast && (
                  <span
                    className={cn(
                      'absolute bottom-0 left-[6px] top-4 w-px',
                      index < currentIndex ? 'bg-accent' : 'bg-line'
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2',
                    reached ? 'border-accent bg-accent' : 'border-line bg-surface'
                  )}
                />
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium', reached ? 'text-ink' : 'text-ink-muted')}>{stage.label}</p>
                  <p className="mt-0.5 text-sm tabular-nums text-ink-muted">{formatEstimateDate(stage.at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {estimate?.declineReason ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-muted">{invoices('fields.declineReason')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{estimate.declineReason}</p>
        </div>
      ) : null}

      {estimate?.notes ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-muted">{invoices('fields.notes')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{estimate.notes}</p>
        </div>
      ) : null}

      {estimate && estimate.lineItems.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-muted">{invoices('fields.lineItems')}</p>
          <ul className="mt-2 divide-y divide-line">
            {estimate.lineItems.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{item.description}</p>
                  <p className="text-sm tabular-nums text-ink-muted">
                    {item.quantity} × {dollars(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-ink">{dollars(item.amount)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {estimate?.convertedInvoice ? (
        <p className="mt-4 text-sm text-ink-muted">
          <Link href={`/invoices/${estimate.convertedInvoice.id}`} className="font-medium text-accent hover:underline">
            {t('estimateConverted')} #{estimate.convertedInvoice.invoiceNumber}
          </Link>
        </p>
      ) : null}
    </li>
  );
}

function buildStages(
  estimate: Estimate,
  issued: string,
  sent: string,
  accepted: string,
  declined: string,
  expired: string,
  cancelled: string,
  converted: string
): TimelineStage[] {
  const stages: TimelineStage[] = [
    { key: 'issued', label: issued, at: estimate.issuedDate || estimate.createdAt },
    { key: 'sent', label: sent, at: estimate.sentAt }
  ];

  if (estimate.status === 'declined' || estimate.declinedAt) {
    stages.push({ key: 'declined', label: declined, at: estimate.declinedAt });
  } else if (estimate.status === 'expired' || estimate.expiredAt) {
    stages.push({ key: 'expired', label: expired, at: estimate.expiredAt });
  } else if (estimate.status === 'cancelled') {
    stages.push({ key: 'cancelled', label: cancelled, at: estimate.updatedAt });
  } else {
    stages.push({ key: 'accepted', label: accepted, at: estimate.acceptedAt });
  }

  if (estimate.convertedAt || estimate.convertedInvoice || estimate.status === 'accepted') {
    stages.push({ key: 'converted', label: converted, at: estimate.convertedAt });
  }

  return stages;
}

export function RequestEstimateSection({ request }: Props) {
  const t = useTranslations('requests');
  const [known, setKnown] = useState(Array.isArray(request.estimates));
  const [linked, setLinked] = useState<RequestEstimateSummary[]>(request.estimates ?? []);
  const { mutate, isPending } = useLinkEstimateRequest();

  useEffect(() => {
    setKnown(Array.isArray(request.estimates));
    setLinked(request.estimates ?? []);
  }, [request.estimates, request.id]);

  const handleUnlink = (estimateId: string) => {
    mutate(
      { estimateId, requestId: null },
      {
        onSuccess: () => {
          setKnown(true);
          setLinked((current) => current.filter((item) => item.id !== estimateId));
        }
      }
    );
  };

  return (
    <Surface
      title={t('estimates')}
      icon={FileText}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={`/invoices/estimates/new?clientId=${request.clientId}&requestId=${request.id}`}>
            {t('newEstimate')}
          </Link>
        </Button>
      }
    >
      {known ? (
        linked.length > 0 ? (
          <ul className="divide-y divide-line">
            {linked.map((estimate) => (
              <RequestEstimateItem
                key={estimate.id}
                summary={estimate}
                onUnlink={handleUnlink}
                unlinkPending={isPending}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">{t('estimatesEmpty')}</p>
        )
      ) : (
        <p className="text-sm text-ink-muted">{t('estimatesUnavailable')}</p>
      )}
    </Surface>
  );
}

'use client';

import { format, differenceInDays, isPast } from 'date-fns';
import Link from 'next/link';

import type { Estimate } from '@/ts/interfaces/Estimate';
import { DetailedEstimate } from '../utils/estimateUiTypes';

function parseDate(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type TimelineRow = {
  id: string;
  at: Date;
  title: string;
  detail?: string;
  href?: string;
};

function buildTimelineRows(estimate: Estimate): TimelineRow[] {
  const rows: TimelineRow[] = [];

  const push = (id: string, title: string, raw: string | null | undefined, detail?: string, href?: string) => {
    const d = parseDate(raw);
    if (!d) return;
    rows.push({ id, at: d, title, detail, href });
  };

  push('created', 'Created', estimate.createdAt ?? estimate.issuedDate);
  push('sent', 'Sent to client', estimate.sentAt);
  push('accepted', 'Accepted', estimate.acceptedAt, estimate.convertedInvoice?.invoiceNumber
    ? `Invoice #${estimate.convertedInvoice.invoiceNumber} created`
    : undefined,
    estimate.convertedInvoiceId ? `/invoices/${estimate.convertedInvoiceId}` : undefined
  );
  push('declined', 'Declined', estimate.declinedAt, estimate.declineReason ?? undefined);
  push('expired', 'Expired', estimate.expiredAt);

  if (estimate.status === 'cancelled') {
    push('cancelled', 'Cancelled', estimate.updatedAt);
  }

  rows.sort((a, b) => a.at.getTime() - b.at.getTime());
  return rows;
}

type Props = {
  estimate: Estimate;
};

export function EstimateActivityTimeline({ estimate }: Props) {
  const rows = buildTimelineRows(estimate);

  const validUntil = parseDate(estimate.validUntil);
  const showCountdown =
    estimate.status === 'sent' && validUntil && !isPast(validUntil) && !estimate.expiredAt;

  if (rows.length === 0 && !showCountdown) return null;

  return (
    <section aria-label="Estimate activity" className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-500">Timeline</h3>

      {showCountdown && validUntil && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          Client can respond for {differenceInDays(validUntil, new Date())} more day(s) (until{' '}
          {format(validUntil, 'MMM d, yyyy')}).
        </div>
      )}

      {rows.length > 0 && (
        <ol className="flex flex-col">
          {rows.map(({ id, at, title, detail, href }, idx) => {
            const last = idx === rows.length - 1;
            return (
              <li key={id} className="flex gap-4">
                <div className="flex w-11 shrink-0 flex-col items-center pt-1">
                  <span
                    className="size-[11px] shrink-0 rounded-full border-2 border-white bg-blue-600 shadow-sm ring-1 ring-gray-200"
                    aria-hidden
                  />
                  {!last ? <span className="mt-2 min-h-14 w-px grow bg-gray-200" aria-hidden /> : null}
                </div>
                <div className={`min-w-0 flex-1 flex flex-col gap-1 ${last ? '' : 'pb-6'}`}>
                  <span className="text-sm font-medium text-gray-900">{title}</span>
                  {detail ? <span className="text-xs text-gray-600">{detail}</span> : null}
                  {href ? (
                    <Link href={href} className="text-xs text-blue-600 hover:underline">
                      View invoice
                    </Link>
                  ) : null}
                  <time className="text-xs tabular-nums text-gray-600" dateTime={at.toISOString()}>
                    {format(at, 'MMM d, yyyy · h:mm a')}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function transformEstimateToDetailed(apiEstimate: Estimate): DetailedEstimate & {
  estimateNumber: string;
  companyOwner?: { name: string; email?: string };
} {
  const toDollars = (cents: number) => (cents ?? 0) / 100;

  return {
    id: apiEstimate.id,
    estimateNumber: apiEstimate.estimateNumber,
    clientId: apiEstimate.clientId,
    companyOwnerId: apiEstimate.companyOwnerId,
    clientName: `${apiEstimate.client.firstName} ${apiEstimate.client.lastName}`,
    clientEmail: apiEstimate.client.email,
    companyName: apiEstimate.companyOwner.name,
    issuedDate: new Date(apiEstimate.issuedDate),
    validUntil: new Date(apiEstimate.validUntil),
    status: apiEstimate.status,
    lineItems: apiEstimate.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: toDollars(item.unitPrice),
      amount: toDollars(item.amount),
      taxRate: item.taxRate ?? 0,
      taxAmount: item.taxAmount !== undefined ? toDollars(item.taxAmount) : 0,
      sku: item.sku ?? undefined
    })),
    subtotal: toDollars(apiEstimate.subtotal),
    taxAmount: toDollars(apiEstimate.taxAmount),
    discountRate: apiEstimate.discountRate,
    discountAmount: toDollars(apiEstimate.discountAmount),
    total: toDollars(apiEstimate.total),
    notes: apiEstimate.notes || '',
    terms: apiEstimate.terms || '',
    sentAt: apiEstimate.sentAt,
    acceptedAt: apiEstimate.acceptedAt,
    declinedAt: apiEstimate.declinedAt,
    expiredAt: apiEstimate.expiredAt,
    declineReason: apiEstimate.declineReason,
    convertedInvoiceId: apiEstimate.convertedInvoiceId,
    convertedInvoiceNumber: apiEstimate.convertedInvoice?.invoiceNumber ?? null,
    createdAt: apiEstimate.createdAt ?? null,
    companyOwner: {
      name: apiEstimate.companyOwner.name,
      email: apiEstimate.companyOwner.email
    }
  };
}

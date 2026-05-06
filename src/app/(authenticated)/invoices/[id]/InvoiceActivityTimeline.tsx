'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';

import type { Invoice } from '@/ts/interfaces/Invoice';

function formatMoneyFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

function parseDate(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type TimelineRow = {
  /** Stable id for React key */
  id: string;
  at: Date;
  title: string;
  /** Extra line (e.g. partial refund amount) */
  detail?: string;
};

function buildTimelineRows(inv: Invoice): TimelineRow[] {
  const rows: TimelineRow[] = [];

  const push = (id: string, title: string, raw: string | null | undefined, detail?: string) => {
    const d = parseDate(raw);
    if (!d) return;
    rows.push({ id, at: d, title, detail });
  };

  push('created', 'Created', inv.createdAt);
  push('paid', 'Paid', inv.paidAt);
  push('cancelled', 'Cancelled', inv.cancelledAt);

  const refundedAt = parseDate(inv.refundedAt);
  if (refundedAt) {
    const status = inv.refundStatus ?? 'none';
    const refundedCents = Math.max(0, inv.totalRefundedCents ?? 0);

    let title: string;
    let detail: string | undefined;

    if (status === 'full') {
      title = 'Full refund';
    } else if (status === 'partial') {
      title = 'Partial refund';
      if (refundedCents > 0) {
        detail = `${formatMoneyFromCents(refundedCents)} refunded`;
      }
    } else {
      title = 'Refunded';
      if (refundedCents > 0) {
        detail = `${formatMoneyFromCents(refundedCents)} refunded`;
      }
    }

    rows.push({ id: 'refunded', at: refundedAt, title, detail });
  }

  rows.sort((a, b) => a.at.getTime() - b.at.getTime());

  return rows;
}

type Props = {
  invoice: Invoice;
};

export function InvoiceActivityTimeline({ invoice }: Props) {
  const rows = useMemo(() => buildTimelineRows(invoice), [invoice]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Invoice activity"
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-500">Timeline</h3>
      <ol className="flex flex-col">
        {rows.map(({ id, at, title, detail }, idx) => {
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
                {detail ? (
                  <span className="text-xs text-gray-600">{detail}</span>
                ) : null}
                <time className="text-xs tabular-nums text-gray-600" dateTime={at.toISOString()}>
                  {format(at, 'MMM d, yyyy · h:mm a')}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

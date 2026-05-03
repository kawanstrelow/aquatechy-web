'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { portalAxios } from '@/lib/portalAxios';
import type { ClientPortalInvoicesResponse, ClientPortalMeResponse } from '@/ts/interfaces/ClientPortal';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function ClientPortalHomePage() {
  const meQuery = useQuery({
    queryKey: ['client-portal-me'],
    queryFn: async () => {
      const { data } = await portalAxios.get<ClientPortalMeResponse>('/client-portal/me');
      return data;
    },
    staleTime: 60 * 1000
  });

  const invoicesQuery = useQuery({
    queryKey: ['client-portal-invoices-list'],
    queryFn: async () => {
      const { data } = await portalAxios.get<ClientPortalInvoicesResponse>('/client-portal/invoices');
      return data.invoices ?? [];
    }
  });

  if (meQuery.isLoading || invoicesQuery.isLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading your account...
      </div>
    );
  }

  const meError = !!meQuery.isError || !!invoicesQuery.isError;

  return (
    <div className="space-y-8">
      {meError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Unable to refresh your dashboard.{' '}
          <Link href="/client-portal/request-link" className="font-medium underline">
            Try signing in again
          </Link>
          .
        </p>
      )}

      {meQuery.data && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Hello{' '}
            {[meQuery.data.client.firstName, meQuery.data.client.lastName].filter(Boolean).join(' ') ||
              meQuery.data.client.email}
          </h1>
          {meQuery.data.company?.name ? (
            <p className="mt-2 text-sm text-slate-600">{meQuery.data.company.name}</p>
          ) : null}
          {meQuery.data.cardOnFile?.last4 ? (
            <p className="mt-4 text-sm text-slate-700">
              Card on file: {[meQuery.data.cardOnFile.brand, `••••${meQuery.data.cardOnFile.last4}`]
                .filter(Boolean)
                .join(' ')}{' '}
              {meQuery.data.cardOnFile.exp ? `(exp ${meQuery.data.cardOnFile.exp})` : null}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No card saved yet.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/client-portal/invoices"
              className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              View invoices
            </Link>
            <Link
              href="/client-portal/payment-method"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Manage payment method
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent invoices</h2>
          <Link href="/client-portal/invoices" className="text-sm font-medium text-sky-700 hover:text-sky-900">
            See all
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {(invoicesQuery.data ?? []).slice(0, 8).map((inv) => {
            const toDollars = (cents: number) => (typeof cents === 'number' ? cents / 100 : 0).toFixed(2);
            return (
              <li key={inv.id}>
                <Link
                  href={`/client-portal/invoices/${inv.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{inv.invoiceNumber}</span>
                  <span className="text-slate-600">${toDollars(inv.total)}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
                    {inv.status}
                  </span>
                  <span className="text-xs text-slate-500">{format(new Date(inv.dueDate), 'MMM d, yyyy')}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {(invoicesQuery.data ?? []).length === 0 && (
          <p className="p-8 text-center text-sm text-slate-600">No invoices yet.</p>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { portalAxios } from '@/lib/portalAxios';
import type { ClientPortalInvoiceListItem } from '@/ts/interfaces/ClientPortal';
import { format } from 'date-fns';
import {
  clientPortalFocusSpinnerClassName,
  clientPortalLinkClassName,
  clientPortalTableHeadClassName
} from '@/constants/clientPortal';
import { Loader2 } from 'lucide-react';

export default function ClientPortalInvoicesPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['client-portal-invoices-list'],
    queryFn: async () => {
      const { data } = await portalAxios.get<{ invoices: ClientPortalInvoiceListItem[] }>(
        '/client-portal/invoices'
      );
      return data.invoices ?? [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-700">
        <Loader2 className={`h-6 w-6 animate-spin ${clientPortalFocusSpinnerClassName}`} />
        Loading invoices...
      </div>
    );
  }

  const toDollars = (cents: number) => (typeof cents === 'number' ? cents / 100 : 0).toFixed(2);

  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your invoices</h1>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className={`border-b font-semibold ${clientPortalTableHeadClassName}`}>
            <tr>
              <th className="px-6 py-3">Invoice</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Paid</th>
              <th className="px-6 py-3">Due</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#eef2fc]/70">
                <td className="px-6 py-3 font-medium text-slate-900">{inv.invoiceNumber}</td>
                <td className="px-6 py-3 capitalize text-slate-700">{inv.status}</td>
                <td className="px-6 py-3 text-slate-600">
                  {inv.paidAt ? format(new Date(inv.paidAt), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-6 py-3 text-slate-600">{format(new Date(inv.dueDate), 'MMM d, yyyy')}</td>
                <td className="px-6 py-3 text-right font-medium text-slate-900">${toDollars(inv.total)}</td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/client-portal/invoices/${inv.id}`} className={`text-sm ${clientPortalLinkClassName}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p className="p-12 text-center text-sm text-slate-600">You do not have any invoices yet.</p>
        )}
      </div>
    </div>
  );
}

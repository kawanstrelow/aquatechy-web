'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { portalAxios } from '@/lib/portalAxios';
import type { ClientPortalInvoiceListItem } from '@/ts/interfaces/ClientPortal';
import { format } from 'date-fns';
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
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading invoices...
      </div>
    );
  }

  const toDollars = (cents: number) => (typeof cents === 'number' ? cents / 100 : 0).toFixed(2);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your invoices</h1>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Invoice</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Issued</th>
              <th className="px-6 py-3 font-semibold">Due</th>
              <th className="px-6 py-3 font-semibold text-right">Total</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{inv.invoiceNumber}</td>
                <td className="px-6 py-3 capitalize text-slate-700">{inv.status}</td>
                <td className="px-6 py-3 text-slate-600">{format(new Date(inv.issuedDate), 'MMM d, yyyy')}</td>
                <td className="px-6 py-3 text-slate-600">{format(new Date(inv.dueDate), 'MMM d, yyyy')}</td>
                <td className="px-6 py-3 text-right font-medium text-slate-900">${toDollars(inv.total)}</td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/client-portal/invoices/${inv.id}`}
                    className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                  >
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

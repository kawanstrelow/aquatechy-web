'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Download, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { portalAxios } from '@/lib/portalAxios';
import type { ClientPortalInvoiceDetail } from '@/ts/interfaces/ClientPortal';
import type { CheckoutSessionResponse } from '@/ts/interfaces/StripeConnect';

export default function ClientPortalInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const detailQuery = useQuery({
    queryKey: ['client-portal-invoice', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await portalAxios.get<ClientPortalInvoiceDetail>(`/client-portal/invoices/${id}`);
      return data;
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await portalAxios.post<CheckoutSessionResponse>(
        `/client-portal/invoices/${id}/checkout-session`
      );
      return data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        alert(typeof msg === 'string' ? msg : 'Unable to open checkout.');
      }
    }
  });

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const res = await portalAxios.get<Blob>(`/client-portal/invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      const num = detailQuery.data?.invoiceNumber ?? id;
      a.href = url;
      a.download = `invoice-${num}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  });

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading invoice...
      </div>
    );
  }

  const inv = detailQuery.data;
  const toDollars = (c?: number | null) => (typeof c === 'number' ? c / 100 : 0);
  const canPayOnline = ['unpaid', 'overdue'].includes(inv.status ?? '');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">
            <Link href="/client-portal/invoices" className="hover:text-slate-900">
              Invoices
            </Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-900">{inv.invoiceNumber ?? inv.id}</span>
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{inv.invoiceNumber ?? `Invoice ${inv.id}`}</h1>
          <div className="mt-4 space-y-1 text-sm text-slate-700">
            {inv.status ? (
              <p>
                <span className="font-medium text-slate-500">Status:</span>{' '}
                <span className="capitalize">{inv.status}</span>
              </p>
            ) : null}
            {inv.issuedDate ? (
              <p>
                <span className="font-medium text-slate-500">Issued:</span>{' '}
                {format(new Date(inv.issuedDate), 'MMM d, yyyy')}
              </p>
            ) : null}
            {inv.dueDate ? (
              <p>
                <span className="font-medium text-slate-500">Due:</span>{' '}
                {format(new Date(inv.dueDate), 'MMM d, yyyy')}
              </p>
            ) : null}
            {inv.paidAt ? (
              <p>
                <span className="font-medium text-slate-500">Paid on:</span>{' '}
                {format(new Date(inv.paidAt), 'MMM d, yyyy')}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPayOnline && (
            <Button
              type="button"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="gap-2"
            >
              {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay now
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => pdfMutation.mutate()}
            disabled={pdfMutation.isPending}
            className="gap-2"
          >
            {pdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
          <Button type="button" variant="ghost" onClick={() => void detailQuery.refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        {(inv.lineItems ?? []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-6 py-3 font-semibold">Qty</th>
                  <th className="px-6 py-3 font-semibold text-right">Unit</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(inv.lineItems ?? []).map((line, idx) => (
                  <tr key={`${idx}-${line.description}`}>
                    <td className="px-6 py-3 text-slate-900">{line.description}</td>
                    <td className="px-6 py-3 text-slate-700">{line.quantity}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-slate-700">
                      ${toDollars(line.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-medium text-slate-900">
                      ${toDollars(line.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="space-y-2 border-t border-slate-100 px-6 py-4 text-sm">
          {inv.subtotal != null ? (
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span>${toDollars(inv.subtotal).toFixed(2)}</span>
            </div>
          ) : null}
          {typeof inv.taxAmount === 'number' && inv.taxAmount > 0 ? (
            <div className="flex justify-between text-slate-700">
              <span>Tax</span>
              <span>${toDollars(inv.taxAmount).toFixed(2)}</span>
            </div>
          ) : null}
          {'discountAmount' in inv && typeof inv.discountAmount === 'number' && inv.discountAmount > 0 ? (
            <div className="flex justify-between text-slate-700">
              <span>Discount</span>
              <span>-${toDollars(inv.discountAmount).toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between pt-2 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>${typeof inv.total === 'number' ? toDollars(inv.total).toFixed(2) : '—'}</span>
          </div>
        </div>
      </div>

      {(inv.notes ?? inv.paymentTerms ?? inv.paymentInstructions) && (
        <div className="grid gap-4 md:grid-cols-3">
          {inv.paymentTerms ? (
            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden /> Terms
              </h3>
              <p className="whitespace-pre-line text-slate-700">{inv.paymentTerms}</p>
            </div>
          ) : null}
          {inv.notes ? (
            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm md:col-span-2">
              <h3 className="mb-2 font-semibold text-slate-900">Notes</h3>
              <p className="whitespace-pre-line text-slate-700">{inv.notes}</p>
            </div>
          ) : null}
          {inv.paymentInstructions ? (
            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm md:col-span-3">
              <h3 className="mb-2 font-semibold text-slate-900">Payment instructions</h3>
              <p className="whitespace-pre-line text-slate-700">{inv.paymentInstructions}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

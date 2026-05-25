'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { differenceInDays, format, isPast } from 'date-fns';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

import {
  CLIENT_PORTAL_GRADIENT_BLUE_STYLE,
  clientPortalFocusSpinnerClassName,
  clientPortalLinkClassName,
  clientPortalOutlineAccentButtonClassName,
  clientPortalPrimaryButtonClassName,
  clientPortalTableHeadClassName
} from '@/constants/clientPortal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { portalAxios } from '@/lib/portalAxios';
import type {
  ClientPortalDeclineEstimateRequest,
  ClientPortalEstimateDetail
} from '@/ts/interfaces/ClientPortal';
import type { AcceptEstimateResponse } from '@/ts/interfaces/Estimate';

function canRespond(estimate: ClientPortalEstimateDetail): boolean {
  if (estimate.status !== 'sent') return false;
  if (estimate.expiredAt) return false;
  if (!estimate.validUntil) return false;
  const validUntil = new Date(estimate.validUntil);
  return !Number.isNaN(validUntil.getTime()) && !isPast(validUntil);
}

export default function ClientPortalEstimateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const detailQuery = useQuery({
    queryKey: ['client-portal-estimate', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await portalAxios.get<ClientPortalEstimateDetail>(`/client-portal/estimates/${id}`);
      return data;
    }
  });

  const invalidateEstimateQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['client-portal-estimate', id] });
    void queryClient.invalidateQueries({ queryKey: ['client-portal-estimates-list'] });
  };

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { data } = await portalAxios.post<AcceptEstimateResponse>(`/client-portal/estimates/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      invalidateEstimateQueries();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        alert(typeof msg === 'string' ? msg : 'Unable to accept estimate.');
      }
    }
  });

  const declineMutation = useMutation({
    mutationFn: async (body: ClientPortalDeclineEstimateRequest) => {
      await portalAxios.post(`/client-portal/estimates/${id}/decline`, body);
    },
    onSuccess: () => {
      setDeclineOpen(false);
      setDeclineReason('');
      invalidateEstimateQueries();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        alert(typeof msg === 'string' ? msg : 'Unable to decline estimate.');
      }
    }
  });

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const res = await portalAxios.get<Blob>(`/client-portal/estimates/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      const num = detailQuery.data?.estimateNumber ?? id;
      a.href = url;
      a.download = `estimate-${num}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  });

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <div className="flex items-center gap-3 text-slate-700">
        <Loader2 className={`h-6 w-6 animate-spin ${clientPortalFocusSpinnerClassName}`} />
        Loading estimate...
      </div>
    );
  }

  const est = detailQuery.data;
  const toDollars = (c?: number | null) => (typeof c === 'number' ? c / 100 : 0);
  const respondAllowed = canRespond(est);
  const validUntil = est.validUntil ? new Date(est.validUntil) : null;
  const showCountdown =
    est.status === 'sent' && validUntil && !Number.isNaN(validUntil.getTime()) && !isPast(validUntil) && !est.expiredAt;

  const convertedInvoiceId = est.convertedInvoice?.id ?? est.convertedInvoiceId;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">
            <Link href="/client-portal/estimates" className={clientPortalLinkClassName}>
              Estimates
            </Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-900">{est.estimateNumber ?? est.id}</span>
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {est.estimateNumber ?? `Estimate ${est.id}`}
          </h1>
          <div className="mt-4 space-y-1 text-sm text-slate-700">
            {est.status ? (
              <p>
                <span className="font-medium text-slate-500">Status:</span>{' '}
                <span className="capitalize">{est.status}</span>
              </p>
            ) : null}
            {est.issuedDate ? (
              <p>
                <span className="font-medium text-slate-500">Issued:</span>{' '}
                {format(new Date(est.issuedDate), 'MMM d, yyyy')}
              </p>
            ) : null}
            {est.validUntil ? (
              <p>
                <span className="font-medium text-slate-500">Valid until:</span>{' '}
                {format(new Date(est.validUntil), 'MMM d, yyyy')}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {respondAllowed && (
            <>
              <Button
                type="button"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || declineMutation.isPending}
                className={`gap-2 ${clientPortalPrimaryButtonClassName}`}
                style={CLIENT_PORTAL_GRADIENT_BLUE_STYLE}
              >
                {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Accept
              </Button>
              <Button
                type="button"
                variant="outline"
                className={clientPortalOutlineAccentButtonClassName}
                disabled={acceptMutation.isPending || declineMutation.isPending}
                onClick={() => setDeclineOpen(true)}
              >
                Decline
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className={`gap-2 ${clientPortalOutlineAccentButtonClassName}`}
            onClick={() => pdfMutation.mutate()}
            disabled={pdfMutation.isPending}
          >
            {pdfMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
          <Button type="button" variant="ghost" onClick={() => void detailQuery.refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {showCountdown && validUntil && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          You can respond for {differenceInDays(validUntil, new Date())} more day(s) (until{' '}
          {format(validUntil, 'MMM d, yyyy')}).
        </div>
      )}

      {est.status === 'accepted' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p>Your pool company will process the invoice.</p>
          {convertedInvoiceId ? (
            <p className="mt-2">
              <Link href={`/client-portal/invoices/${convertedInvoiceId}`} className={`${clientPortalLinkClassName} underline`}>
                View invoice
                {est.convertedInvoice?.invoiceNumber ? ` #${est.convertedInvoice.invoiceNumber}` : ''}
              </Link>
            </p>
          ) : null}
        </div>
      )}

      {(est.status === 'declined' || est.status === 'expired') && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {est.status === 'declined'
            ? 'This estimate was declined.'
            : 'This estimate has expired and can no longer be accepted.'}
          {est.declineReason ? (
            <p className="mt-2 text-slate-600">Reason: {est.declineReason}</p>
          ) : null}
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        {(est.lineItems ?? []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className={`border-b font-semibold ${clientPortalTableHeadClassName}`}>
                <tr>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Qty</th>
                  <th className="px-6 py-3 text-right">Unit</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(est.lineItems ?? []).map((line, idx) => (
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
          {est.subtotal != null ? (
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span>${toDollars(est.subtotal).toFixed(2)}</span>
            </div>
          ) : null}
          {typeof est.taxAmount === 'number' && est.taxAmount > 0 ? (
            <div className="flex justify-between text-slate-700">
              <span>Tax</span>
              <span>${toDollars(est.taxAmount).toFixed(2)}</span>
            </div>
          ) : null}
          {'discountAmount' in est && typeof est.discountAmount === 'number' && est.discountAmount > 0 ? (
            <div className="flex justify-between text-slate-700">
              <span>Discount</span>
              <span>-${toDollars(est.discountAmount).toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between pt-2 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>${typeof est.total === 'number' ? toDollars(est.total).toFixed(2) : '—'}</span>
          </div>
        </div>
      </div>

      {(est.notes ?? est.terms) && (
        <div className="grid gap-4 md:grid-cols-2">
          {est.terms ? (
            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden /> Terms
              </h3>
              <p className="whitespace-pre-line text-slate-700">{est.terms}</p>
            </div>
          ) : null}
          {est.notes ? (
            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
              <h3 className="mb-2 font-semibold text-slate-900">Notes</h3>
              <p className="whitespace-pre-line text-slate-700">{est.notes}</p>
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline estimate</DialogTitle>
            <DialogDescription>
              You can optionally tell your pool company why you are declining this estimate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="portal-decline-reason">Reason (optional)</Label>
            <Textarea
              id="portal-decline-reason"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Optional reason for declining"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className={clientPortalOutlineAccentButtonClassName}
              disabled={declineMutation.isPending}
              onClick={() => declineMutation.mutate({ declineReason: declineReason.trim() || undefined })}
            >
              {declineMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Decline estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  clientPortalFocusSpinnerClassName,
  clientPortalOutlineAccentButtonClassName,
  clientPortalPageBgClassName
} from '@/constants/clientPortal';
import type { AcceptEstimateResponse } from '@/ts/interfaces/Estimate';
import type { PublicEstimateRespondDeclineResponse } from '@/ts/interfaces/ClientPortal';

function apiOrigin(): string {
  const raw = process.env.API_URL ?? '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'missing_token' }
  | { kind: 'decline_form' }
  | { kind: 'accepted'; invoiceNumber?: string; alreadyConverted?: boolean }
  | { kind: 'declined' }
  | { kind: 'error'; message: string };

function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const msg = error.response?.data?.message;
    const text = Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : null;

    if (status === 404) return 'This link is invalid or has expired.';
    if (status === 409) {
      return text ?? 'This estimate can no longer be accepted or declined (expired or already responded).';
    }
    return text ?? 'Something went wrong. Please contact your pool company.';
  }
  return 'Something went wrong. Please contact your pool company.';
}

function EstimateRespondInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const submittedRef = useRef(false);

  const [state, setState] = useState<PageState>(() =>
    token ? { kind: 'loading' } : { kind: 'missing_token' }
  );
  const [declineReason, setDeclineReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRespond = useCallback(
    async (declineReasonValue?: string) => {
      if (!token) {
        setState({ kind: 'missing_token' });
        return;
      }

      setSubmitting(true);
      setState({ kind: 'loading' });

      try {
        const base = apiOrigin();
        const body: { token: string; declineReason?: string } = { token };
        if (declineReasonValue?.trim()) {
          body.declineReason = declineReasonValue.trim();
        }

        const { data, status } = await axios.post<AcceptEstimateResponse | PublicEstimateRespondDeclineResponse>(
          `${base}/api/v1/estimates/respond`,
          body,
          { headers: { 'Content-Type': 'application/json' }, timeout: 30_000, validateStatus: () => true }
        );

        if (status >= 400) {
          const msg = (data as { message?: string | string[] })?.message;
          const text = Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : null;
          if (status === 404) {
            setState({ kind: 'error', message: 'This link is invalid or has expired.' });
            return;
          }
          if (status === 409) {
            setState({
              kind: 'error',
              message:
                text ?? 'This estimate can no longer be accepted or declined (expired or already responded).'
            });
            return;
          }
          setState({ kind: 'error', message: text ?? 'Something went wrong. Please contact your pool company.' });
          return;
        }

        if ('declined' in data && data.declined) {
          setState({ kind: 'declined' });
          return;
        }

        const acceptData = data as AcceptEstimateResponse;
        setState({
          kind: 'accepted',
          invoiceNumber: acceptData.invoice?.invoiceNumber,
          alreadyConverted: acceptData.alreadyConverted
        });
      } catch (error) {
        setState({ kind: 'error', message: parseApiError(error) });
      } finally {
        setSubmitting(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token || submittedRef.current) return;

    if (action === 'decline') {
      setState({ kind: 'decline_form' });
      return;
    }

    submittedRef.current = true;
    void submitRespond();
  }, [token, action, submitRespond]);

  const handleDeclineSubmit = () => {
    submittedRef.current = true;
    void submitRespond(declineReason);
  };

  return (
    <div className={`flex min-h-screen flex-col ${clientPortalPageBgClassName}`}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 p-6">
        <div className="flex justify-center">
          <Link href="/" className="inline-block rounded-md outline-offset-4" aria-label="Aquatechy home">
            <Image
              priority
              width={0}
              height={0}
              sizes="100vw"
              className="h-auto w-52 max-w-[min(13rem,85vw)]"
              src="/images/logoHor.png"
              alt="Aquatechy"
            />
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          {state.kind === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 className={`h-10 w-10 animate-spin ${clientPortalFocusSpinnerClassName}`} aria-hidden />
              <p className="text-sm text-slate-700">Processing your response...</p>
            </div>
          )}

          {state.kind === 'missing_token' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-700">This link is missing a token. Please use the link from your email.</p>
            </div>
          )}

          {state.kind === 'decline_form' && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold text-slate-900">Decline estimate</h1>
              <p className="text-sm text-slate-600">
                You can optionally tell your pool company why you are declining this estimate.
              </p>
              <div className="space-y-2">
                <Label htmlFor="decline-reason">Reason (optional)</Label>
                <Textarea
                  id="decline-reason"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Optional reason for declining"
                  rows={3}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className={clientPortalOutlineAccentButtonClassName}
                disabled={submitting}
                onClick={handleDeclineSubmit}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Decline estimate
              </Button>
            </div>
          )}

          {state.kind === 'accepted' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-600" aria-hidden />
              <h1 className="text-xl font-semibold text-slate-900">Estimate accepted</h1>
              <p className="text-sm text-slate-700">
                {state.alreadyConverted
                  ? 'This estimate was already accepted.'
                  : 'Thank you! Your pool company will send an invoice shortly.'}
              </p>
              {state.invoiceNumber ? (
                <p className="text-sm text-slate-600">Reference: invoice #{state.invoiceNumber}</p>
              ) : null}
            </div>
          )}

          {state.kind === 'declined' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="h-12 w-12 text-slate-500" aria-hidden />
              <h1 className="text-xl font-semibold text-slate-900">Estimate declined</h1>
              <p className="text-sm text-slate-700">Your pool company has been notified.</p>
            </div>
          )}

          {state.kind === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="h-12 w-12 text-red-500" aria-hidden />
              <h1 className="text-xl font-semibold text-slate-900">Unable to respond</h1>
              <p className="text-sm text-slate-700">{state.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EstimateRespondPage() {
  return (
    <Suspense
      fallback={
        <div className={`flex min-h-screen items-center justify-center ${clientPortalPageBgClassName}`}>
          <Loader2 className={`h-10 w-10 animate-spin ${clientPortalFocusSpinnerClassName}`} aria-hidden />
        </div>
      }
    >
      <EstimateRespondInner />
    </Suspense>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import {
  CLIENT_PORTAL_GRADIENT_BLUE_STYLE,
  clientPortalOutlineAccentButtonClassName,
  clientPortalPrimaryButtonClassName,
  clientPortalFocusSpinnerClassName
} from '@/constants/clientPortal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { portalAxios } from '@/lib/portalAxios';
import type { ClientPortalMeResponse } from '@/ts/interfaces/ClientPortal';

function ClientPortalPaymentMethodInner() {
  const searchParams = useSearchParams();
  const statusNote = searchParams.get('status');
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['client-portal-me'],
    queryFn: async () => {
      const { data } = await portalAxios.get<ClientPortalMeResponse>('/client-portal/me');
      return data;
    },
    staleTime: 60 * 1000
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const { data } = await portalAxios.post<{ url: string }>('/client-portal/payment-method/setup-session');
      return data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    }
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await portalAxios.delete('/client-portal/payment-method');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['client-portal-me'] });
    },
    onError: () => {
      alert('Could not remove saved card. Try again or contact your pool technician.');
    }
  });

  if (meQuery.isLoading || !meQuery.data) {
    return (
      <div className="flex items-center gap-3 text-slate-700">
        <Loader2 className={`h-6 w-6 animate-spin ${clientPortalFocusSpinnerClassName}`} />
        Loading payment method...
      </div>
    );
  }

  const card = meQuery.data.cardOnFile;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Payment method</h1>
      {statusNote === 'success' && (
        <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
          Stripe confirmed your saved card setup. Refresh if you still see old details.
        </p>
      )}
      {statusNote === 'cancel' && (
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">Card setup canceled. You can try again.</p>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {card?.last4 ? (
          <>
            <p className="text-sm text-slate-600">
              Current card:{` `}
              <span className="font-semibold text-slate-900">
                {[card.brand, `••••${card.last4}`].filter(Boolean).join(' ')}
              </span>
              {card.exp ? <span>{` (exp ${card.exp})`}</span> : null}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Remove card
              </Button>
              <Button
                type="button"
                variant="outline"
                className={clientPortalOutlineAccentButtonClassName}
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Replace with new card
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">No saved card yet. Securely add one through Stripe Checkout.</p>
            <Button
              type="button"
              className={`mt-4 ${clientPortalPrimaryButtonClassName}`}
              style={CLIENT_PORTAL_GRADIENT_BLUE_STYLE}
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add payment method
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Card details are handled by Stripe. Aquatechy stores only what is needed for invoice payments authorized through
        this portal or by your technician.
      </p>
    </div>
  );
}

export default function ClientPortalPaymentMethodPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 text-slate-700">
          <Loader2 className={`h-6 w-6 animate-spin ${clientPortalFocusSpinnerClassName}`} />
          Loading…
        </div>
      }
    >
      <ClientPortalPaymentMethodInner />
    </Suspense>
  );
}

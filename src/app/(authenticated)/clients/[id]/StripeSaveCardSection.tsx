'use client';

import { CreditCard, Loader2 } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useConnectStatus from '@/hooks/react-query/payments/useConnectStatus';
import { useClientSetupCheckout } from '@/hooks/react-query/clients/useClientSetupCheckout';
import type { Client } from '@/ts/interfaces/Client';

interface Props {
  client: Client;
  /** `preferences`: client Preferences tab section. `inline`: compact (e.g. sidebars). */
  variant?: 'inline' | 'preferences';
}

export default function StripeSaveCardSection({ client, variant = 'inline' }: Props) {
  const { data: companies = [], isLoading: companiesLoading } = useGetCompanies();
  const membership = companies.find((c) => c.id === client.companyOwnerId);
  const role = membership?.role;
  const allowed = role === 'Owner' || role === 'Admin' || role === 'Office';

  const { data: connect, isLoading: connectLoading } = useConnectStatus(client.companyOwnerId);
  const stripeReady = !!(connect?.chargesEnabled && connect?.payoutsEnabled);
  const setup = useClientSetupCheckout();

  if (companiesLoading) {
    return variant === 'preferences' ? (
      <div className="mb-8 flex justify-center rounded-lg border border-gray-200 bg-gray-50 py-8">
        <LoadingSpinner />
      </div>
    ) : null;
  }

  if (!allowed) {
    return null;
  }

  const handleSetup = async () => {
    const url = await setup.mutateAsync(client.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isPreferences = variant === 'preferences';

  const inner = (
    <div className="w-full space-y-3 text-left">
      {!isPreferences ? (
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Online payments</div>
      ) : (
        <>
          <h2 className="text-base font-semibold text-gray-900">Card on file</h2>
          <p className="text-sm text-muted-foreground">
            Saved card is used for “charge card on file” on invoices after the client completes Stripe’s secure setup.
          </p>
        </>
      )}
      {client.cardOnFileLast4 ? (
        <p className="text-sm text-gray-700">
          Card on file: {[client.cardOnFileBrand, `••••${client.cardOnFileLast4}`].filter(Boolean).join(' ')}{' '}
          {client.cardOnFileExp ? `(exp ${client.cardOnFileExp})` : null}
        </p>
      ) : (
        <p className="text-sm text-gray-600">No card saved for recurring charges.</p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        disabled={connectLoading || !stripeReady || setup.isPending}
        onClick={() => void handleSetup()}
        title={
          !stripeReady
            ? 'Connect Stripe and enable charges in Invoice Settings → Online Payments.'
            : undefined
        }
      >
        {setup.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
        Open Stripe link to save card
      </Button>
    </div>
  );

  if (isPreferences) {
    return <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">{inner}</div>;
  }

  return inner;
}

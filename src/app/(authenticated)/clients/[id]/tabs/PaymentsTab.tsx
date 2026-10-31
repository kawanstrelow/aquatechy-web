'use client';

import type { Client } from '@/ts/interfaces/Client';

import StripeSaveCardSection from '../StripeSaveCardSection';

type Props = {
  client: Client;
};

export default function PaymentsTab({ client }: Props) {
  return (
    <div className="w-full self-stretch">
      <StripeSaveCardSection client={client} variant="payments" />
    </div>
  );
}

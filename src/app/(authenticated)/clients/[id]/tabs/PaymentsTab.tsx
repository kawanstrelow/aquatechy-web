'use client';

import type { Client } from '@/ts/interfaces/Client';

import StripeSaveCardSection from '../StripeSaveCardSection';

type Props = {
  client: Client;
};

export default function PaymentsTab({ client }: Props) {
  return <StripeSaveCardSection client={client} variant="payments" />;
}

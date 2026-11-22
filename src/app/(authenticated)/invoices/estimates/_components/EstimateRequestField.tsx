'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  NO_REQUEST,
  requestOptionLabel
} from '@/app/(authenticated)/shopping-list/overview/_components/requestOptionLabel';
import SelectField from '@/components/SelectField';
import useGetClient from '@/hooks/react-query/clients/getClient';
import { Request } from '@/ts/interfaces/Request';

type Props = {
  clientId: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

export function clientRequests(pools: { requests?: Request[] }[] | undefined) {
  const unique = new Map<string, Request>();
  pools?.forEach((pool) => {
    pool.requests?.forEach((request) => unique.set(request.id, request));
  });
  return Array.from(unique.values());
}

export function EstimateRequestField({ clientId, disabled, onValueChange }: Props) {
  const t = useTranslations('invoices');
  const { data: client, isLoading } = useGetClient(clientId);

  const options = useMemo(() => {
    const requests = clientRequests(client?.pools);
    return [
      { key: NO_REQUEST, value: NO_REQUEST, name: t('placeholders.noRequest') },
      ...requests.map((request) => ({
        key: request.id,
        value: request.id,
        name: requestOptionLabel(request)
      }))
    ];
  }, [client?.pools, t]);

  return (
    <SelectField
      name="requestId"
      label={t('fields.requestOptional')}
      options={options}
      placeholder={
        !clientId
          ? t('placeholders.selectClientFirst')
          : isLoading
            ? t('placeholders.loadingRequests')
            : t('placeholders.selectRequest')
      }
      disabled={!clientId || isLoading || disabled}
      onValueChange={onValueChange}
    />
  );
}

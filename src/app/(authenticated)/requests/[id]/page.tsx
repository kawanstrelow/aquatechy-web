'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';

import { Surface } from '@/components/design';
import useGetRequest, { RequestNotFoundError } from '@/hooks/react-query/requests/getRequest';

import { RequestDetail } from './RequestDetail';

type Props = {
  params: {
    id: string;
  };
};

export default function RequestDetailsPage({ params: { id } }: Props) {
  const t = useTranslations('requests');
  const { data, isLoading, isError, error } = useGetRequest(id);

  if (isError) {
    if (error instanceof RequestNotFoundError) {
      notFound();
    }

    const errorMessage = error instanceof Error ? error.message : '';
    return (
      <Surface title={t('loadError')}>
        <p className="text-sm text-ink-muted">{errorMessage || t('loadError')}</p>
      </Surface>
    );
  }

  if (isLoading || !data) {
    return (
      <Surface>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </Surface>
    );
  }

  return <RequestDetail request={data} />;
}

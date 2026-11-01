'use client';

import { useTranslations } from 'next-intl';
import { MessageLogList } from '@/components/messaging/MessageLogList';
import { useGetClientMessages } from '@/hooks/react-query/clients/useGetClientMessages';

type Props = {
  clientId: string;
};

export default function MessagesTab({ clientId }: Props) {
  const t = useTranslations('clients');
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetClientMessages(clientId);
  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{t('messages.title')}</h3>
        <p className="text-sm text-gray-500">{t('messages.description')}</p>
      </div>
      <MessageLogList
        showChannel
        messages={messages.map((message) => ({
          id: message.id,
          createdAt: message.createdAt,
          channel: message.channel,
          typeLabel: message.typeLabel,
          recipient: message.recipient,
          status: message.status
        }))}
        isLoading={isLoading}
        isError={isError}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={Boolean(hasNextPage)}
        onLoadMore={() => fetchNextPage()}
        emptyDescription={t('messages.empty')}
        errorDescription={t('messages.error')}
      />
    </div>
  );
}

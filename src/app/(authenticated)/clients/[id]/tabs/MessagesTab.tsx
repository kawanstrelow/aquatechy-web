'use client';

import { MessageLogList } from '@/components/messaging/MessageLogList';
import { useGetClientMessages } from '@/hooks/react-query/clients/useGetClientMessages';

type Props = {
  clientId: string;
};

export default function MessagesTab({ clientId }: Props) {
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetClientMessages(clientId);
  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
        <p className="text-sm text-gray-500">Emails and texts sent to this client.</p>
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
        emptyDescription="No messages yet for this client."
        errorDescription="You may not have permission to view this client's messages."
      />
    </div>
  );
}

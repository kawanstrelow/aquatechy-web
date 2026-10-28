import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { messagingChannelLabel } from './labels';
import { MessageStatusBadge } from './MessageStatusBadge';

export type MessageLogRow = {
  id: string;
  createdAt: string;
  typeLabel: string;
  recipient: string;
  status: string;
  channel?: string;
  clientId?: string;
  clientName?: string;
};

type Props = {
  messages: MessageLogRow[];
  showChannel?: boolean;
  showClient?: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  emptyDescription: string;
  errorDescription: string;
};

function formatMessageDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'MMM d, yyyy, h:mm a');
}

function InlineSpinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-sky-500" />;
}

export function MessageLogList({
  messages,
  showChannel = false,
  showClient = false,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  emptyDescription,
  errorDescription
}: Props) {
  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-12">
        <InlineSpinner />
      </div>
    );
  }

  if (isError && messages.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2 py-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900">Unable to load messages</h3>
        <p className="text-sm text-gray-500">{errorDescription}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12">
        <p className="text-sm text-gray-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2 font-medium">Date</th>
              {showClient ? <th className="px-3 py-2 font-medium">Client</th> : null}
              {showChannel ? <th className="px-3 py-2 font-medium">Channel</th> : null}
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Recipient</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message.id} className="border-b border-gray-100">
                <td className="whitespace-nowrap px-3 py-3 text-gray-700">{formatMessageDate(message.createdAt)}</td>
                {showClient ? (
                  <td className="px-3 py-3">
                    {message.clientId ? (
                      <Link href={`/clients/${message.clientId}`} className="font-medium text-sky-700 hover:underline">
                        {message.clientName || 'Client'}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{message.clientName || 'Client'}</span>
                    )}
                  </td>
                ) : null}
                {showChannel ? (
                  <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                    {messagingChannelLabel(message.channel ?? '')}
                  </td>
                ) : null}
                <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">{message.typeLabel}</td>
                <td className="max-w-[220px] break-all px-3 py-3 text-gray-700">{message.recipient}</td>
                <td className="px-3 py-3">
                  <MessageStatusBadge status={message.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isError ? <p className="text-sm text-red-600">Could not load more messages.</p> : null}
      {hasNextPage ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

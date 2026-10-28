'use client';

import { useState } from 'react';

import { MessageLogList } from '@/components/messaging/MessageLogList';
import { MessagingUsageMeters } from '@/components/messaging/MessagingUsageMeters';
import { useGetCompanyMessagingLog } from '@/hooks/react-query/companies/useGetCompanyMessagingLog';
import { useGetCompanyMessagingUsage } from '@/hooks/react-query/companies/useGetCompanyMessagingUsage';
import { MessagingChannel } from '@/ts/interfaces/Messaging';

type Props = {
  companyId: string;
};

function InlineSpinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-sky-500" />;
}

export function CompanyMessagesTab({ companyId }: Props) {
  const [channel, setChannel] = useState<MessagingChannel>('email');
  const usageQuery = useGetCompanyMessagingUsage(companyId);
  const logQuery = useGetCompanyMessagingLog(companyId, channel);
  const messages = logQuery.data?.pages.flatMap((page) => page.messages) ?? [];

  return (
    <div className="flex w-full flex-col gap-6">
      {usageQuery.isLoading ? (
        <div className="flex w-full justify-center py-8">
          <InlineSpinner />
        </div>
      ) : usageQuery.isError || !usageQuery.data ? (
        <div className="flex w-full flex-col items-center justify-center gap-2 py-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Unable to load messaging allowance</h3>
          <p className="text-sm text-gray-500">You may not have permission to view this company&apos;s usage.</p>
        </div>
      ) : (
        <MessagingUsageMeters usage={usageQuery.data} />
      )}

      <div className="flex w-full flex-col gap-4">
        <div className="inline-flex w-fit rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`rounded-md px-3 py-1.5 text-sm ${
              channel === 'email' ? 'bg-gray-800 font-semibold text-white' : 'text-gray-500'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`rounded-md px-3 py-1.5 text-sm ${
              channel === 'sms' ? 'bg-gray-800 font-semibold text-white' : 'text-gray-500'
            }`}
          >
            Text
          </button>
        </div>
        <MessageLogList
          showClient
          messages={messages.map((message) => ({
            id: message.id,
            createdAt: message.createdAt,
            typeLabel: message.typeLabel,
            recipient: message.recipient,
            status: message.status,
            clientId: message.clientId,
            clientName: [message.clientFirstName, message.clientLastName].filter(Boolean).join(' ')
          }))}
          isLoading={logQuery.isLoading}
          isError={logQuery.isError}
          isFetchingNextPage={logQuery.isFetchingNextPage}
          hasNextPage={Boolean(logQuery.hasNextPage)}
          onLoadMore={() => logQuery.fetchNextPage()}
          emptyDescription={channel === 'email' ? 'No emails in this log yet.' : 'No texts in this log yet.'}
          errorDescription="You may not have permission to view this company's messages."
        />
      </div>
    </div>
  );
}

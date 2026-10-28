import { useInfiniteQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { CompanyMessagingLogItem, MessagingChannel, MessagingPage } from '@/ts/interfaces/Messaging';

const COMPANY_MESSAGING_LOG_LIMIT = 50;

export const companyMessagingLogQueryKey = (companyId: string, channel: MessagingChannel) =>
  ['company-messaging-log', companyId, channel] as const;

export function useGetCompanyMessagingLog(companyId: string, channel: MessagingChannel) {
  return useInfiniteQuery({
    queryKey: companyMessagingLogQueryKey(companyId, channel),
    enabled: !!companyId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const response = await clientAxios.get<MessagingPage<CompanyMessagingLogItem>>(
        `/companies/${companyId}/messaging-log`,
        {
          params: {
            channel,
            limit: COMPANY_MESSAGING_LOG_LIMIT,
            ...(pageParam ? { cursor: pageParam } : {})
          }
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
}

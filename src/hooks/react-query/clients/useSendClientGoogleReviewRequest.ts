import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { companyMessagingUsageQueryKey } from '@/hooks/react-query/companies/useGetCompanyMessagingUsage';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';

import { clientMessagesQueryKey } from './useGetClientMessages';

type SendError = {
  message?:
    | string
    | Array<{
        message?: string;
      }>;
  channel?: string;
  issues?: Array<{
    message?: string;
  }>;
};

type SendResponse = {
  queued: boolean;
};

function extractErrorMessage(error: AxiosError<SendError>): string {
  const data = error.response?.data;
  if (!data) {
    return translateMessage('clients.profile.googleReviewError', 'Could not send the review request');
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.map((issue) => issue.message || String(issue)).join(', ');
  }

  if (data.issues && data.issues.length > 0) {
    return data.issues.map((issue) => issue.message || String(issue)).join(', ');
  }

  return translateMessage('clients.profile.googleReviewError', 'Could not send the review request');
}

export function useSendClientGoogleReviewRequest(clientId: string, companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await clientAxios.post<SendResponse>(`/clients/${clientId}/google-review-requests/send`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
      queryClient.invalidateQueries({ queryKey: clientMessagesQueryKey(clientId) });
      toast({
        title: data.queued
          ? translateMessage('clients.profile.googleReviewQueued', 'Review request queued.')
          : translateMessage(
              'clients.profile.googleReviewNotQueued',
              'Review request was not queued. Nothing was sent.'
            ),
        variant: data.queued ? 'success' : 'info'
      });
    },
    onError: (error: AxiosError<SendError>) => {
      toast({
        title: translateMessage('clients.profile.googleReviewError', 'Could not send the review request'),
        description: extractErrorMessage(error),
        variant: 'error'
      });

      if (error.response?.status === 403 && error.response.data?.channel) {
        queryClient.invalidateQueries({ queryKey: companyMessagingUsageQueryKey(companyId) });
      }
    }
  });
}

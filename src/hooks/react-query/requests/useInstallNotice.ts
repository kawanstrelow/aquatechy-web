import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';
import { InstallNoticeDraft } from '@/ts/interfaces/Request';

type ErrorResponse = {
  message?: string | string[];
  channel?: string;
  used?: number;
  limit?: number;
};

export type SendInstallNoticeInput = {
  subject?: string;
  body?: string;
  photoUrls?: string[];
};

function getErrorMessage(error: AxiosError<ErrorResponse>): string {
  const data = error.response?.data;
  const message = data?.message;
  const text = Array.isArray(message) ? message.join(', ') : message;
  if (data?.channel === 'email' && data.used != null && data.limit != null) {
    return text || translateMessage('requests.emailLimitReached', 'Monthly email limit reached.');
  }
  return text || translateMessage('toasts.anErrorOccurred', 'An error occurred');
}

export function useGetInstallNotice(requestId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['requests', requestId, 'install-notice'],
    queryFn: async () => {
      const response = await clientAxios.get<InstallNoticeDraft>(`/requests/${requestId}/install-notice`);
      return response.data;
    },
    enabled: enabled && !!requestId
  });
}

export function useSendInstallNotice(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendInstallNoticeInput) => {
      const response = await clientAxios.post(`/requests/${requestId}/install-notice`, input);
      return response.data as { message: string; requestId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-messaging-usage'] });
      toast({
        title: translateMessage('requests.emailSent', 'Email sent successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('requests.emailSendError', 'Could not send the email'),
        description: getErrorMessage(error),
        variant: 'error'
      });
    }
  });
}

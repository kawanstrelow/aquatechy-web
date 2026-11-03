import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { companyMessagingUsageQueryKey } from '@/hooks/react-query/companies/useGetCompanyMessagingUsage';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';

import { clientMessagesQueryKey } from './useGetClientMessages';

type WelcomeEmailError = {
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

type WelcomeEmailResponse = {
  message?: string;
};

function extractErrorMessage(error: AxiosError<WelcomeEmailError>): string {
  const data = error.response?.data;
  if (!data) {
    return translateMessage('clients.profile.welcomeEmailError', 'Could not send the welcome email');
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

  return translateMessage('clients.profile.welcomeEmailError', 'Could not send the welcome email');
}

export function useSendClientWelcomeEmail(clientId: string, companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await clientAxios.post<WelcomeEmailResponse>(`/clients/${clientId}/welcome-email`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientMessagesQueryKey(clientId) });
      toast({
        title: data.message?.trim() || translateMessage('clients.profile.welcomeEmailQueued', 'Welcome email queued.'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<WelcomeEmailError>) => {
      toast({
        title: translateMessage('clients.profile.welcomeEmailError', 'Could not send the welcome email'),
        description: extractErrorMessage(error),
        variant: 'error'
      });

      if (error.response?.status === 403 && error.response.data?.channel === 'email') {
        queryClient.invalidateQueries({ queryKey: companyMessagingUsageQueryKey(companyId) });
      }
    }
  });
}

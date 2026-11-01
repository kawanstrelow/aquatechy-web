import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type AccountExistsResponse = {
  exists: boolean;
};

type AccountExistsError = {
  message?: string | string[];
};

function errorDescription(message?: string | string[]) {
  if (Array.isArray(message)) {
    const text = message.filter(Boolean).join(' ');
    if (text) return text;
  }
  if (typeof message === 'string' && message.length > 0) return message;
  return translateMessage('toasts.internalServerError', 'Internal server error');
}

export const useCheckAccountExists = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { email: string; companyId: string }) => {
      const response = await clientAxios.post<AccountExistsResponse>('/companies/account-exists', data);
      return response.data;
    },
    onError: (error: AxiosError<AccountExistsError>) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.couldNotCheckThisEmail', 'Could not check this email.'),
        description: errorDescription(error.response?.data?.message)
      });
    }
  });
};

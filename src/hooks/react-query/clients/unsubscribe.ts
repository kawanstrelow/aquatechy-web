import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

interface UnsubscribeParams {
  token: string;
}

export const useUnsubscribeClient = () => {
  const { toast } = useToast();

  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: async (params: UnsubscribeParams) => {
      // TODO: Update API endpoint and request body based on API guide
      return await clientAxios.post('/clients/unsubscribe', params);
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 5000,
        variant: 'error',
        title: translateMessage('toasts.errorUnsubscribing', 'Error unsubscribing'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage(
              'toasts.anErrorOccurredPleaseTryAgainLaterOrContactSupport',
              'An error occurred. Please try again later or contact support.'
            )
      });
    }
  });

  return { mutate, isPending, isSuccess, isError };
};

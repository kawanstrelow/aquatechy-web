import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CancelWithRefundResponse } from '@/ts/interfaces/Subscription';

import { translateMessage } from '@/i18n/runtime';

export default function useCancelWithRefund() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await clientAxios.post<CancelWithRefundResponse>('/subscriptions/cancel-with-refund');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      toast({
        title: translateMessage('toasts.refundRequestSubmitted', 'Refund request submitted'),
        description: data.message
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.refundRequestNotEligible', 'Refund request not eligible'),
        description:
          error.response?.data?.message ??
          translateMessage('toasts.pleaseContactSupportIfYouNeedHelp', 'Please contact support if you need help.')
      });
    }
  });
}

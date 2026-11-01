import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { SendInvoiceReminderRequest, SendInvoiceReminderResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useSendInvoiceReminder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (data: SendInvoiceReminderRequest): Promise<SendInvoiceReminderResponse> => {
      const response = await clientAxios.post<SendInvoiceReminderResponse>('/invoices/send-reminder', data);
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate invoices list queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Invalidate the specific invoice query to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['invoice', response.invoiceId] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.invoiceReminderSentSuccessfully', 'Invoice reminder sent successfully'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string | string[];
      }>
    ) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || translateMessage('toasts.failedToSendInvoiceReminder', 'Failed to send invoice reminder');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorSendingInvoiceReminder', 'Error sending invoice reminder'),
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};

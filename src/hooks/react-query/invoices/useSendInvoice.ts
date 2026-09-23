import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { SendInvoiceRequest, SendInvoiceResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (data: SendInvoiceRequest): Promise<SendInvoiceResponse> => {
      const response = await clientAxios.post<SendInvoiceResponse>('/invoices/send-invoice', data);
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate invoices list queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Invalidate the specific invoice query to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['invoice', response.invoiceId] });

      toast({
        duration: 2000,
        title: 'Invoice sent successfully',
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
        : errorMessage || 'Failed to send invoice';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error sending invoice',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { UpdateInvoiceStatusRequest, UpdateInvoiceStatusResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (data: UpdateInvoiceStatusRequest): Promise<UpdateInvoiceStatusResponse> => {
      const body: UpdateInvoiceStatusRequest = {
        invoiceId: data.invoiceId,
        status: data.status
      };
      if (data.status === 'paid' && data.paymentDate) {
        body.paymentDate = data.paymentDate;
      }
      const response = await clientAxios.patch<UpdateInvoiceStatusResponse>('/invoices/status', body);
      return response.data;
    },
    onSuccess: (response, variables) => {
      // Invalidate invoices list queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Invalidate the specific invoice query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });

      const statusLabel = variables.status.charAt(0).toUpperCase() + variables.status.slice(1);
      toast({
        duration: 2000,
        title: `Invoice status updated to ${statusLabel}`,
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
        : errorMessage || 'Failed to update invoice status';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error updating invoice status',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};


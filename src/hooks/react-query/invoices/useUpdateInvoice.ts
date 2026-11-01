import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { UpdateInvoiceRequest, UpdateInvoiceResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (data: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse> => {
      // Ensure all numeric fields are properly converted to numbers
      const payload: UpdateInvoiceRequest = {
        ...data,
        subtotal: data.subtotal !== undefined ? Number(data.subtotal) : undefined,
        discountRate: data.discountRate !== undefined ? Number(data.discountRate) : undefined,
        lineItems: data.lineItems?.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: item.taxRate !== undefined ? Number(item.taxRate) ?? 0 : undefined
        }))
      };

      const response = await clientAxios.patch<UpdateInvoiceResponse>('/invoices/', payload);
      return response.data;
    },
    onSuccess: (response, variables) => {
      // Invalidate invoices list queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Invalidate the specific invoice query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.invoiceUpdatedSuccessfully', 'Invoice updated successfully'),
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
        : errorMessage || translateMessage('toasts.failedToUpdateInvoice', 'Failed to update invoice');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingInvoice', 'Error updating invoice'),
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};

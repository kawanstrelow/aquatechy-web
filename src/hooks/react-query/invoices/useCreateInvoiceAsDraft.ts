import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { CreateInvoiceAsDraftRequest, CreateInvoiceAsDraftResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useCreateInvoiceAsDraft = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: CreateInvoiceAsDraftRequest): Promise<CreateInvoiceAsDraftResponse> => {
      // Ensure all numeric fields are properly converted to numbers
      const payload: CreateInvoiceAsDraftRequest = {
        ...data,
        subtotal: Number(data.subtotal) || 0,
        discountRate: data.discountRate !== undefined ? Number(data.discountRate) : undefined,
        lineItems: data.lineItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: item.taxRate !== undefined ? Number(item.taxRate) ?? 0 : undefined
        }))
      };

      const response = await clientAxios.post<CreateInvoiceAsDraftResponse>('/invoices/draft', payload);
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate invoices list queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Optionally, set the created invoice in cache
      queryClient.setQueryData(['invoices', response.invoice.id], response.invoice);

      toast({
        duration: 2000,
        title: translateMessage('toasts.invoiceCreatedSuccessfully', 'Invoice created successfully'),
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
        : errorMessage || translateMessage('toasts.failedToCreateInvoice', 'Failed to create invoice');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCreatingInvoice', 'Error creating invoice'),
        description: message
      });
    }
  });

  return { mutate, isPending, isSuccess };
};

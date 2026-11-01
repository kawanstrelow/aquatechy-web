import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { CreateInvoiceAndSendEmailRequest, CreateInvoiceAndSendEmailResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useCreateInvoiceAndSendEmail = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: CreateInvoiceAndSendEmailRequest): Promise<CreateInvoiceAndSendEmailResponse> => {
      // Ensure all numeric fields are properly converted to numbers
      const payload: CreateInvoiceAndSendEmailRequest = {
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

      const response = await clientAxios.post<CreateInvoiceAndSendEmailResponse>('/invoices/create-and-send', payload);
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate invoices list queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Optionally, set the created invoice in cache
      queryClient.setQueryData(['invoices', response.invoice.id], response.invoice);

      toast({
        duration: 2000,
        title: translateMessage('toasts.invoiceCreatedAndSentSuccessfully', 'Invoice created and sent successfully'),
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
        : errorMessage || translateMessage('toasts.failedToCreateAndSendInvoice', 'Failed to create and send invoice');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCreatingAndSendingInvoice', 'Error creating and sending invoice'),
        description: message
      });
    }
  });

  return { mutate, isPending, isSuccess };
};

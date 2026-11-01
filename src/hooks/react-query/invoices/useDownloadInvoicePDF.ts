import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface DownloadInvoicePDFParams {
  invoiceId: string;
}

export const useDownloadInvoicePDF = () => {
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async ({ invoiceId }: DownloadInvoicePDFParams): Promise<void> => {
      const response = await clientAxios.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf'
        }
      });

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoice-${invoiceId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        duration: 2000,
        title: translateMessage('toasts.invoicePdfDownloadedSuccessfully', 'Invoice PDF downloaded successfully'),
        variant: 'success'
      });
    },
    onError: async (error: AxiosError) => {
      let errorMessage = translateMessage('toasts.failedToDownloadInvoicePdf', 'Failed to download invoice PDF');

      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message || errorMessage;
        } catch {
          // If parsing fails, use default message
          errorMessage =
            error.response?.status === 403
              ? translateMessage(
                  'toasts.permissionDeniedYouDoNotHaveAccessToDownloadThisInvoice',
                  'Permission denied. You do not have access to download this invoice.'
                )
              : error.response?.status === 404
                ? translateMessage('toasts.invoiceNotFound', 'Invoice not found.')
                : errorMessage;
        }
      } else {
        // Handle regular JSON error responses
        const errorData = error.response?.data as { message?: string | string[] };
        if (errorData?.message) {
          errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
        }
      }

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorDownloadingInvoicePdf', 'Error downloading invoice PDF'),
        description: errorMessage
      });
    }
  });

  return { mutate, mutateAsync, isPending };
};

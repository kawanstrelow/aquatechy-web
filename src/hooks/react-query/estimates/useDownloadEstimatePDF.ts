import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';

interface DownloadEstimatePDFParams {
  estimateId: string;
}

export const useDownloadEstimatePDF = () => {
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async ({ estimateId }: DownloadEstimatePDFParams): Promise<void> => {
      const response = await clientAxios.get(`/estimates/${estimateId}/pdf`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf'
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `estimate-${estimateId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        duration: 2000,
        title: 'Estimate PDF downloaded successfully',
        variant: 'success'
      });
    },
    onError: async (error: AxiosError) => {
      let errorMessage = 'Failed to download estimate PDF';

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message || errorMessage;
        } catch {
          errorMessage =
            error.response?.status === 403
              ? 'Permission denied. You do not have access to download this estimate.'
              : error.response?.status === 404
                ? 'Estimate not found.'
                : errorMessage;
        }
      } else {
        const errorData = error.response?.data as { message?: string | string[] };
        if (errorData?.message) {
          errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
        }
      }

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error downloading estimate PDF',
        description: errorMessage
      });
    }
  });

  return { mutate, mutateAsync, isPending };
};

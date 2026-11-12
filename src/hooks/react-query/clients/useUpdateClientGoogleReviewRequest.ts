import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';

type ErrorResponse = {
  message?:
    | string
    | Array<{
        message?: string;
      }>;
  issues?: Array<{
    message?: string;
  }>;
};

export type ClientGoogleReviewRequestUpdate = {
  enabled?: boolean | null;
  reviewed?: boolean;
};

function extractErrorMessage(error: AxiosError<ErrorResponse>): string {
  const data = error.response?.data;
  if (!data) {
    return translateMessage('clients.googleReview.saveError', 'Could not update Google review settings');
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.map((issue) => issue.message || String(issue)).join(', ');
  }

  if (data.issues && data.issues.length > 0) {
    return data.issues.map((issue) => issue.message || String(issue)).join(', ');
  }

  return translateMessage('clients.googleReview.saveError', 'Could not update Google review settings');
}

export function useUpdateClientGoogleReviewRequest(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: ClientGoogleReviewRequestUpdate) => {
      await clientAxios.patch(`/clients/${clientId}/google-review-requests`, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
      toast({
        title: translateMessage('clients.googleReview.saved', 'Google review setting saved'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('clients.googleReview.saveError', 'Could not update Google review settings'),
        description: extractErrorMessage(error),
        variant: 'error'
      });
    }
  });
}

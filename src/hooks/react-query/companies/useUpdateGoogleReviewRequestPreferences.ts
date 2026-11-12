import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';
import { GoogleReviewRequestPreferences } from '@/ts/interfaces/Company';

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

export type GoogleReviewRequestPreferencesUpdate = Partial<GoogleReviewRequestPreferences>;

function extractErrorMessage(error: AxiosError<ErrorResponse>): string {
  const data = error.response?.data;
  if (!data) {
    return translateMessage('settings.emailPrefs.googleReviews.saveError', 'Could not save review request settings');
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

  return translateMessage('settings.emailPrefs.googleReviews.saveError', 'Could not save review request settings');
}

export function useUpdateGoogleReviewRequestPreferences(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: GoogleReviewRequestPreferencesUpdate) => {
      await clientAxios.patch(`/companies/${companyId}/google-review-requests`, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
      toast({
        title: translateMessage('settings.emailPrefs.googleReviews.saved', 'Review request settings saved'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage(
          'settings.emailPrefs.googleReviews.saveError',
          'Could not save review request settings'
        ),
        description: extractErrorMessage(error),
        variant: 'error'
      });
    }
  });
}

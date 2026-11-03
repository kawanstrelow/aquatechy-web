import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';
import { WelcomeEmailPreferences } from '@/ts/interfaces/Company';

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

function extractErrorMessage(error: AxiosError<ErrorResponse>): string {
  const data = error.response?.data;
  if (!data) {
    return translateMessage('settings.emailPrefs.welcome.saveError', 'Could not save the welcome email');
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

  return translateMessage('settings.emailPrefs.welcome.saveError', 'Could not save the welcome email');
}

export function useUpdateWelcomeEmailPreferences(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: WelcomeEmailPreferences) => {
      await clientAxios.patch(`/companies/${companyId}/welcome-email`, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
      toast({
        title: translateMessage('settings.emailPrefs.welcome.saved', 'Welcome email saved'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('settings.emailPrefs.welcome.saveError', 'Could not save the welcome email'),
        description: extractErrorMessage(error),
        variant: 'error'
      });
    }
  });
}

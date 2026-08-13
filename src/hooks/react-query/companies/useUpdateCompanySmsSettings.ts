import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CompanySmsSettingsPublic, UpdateCompanySmsSettingsBody } from '@/ts/interfaces/CompanySmsSettings';

import { companySmsSettingsQueryKey } from './useGetCompanySmsSettings';

type ErrorResponse = {
  message?:
    | string
    | Array<{
        code: string;
        message: string;
        path?: (string | number)[];
      }>;
  issues?: Array<{
    code: string;
    message: string;
    path?: (string | number)[];
  }>;
};

function extractErrorMessage(error: AxiosError<ErrorResponse>): string {
  const data = error.response?.data;
  if (!data) {
    return 'An error occurred';
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.map((issue) => issue.message || String(issue)).join(', ');
  }

  if (data.issues && data.issues.length > 0) {
    return data.issues.map((issue) => issue.message).join(', ');
  }

  return 'An error occurred';
}

export function useUpdateCompanySmsSettings(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateCompanySmsSettingsBody) => {
      const response = await clientAxios.put<CompanySmsSettingsPublic>(`/companies/${companyId}/sms-settings`, body);
      return response.data;
    },
    onSuccess: (smsSettings, variables) => {
      queryClient.setQueryData(companySmsSettingsQueryKey(companyId), smsSettings);

      toast({
        title:
          variables.provider === 'aquatechy'
            ? 'Service-report SMS will use Aquatechy’s number'
            : 'SMS provider connected. A test message was sent.',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: 'Error updating SMS settings',
        description: extractErrorMessage(error),
        variant: 'error'
      });
    }
  });
}

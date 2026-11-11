import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

import { useToast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';
import { ServiceStatus } from '@/ts/interfaces/Service';

export type ServiceStatusAction = ServiceStatus;

export type ServiceStatusEmail = 'not_requested' | 'queued' | 'no_email' | 'limit_reached' | 'not_sent';

export type ServiceStatusOutcome = 'updated' | 'unchanged' | 'rejected';

export type ServiceStatusRejectReason = 'not_found' | 'forbidden';

export interface ServiceStatusResult {
  id: string;
  outcome: ServiceStatusOutcome;
  status?: ServiceStatusAction;
  email?: ServiceStatusEmail;
  reason?: ServiceStatusRejectReason;
}

export interface ServiceStatusResponse {
  results: ServiceStatusResult[];
}

export interface UpdateServiceStatusInput {
  serviceIds: string[];
  status: ServiceStatusAction;
  sendEmail: boolean;
}

function statusErrorDescription(error: AxiosError<{ message?: string | string[] }>) {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string' && message) return message;
  return translateMessage('routes.errors.internalServerError', 'Internal server error');
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  return useMutation({
    mutationFn: async (body: UpdateServiceStatusInput) => {
      const response = await clientAxios.post<ServiceStatusResponse>('/services/status', body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      toast({
        duration: 4000,
        variant: 'error',
        title: translateMessage('routes.statusUpdateFailed', 'Could not update service status'),
        description: statusErrorDescription(error)
      });
    }
  });
}

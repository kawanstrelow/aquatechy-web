import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

interface ResendServiceSmsRequest {
  serviceId: string;
}

interface ResendServiceSmsResponse {
  message: string;
}

const resendServiceSms = async (data: ResendServiceSmsRequest): Promise<ResendServiceSmsResponse> => {
  const response = await clientAxios.post('/services/resend-sms', data);
  return response.data;
};

export const useResendServiceSms = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: resendServiceSms,
    onSuccess: () => {
      toast({
        duration: 5000,
        title: 'SMS resent successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 403 && message === 'Subscription not allowed.') {
        toast({
          duration: 5000,
          title: 'Subscription not allowed',
          variant: 'error',
          description: 'Please upgrade your subscription to resend SMS.'
        });
        return;
      }

      if (status === 400 && message === 'Client has no phone number.') {
        toast({
          duration: 5000,
          title: 'No phone number on file',
          variant: 'error',
          description: 'Add a phone number to resend SMS.'
        });
        return;
      }

      if (status === 404) {
        toast({
          duration: 5000,
          title: 'Report not available',
          variant: 'error',
          description: message ?? 'Service not found or not completed.'
        });
        return;
      }

      toast({
        duration: 5000,
        title: 'Error resending service SMS',
        variant: 'error',
        description: message ?? 'Internal server error'
      });
    }
  });
};

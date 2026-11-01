import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { COMPANY_PLAN_DENIED_DESCRIPTION, isCompanyPlanDeniedMessage } from '@/utils/subscriptionDenied';

import { translateMessage } from '@/i18n/runtime';

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
        title: translateMessage('toasts.smsResentSuccessfully', 'SMS resent successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 403 && isCompanyPlanDeniedMessage(message)) {
        toast({
          duration: 5000,
          title: translateMessage('toasts.planRequired', 'Plan required'),
          variant: 'error',
          description: translateMessage(
            'toasts.thisCompanyIsNotOnThePlanRequiredForThisAction',
            COMPANY_PLAN_DENIED_DESCRIPTION
          )
        });
        return;
      }

      if (status === 400 && message === 'Client has no phone number.') {
        toast({
          duration: 5000,
          title: translateMessage('toasts.noPhoneNumberOnFile', 'No phone number on file'),
          variant: 'error',
          description: translateMessage('toasts.addAPhoneNumberToResendSms', 'Add a phone number to resend SMS.')
        });
        return;
      }

      if (status === 404) {
        toast({
          duration: 5000,
          title: translateMessage('toasts.reportNotAvailable', 'Report not available'),
          variant: 'error',
          description:
            message ?? translateMessage('toasts.serviceNotFoundOrNotCompleted', 'Service not found or not completed.')
        });
        return;
      }

      toast({
        duration: 5000,
        title: translateMessage('toasts.errorResendingServiceSms', 'Error resending service SMS'),
        variant: 'error',
        description: message ?? translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
};

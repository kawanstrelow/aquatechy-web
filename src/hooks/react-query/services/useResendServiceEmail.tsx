import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { COMPANY_PLAN_DENIED_DESCRIPTION, isCompanyPlanDeniedMessage } from '@/utils/subscriptionDenied';

import { translateMessage } from '@/i18n/runtime';

interface ResendServiceEmailRequest {
  serviceId: string;
}

interface ResendServiceEmailResponse {
  success: boolean;
  message: string;
}

const resendServiceEmail = async (data: ResendServiceEmailRequest): Promise<ResendServiceEmailResponse> => {
  const response = await clientAxios.post('/services/resend-email', data);
  return response.data;
};

export const useResendServiceEmail = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: resendServiceEmail,
    onSuccess: () => {
      toast({
        duration: 5000,
        title: translateMessage('toasts.emailResentSuccessfully', 'Email resent successfully'),
        variant: 'success'
      });
      // You can add success handling here if needed
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      if (error.response?.status === 403 && isCompanyPlanDeniedMessage(error.response?.data?.message)) {
        toast({
          duration: 5000,
          title: translateMessage('toasts.planRequired', 'Plan required'),
          variant: 'error',
          description: translateMessage(
            'toasts.thisCompanyIsNotOnThePlanRequiredForThisAction',
            COMPANY_PLAN_DENIED_DESCRIPTION
          )
        });
      } else {
        toast({
          duration: 5000,
          title: translateMessage('toasts.errorResendingServiceEmail', 'Error resending service email'),
          variant: 'error',
          description: error.response?.data?.message
            ? error.response.data.message
            : translateMessage('toasts.internalServerError', 'Internal server error')
        });
      }
    }
  });
};

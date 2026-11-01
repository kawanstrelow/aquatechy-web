import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { UpdateCompanyLogo } from '@/ts/interfaces/Company';
import { createFormData } from '@/utils/formUtils';

import { translateMessage } from '@/i18n/runtime';

export const useEditCompanyLogo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: handleSubmit, isPending } = useMutation({
    mutationFn: async (data: UpdateCompanyLogo) =>
      await clientAxios.patch(`/companies/${data.companyId}/logo`, createFormData(data), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.companyId] });

      toast({
        duration: 5000,
        title: translateMessage('toasts.informationUpdatedWithSuccess', 'Information updated with success.'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 5000,
        variant: 'error',
        title: translateMessage('toasts.errorEditingCompany', 'Error editing company.'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });

  return { handleSubmit, isPending };
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CreateCompany } from '@/ts/interfaces/Company';
import { useUserStore } from '@/store/user';
import { useRouter } from 'next/navigation';

function buildCreateCompanyFormData(data: CreateCompany): FormData {
  const formData = new FormData();

  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('address', data.address);
  if (data.addressLine2) {
    formData.append('addressLine2', data.addressLine2);
  }
  formData.append('city', data.city);
  formData.append('state', data.state);
  formData.append('zip', data.zip);

  if (data.preferences !== undefined) {
    formData.append('preferences', JSON.stringify(data.preferences));
  }

  if (data.logo) {
    formData.append('logo', data.logo);
  }

  return formData;
}

export const useCreateCompany = (options?: { skipRedirect?: boolean }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: CreateCompany) =>
      await clientAxios.post('/companies', buildCreateCompanyFormData(data), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),

    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: 'Error creating company',
        description: error.response?.data?.message ? error.response.data.message : 'Internal server error'
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companyMembers', user.id] });
      toast({
        variant: 'success',
        duration: 5000,
        title: 'Company created successfully'
      });
      if (!options?.skipRedirect) {
        router.push('/settings/companies');
      }
    }
  });
  return { mutate, isPending, isSuccess };
};

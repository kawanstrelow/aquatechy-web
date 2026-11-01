import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ companyId }: { companyId: string }) =>
      await clientAxios.delete(`/companies`, { data: { companyId } }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.companyId] });
      toast({
        duration: 5000,
        title: translateMessage('toasts.companyWasDeletedSuccessfully', 'Company was deleted successfully.'),
        variant: 'success'
      });
    },
    onError: () => {
      toast({
        duration: 5000,
        title: translateMessage('toasts.errorDeletingCompany', 'Error deleting company.'),
        variant: 'error'
      });
    }
  });
  return { mutate, isPending };
};

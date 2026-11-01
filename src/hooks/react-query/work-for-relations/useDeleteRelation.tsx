import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useDeleteRelation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ workRelationId }: { workRelationId: string }) =>
      await clientAxios.delete('/workrelations', {
        data: { workRelationId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.deletedRelationSuccessfully', 'Deleted relation successfully'),
        variant: 'success'
      });
    },
    onError: () => {
      toast({
        duration: 5000,
        title: translateMessage('toasts.errorDeletingRelation', 'Error deleting relation'),
        variant: 'error'
      });
    }
  });
  return { mutate, isPending };
};

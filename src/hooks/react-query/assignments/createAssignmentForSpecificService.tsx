import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { z } from 'zod';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

const createBodySchema = z.object({
  assignmentToId: z
    .string({
      required_error: 'assignmentToId is required.',
      invalid_type_error: 'assignmentToId must be a string.'
    })
    .trim()
    .min(1, { message: 'assignmentToId must be at least 1 character.' }),
  specificDate: z
    .string({
      required_error: 'specificDate is required.',
      invalid_type_error: 'specificDate must have the date format (in String).'
    })
    .trim()
    .min(1, {
      message: 'specificDate must have the date format (in String).'
    }),
  poolId: z
    .string({
      required_error: 'poolId is required.',
      invalid_type_error: 'poolId must be a string.'
    })
    .trim()
    .min(1, { message: 'poolId must be at least 1 character.' }),
  serviceTypeId: z
    .string({
      required_error: 'serviceTypeId is required.',
      invalid_type_error: 'serviceTypeId must be a string.'
    })
    .trim()
    .min(1, { message: 'serviceTypeId must be at least 1 character.' })
    .optional(),
  instructions: z.string().optional()
});

type CreateAssignmentForSpecificService = z.infer<typeof createBodySchema>;

export const useCreateAssignmentForSpecificService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateAssignmentForSpecificService) =>
      await clientAxios.post('/assignments/for-specific-service', data),

    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: translateMessage('toasts.errorCreatingAssignment', 'Error creating assignment'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'by-pool'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });
      toast({
        variant: 'success',
        duration: 2000,
        title: translateMessage('toasts.assignmentCreatedSuccessfully', 'Assignment created successfully')
      });
    }
  });

  return { mutate, isPending };
};

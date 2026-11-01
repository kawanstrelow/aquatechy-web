import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { z } from 'zod';

import { useToast } from '../../../components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { Service } from '@/ts/interfaces/Service';

import { translateMessage } from '@/i18n/runtime';

const updateServiceInstructionsSchema = z.object({
  serviceId: z
    .string({
      required_error: 'serviceId is required.',
      invalid_type_error: 'serviceId must be a string.'
    })
    .trim()
    .min(1, { message: 'serviceId must be at least 1 character.' }),
  instructions: z.string().optional()
});

type UpdateServiceInstructions = z.infer<typeof updateServiceInstructionsSchema>;

interface UpdateServiceInstructionsResponse {
  service: Service;
}

export const useUpdateServiceInstructions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<UpdateServiceInstructionsResponse, AxiosError, UpdateServiceInstructions>({
    mutationFn: async (data) => {
      // Validate the input data
      const validatedData = updateServiceInstructionsSchema.parse(data);

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('serviceId', validatedData.serviceId);

      // Handle instructions field
      if (validatedData.instructions !== undefined) {
        if (validatedData.instructions === null || validatedData.instructions === '') {
          formData.append('instructions', 'null');
        } else {
          formData.append('instructions', validatedData.instructions);
        }
      }

      const response = await clientAxios.patch('/services/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders-services'] });

      // Optionally update the specific service in cache
      queryClient.setQueryData(['service', data.service.id], data.service);

      toast({
        title: translateMessage('toasts.success', 'Success'),
        description: translateMessage(
          'toasts.serviceInstructionsUpdatedSuccessfully',
          'Service instructions updated successfully'
        ),
        variant: 'default'
      });
    },
    onError: (error) => {
      console.error('Error updating service instructions:', error);

      let errorMessage = translateMessage(
        'toasts.failedToUpdateServiceInstructionsPleaseTryAgain',
        'Failed to update service instructions. Please try again.'
      );

      if (error.response?.status === 404) {
        errorMessage = translateMessage(
          'toasts.serviceNotFoundOrYouDontHavePermissionToUpdateIt',
          "Service not found or you don't have permission to update it."
        );
      } else if (error.response?.status === 401) {
        errorMessage = translateMessage('toasts.unauthorizedPleaseLogInAgain', 'Unauthorized. Please log in again.');
      } else if (error.response?.status === 400) {
        errorMessage = translateMessage(
          'toasts.invalidDataProvidedPleaseCheckYourInput',
          'Invalid data provided. Please check your input.'
        );
      } else if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        errorMessage = (error.response.data as { message: string }).message;
      }

      toast({
        title: translateMessage('toasts.error', 'Error'),
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });
};

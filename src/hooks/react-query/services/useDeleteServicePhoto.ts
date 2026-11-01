import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import Cookies from 'js-cookie';
import { Service, StructuredPhoto } from '@/ts/interfaces/Service';

import { translateMessage } from '@/i18n/runtime';

export const useDeleteServicePhoto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  return useMutation({
    mutationFn: async ({
      serviceId,
      photoToDelete,
      currentService
    }: {
      serviceId: string;
      photoToDelete: StructuredPhoto;
      currentService: Service;
    }) => {
      // Get current structured photos and remove the one to delete
      const currentPhotos = currentService.structuredPhotos || [];
      const updatedPhotos = currentPhotos.filter((photo) => photo.url !== photoToDelete.url);

      // Prepare form data for the update
      const formData = new FormData();
      formData.append('serviceId', serviceId);
      formData.append('structuredPhotosData', JSON.stringify(updatedPhotos));

      const response = await clientAxios.patch(`/services`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    },
    onSuccess: (updatedService, { serviceId }) => {
      // Update the service in cache
      queryClient.setQueryData(['service', serviceId], updatedService);

      // Update services query cache with the new service data
      queryClient.setQueriesData({ queryKey: ['services'], exact: false }, (oldData: any) => {
        if (!oldData?.services) return oldData;

        const updatedServices = oldData.services.map((service: any) =>
          service.id === serviceId ? updatedService.service : service
        );

        return {
          ...oldData,
          services: updatedServices
        };
      });

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['services', userId] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.photoDeletedSuccessfully', 'Photo deleted successfully'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      console.log('Error deleting photo:', error);
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorDeletingPhoto', 'Error deleting photo'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
};

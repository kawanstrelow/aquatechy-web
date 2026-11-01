import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import Cookies from 'js-cookie';
import { Service, StructuredPhoto, PhotoDefinition } from '@/ts/interfaces/Service';

import { translateMessage } from '@/i18n/runtime';

interface AddPhotoData {
  photoDefinitionId: string;
  file: File;
  notes?: string;
}

export const useAddServicePhotos = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  return useMutation({
    mutationFn: async ({
      serviceId,
      newPhotos,
      currentService
    }: {
      serviceId: string;
      newPhotos: AddPhotoData[];
      photoDefinitions: PhotoDefinition[];
      currentService: Service;
    }) => {
      // Get current structured photos
      const currentPhotos = currentService.structuredPhotos || [];

      // Prepare form data
      const formData = new FormData();
      formData.append('serviceId', serviceId);

      // Create structured photos data array
      const structuredPhotosData = [...currentPhotos];

      // Add new photos to the structured data
      newPhotos.forEach((photoData) => {
        structuredPhotosData.push({
          id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID, will be replaced by server
          serviceId,
          photoDefinitionId: photoData.photoDefinitionId,
          url: null as any, // Will be set after upload
          notes: photoData.notes || null,
          createdAt: new Date().toISOString()
        });

        // Add the file to form data
        formData.append('structuredPhoto', photoData.file);
      });

      // Add structured photos data
      formData.append('structuredPhotosData', JSON.stringify(structuredPhotosData));

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
        title: translateMessage('toasts.photosAddedSuccessfully', 'Photos added successfully'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorAddingPhotos', 'Error adding photos'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
};

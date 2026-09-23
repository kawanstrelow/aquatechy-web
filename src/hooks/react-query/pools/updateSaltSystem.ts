import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { EquipmentCondition, SaltSystemStatus } from '@/ts/enums/enums';

export interface UpdateSaltSystemDto {
  poolId: string;
  saltSystem: {
    model?: string;
    serialNumber?: string;
    condition?: EquipmentCondition;
    status?: SaltSystemStatus;
    recommendedCleaningIntervalDays?: number;
    warrantyExpirationDate?: string;
    photos?: string[];
    lastCleaningDate?: string;
    replacementDate?: string;
  };
}

export function useUpdateSaltSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSaltSystemDto) => {
      return await clientAxios.patch(`/pools/${data.poolId}/salt-system`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    }
  });
}

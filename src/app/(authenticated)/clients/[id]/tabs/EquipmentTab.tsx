'use client';

import { useState } from 'react';

import { Equipment } from '@/ts/interfaces/Pool';

import { EquipmentDetailView } from './equipment/EquipmentDetailView';
import { FilterCard } from './equipment/FilterCard';

interface EquipmentTabProps {
  equipment: Equipment | null;
  poolId: string;
  clientId: string;
}

export default function EquipmentTab({ equipment, poolId, clientId }: EquipmentTabProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<'filter' | null>(null);
  const filter = equipment?.filter ?? null;

  if (selectedEquipment === 'filter') {
    return (
      <EquipmentDetailView
        filter={filter}
        poolId={poolId}
        clientId={clientId}
        onBack={() => setSelectedEquipment(null)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FilterCard
        model={filter?.model}
        type={filter?.type}
        lastCleaningDate={filter?.lastCleaningDate}
        maintenanceCount={filter?.maintenanceHistory?.length ?? 0}
        onClick={() => setSelectedEquipment('filter')}
      />
    </div>
  );
}

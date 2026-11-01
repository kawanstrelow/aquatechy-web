import { useTranslations } from 'next-intl';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Assignment } from '@/ts/interfaces/Assignments';
import { useState } from 'react';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { useShallow } from 'zustand/react/shallow';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimize: (origin: string, destination: string) => void;
  assignments: Assignment[];
  userAddress: string;
  technicianId?: string;
}

type RouteOption = {
  id: string;
  label: string;
  address: string;
};

export function OptimizeRouteModal({ open, onOpenChange, onOptimize, assignments, userAddress, technicianId }: Props) {
  const t = useTranslations('routes');
  const { assignmentToId, members } = useMembersStore(
    useShallow((state) => ({
      assignmentToId: state.assignmentToId,
      members: state.members
    }))
  );

  const user = useUserStore((state) => state.user);

  // Find the selected technician's address
  const selectedTechnician = members.find((member) => member.id === (technicianId ?? assignmentToId)) || user;
  const technicianAddress =
    selectedTechnician.address +
    ', ' +
    selectedTechnician.city +
    ', ' +
    selectedTechnician.state +
    ' ' +
    selectedTechnician.zip;

  // Build options for starting point
  const startingPointOptions: RouteOption[] = [];

  // Add technician address as first option
  if (technicianAddress) {
    startingPointOptions.push({
      id: 'technician',
      label: t('technicianAddress', { address: technicianAddress }),
      address: technicianAddress
    });
  }

  // Add all assignment addresses
  assignments.forEach((assignment) => {
    startingPointOptions.push({
      id: assignment.id,
      label: `${assignment.pool.name}`,
      address: assignment.pool.address
    });
  });

  // Build options for ending point
  const endingPointOptions: RouteOption[] = [];

  // Add technician address as first option
  if (technicianAddress) {
    endingPointOptions.push({
      id: 'technician',
      label: t('technicianAddress', { address: technicianAddress }),
      address: technicianAddress
    });
  }

  // Add all assignment addresses
  assignments.forEach((assignment) => {
    endingPointOptions.push({
      id: assignment.id,
      label: `${assignment.pool.name}`,
      address: assignment.pool.address
    });
  });

  const [origin, setOrigin] = useState<string>('technician');
  const [destination, setDestination] = useState<string>('technician');

  if (assignments.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('optimizeRoute')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>{t('note')}</strong> {t('optimizeNote')}
            </p>
          </div>
          <div>
            <Label className="mb-4 font-medium">{t('startingPoint')}</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('selectStartingPoint')} />
              </SelectTrigger>
              <SelectContent>
                {startingPointOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-4 font-medium">{t('endPoint')}</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('selectEndingPoint')} />
              </SelectTrigger>
              <SelectContent>
                {endingPointOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                onOptimize(origin, destination);
                onOpenChange(false);
              }}
            >
              {t('optimize')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      label: `Technician Address - ${technicianAddress}`,
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
      label: `Technician Address - ${technicianAddress}`,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Optimize Route</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To optimize your route, first set your preferred first and last assignments on the
              assignments list, then return to this modal to optimize the route.
            </p>
          </div>
          <div>
            <Label className="mb-4 font-medium">Starting Point</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select starting point" />
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
            <Label className="mb-4 font-medium">End Point</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select ending point" />
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onOptimize(origin, destination);
                onOpenChange(false);
              }}
            >
              Optimize
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

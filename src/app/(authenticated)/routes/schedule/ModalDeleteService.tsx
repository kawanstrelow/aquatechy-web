import { differenceInDays } from 'date-fns';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDeleteAssignment } from '@/hooks/react-query/assignments/useDeleteAssignment';
import { useDeleteService } from '@/hooks/react-query/services/deleteService';
import { Service } from '@/ts/interfaces/Service';

type DeleteScope = 'this_service' | 'all_recurring';

type Props = {
  service?: Service;
  open: boolean;
  setOpen: (open: boolean) => void;
  clientId: string;
};

export function DialogDeleteService({ service, open, setOpen, clientId }: Props) {
  const { mutate: deleteService, isPending: isDeletingService } = useDeleteService(clientId);
  const { mutate: deleteAssignment, isPending: isDeletingAssignment } = useDeleteAssignment();
  const [scope, setScope] = useState<DeleteScope>('this_service');

  const isOneTimeService = Boolean(
    service?.assignment?.startOn &&
      service?.assignment?.endAfter &&
      differenceInDays(new Date(service.assignment.endAfter), new Date(service.assignment.startOn)) < 7
  );
  const canDeleteRecurring = Boolean(service?.assignmentId) && !isOneTimeService;
  const isPending = isDeletingService || isDeletingAssignment;

  useEffect(() => {
    if (open) {
      setScope('this_service');
    }
  }, [open]);

  if (!service) return null;

  const serviceToDelete = service;

  function handleDelete() {
    if (scope === 'all_recurring' && canDeleteRecurring) {
      deleteAssignment(serviceToDelete.assignmentId, {
        onSuccess: () => {
          setOpen(false);
        }
      });
      return;
    }

    deleteService(
      { serviceId: serviceToDelete.id, assignmentId: serviceToDelete.assignmentId },
      {
        onSuccess: () => {
          setOpen(false);
        }
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : setOpen}>
      <DialogContent className="max-w-md">
        <DialogTitle className="mb-4">Delete Service</DialogTitle>
        <DialogDescription className="mb-4">
          Choose whether to delete only this visit or all remaining open services on this recurring assignment.
          <br />
          This action cannot be undone.
        </DialogDescription>
        {isPending ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
            <p className="text-sm text-gray-600">
              {scope === 'all_recurring' ? 'Deleting assignment...' : 'Deleting service...'}
            </p>
          </div>
        ) : (
          <>
            <RadioGroup
              value={scope}
              onValueChange={(value) => {
                if (!canDeleteRecurring && value === 'all_recurring') {
                  return;
                }
                setScope(value as DeleteScope);
              }}
              className="gap-3"
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="this_service" id="delete-scope-this-service" className="mt-1" />
                <div className="grid gap-1">
                  <Label htmlFor="delete-scope-this-service" className="cursor-pointer font-normal">
                    This service only
                  </Label>
                  <span className="text-muted-foreground text-xs">Delete just this scheduled visit.</span>
                </div>
              </div>
              <div className={`flex items-start gap-3 ${!canDeleteRecurring ? 'opacity-50' : ''}`}>
                <RadioGroupItem
                  value="all_recurring"
                  id="delete-scope-all-recurring"
                  className="mt-1"
                  disabled={!canDeleteRecurring}
                />
                <div className="grid gap-1">
                  <Label
                    htmlFor="delete-scope-all-recurring"
                    className={!canDeleteRecurring ? 'cursor-not-allowed font-normal' : 'cursor-pointer font-normal'}
                  >
                    All open recurring services
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    Delete the assignment and all remaining open services.
                  </span>
                </div>
              </div>
            </RadioGroup>
            <div className="flex gap-4 pt-4">
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

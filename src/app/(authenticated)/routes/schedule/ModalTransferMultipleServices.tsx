import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import SelectField from '@/components/SelectField';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

import { useWeekdayStore } from '@/store/weekday';
import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';
import { isEmpty } from '@/utils';

import { useMembersStore } from '@/store/members';
import WeekdaySelect from '../assignments/WeekdaySelect';
import { Service, TransferService } from '@/ts/interfaces/Service';
import { useTransferService, ServiceTransferResponse } from '@/hooks/react-query/services/transferService';
import { useServicesContext } from '@/context/services';
import { cn } from '@/lib/utils';

const batchTransferSchema = z.object({
  assignedToId: z
    .string({
      required_error: 'assignedToId is required.',
      invalid_type_error: 'assignedToId must be a string.'
    })
    .trim()
    .min(1, { message: 'assignedToId must be at least 1 character.' }),
  scheduledTo: z
    .string({
      required_error: 'scheduledTo is required.',
      invalid_type_error: 'scheduledTo must be a string.'
    })
    .trim()
    .min(1, { message: 'scheduledTo must be at least 1 character.' })
});

type FormValues = z.infer<typeof batchTransferSchema>;

export function DialogTransferMultipleServices({
  services: servicesOverride,
  disabled,
  fullWidth = true
}: {
  services?: Service[];
  disabled?: boolean;
  fullWidth?: boolean;
} = {}) {
  const { services: contextServices } = useServicesContext();
  const services = servicesOverride ?? contextServices;
  const { members } = useMembersStore(
    useShallow((state) => ({
      members: state.members,
      assignmentToId: state.assignmentToId
    }))
  );

  // Create a new members array don't including repeated members and removing members with firstName empty
  const uniqueMembers = members.filter(
    (member, index, self) => index === self.findIndex((t) => t.id === member.id) && member.firstName !== ''
  );

  const selectedWeekday = useWeekdayStore((state) => state.selectedWeekday);
  const [weekday, setWeekday] = useState<WeekdaysUppercase>(selectedWeekday);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transferResults, setTransferResults] = useState<ServiceTransferResponse | null>(null);

  const [next10DatesWithChosenWeekday, setNext10DatesWithChosenWeekday] = useState<
    {
      name: string;
      key: string;
      value: string;
    }[]
  >([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(batchTransferSchema),
    defaultValues: {
      assignedToId: '',
      scheduledTo: ''
    }
  });

  const validateForm = async (): Promise<boolean> => {
    form.formState.errors; // also works if you read form.formState.isValid
    await form.trigger();
    if (form.formState.isValid) {
      return true;
    }
    if (isEmpty(form.formState.errors)) {
      console.error('Error in the form');
    } else {
      console.error(form.formState.errors);
    }
    return false;
  };

  const handleTransferSuccess = (result: ServiceTransferResponse) => {
    setTransferResults(result); // Store the results to display
    form.reset();
    setWeekday(selectedWeekday);
    setNext10DatesWithChosenWeekday([]);
    setOpen(false);
  };

  const handleTransferError = (error: string) => {
    setErrorMessage(error); // Set error message to display in dialog
  };

  const { mutate, isPending } = useTransferService(handleTransferSuccess, handleTransferError);

  const buildPayload = (): TransferService[] => {
    const { assignedToId, scheduledTo } = form.getValues();

    // Map all services to transfer objects
    const transfers: TransferService[] = services.map((service) => ({
      serviceId: service.id,
      assignedToId,
      scheduledTo
    }));

    return transfers;
  };

  async function transferServices() {
    const isValid = await validateForm();
    if (isValid) {
      const payload = buildPayload();

      if (payload.length === 0) {
        return;
      }

      mutate(payload);
      return;
    }
    setOpen(true);
  }

  function getNext10DatesBasedOnWeekday(weekday: string) {
    // Convert weekday string to a number (0=Sunday, 1=Monday, ..., 6=Saturday)

    if (!weekday) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(weekday.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error('Invalid weekday. Please use a valid weekday name.');
    }

    const today = new Date();
    const todayWeekday = getDay(today); // Get current weekday
    let daysToNext = (targetWeekday - todayWeekday + 7) % 7; // Calculate days to the next occurrence

    // If today is the target weekday, include today
    if (daysToNext === 0) {
      daysToNext = 0; // Set to 0 to include today
    } else {
      daysToNext = daysToNext || 7; // Otherwise, find the next week's same weekday
    }
    const dates: { name: string; key: string; value: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysToNext + i * 7); // Add weeks

      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const weekdayName = format(nextDate, 'yyyy-MM-dd');
      const isoDate = String(nextDate); // Get the ISO string for the date

      dates.push({
        name: formattedDate,
        key: weekdayName,
        value: isoDate
      });
    }

    setNext10DatesWithChosenWeekday(dates);
  }

  useEffect(() => {
    if (weekday) {
      getNext10DatesBasedOnWeekday(weekday);
    }
  }, [weekday]);

  const servicesCount = services.length;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={
          isPending
            ? undefined
            : (isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                  setTimeout(() => {
                    form.reset();
                    setWeekday(selectedWeekday);
                    setNext10DatesWithChosenWeekday([]);
                  }, 0);
                }
              }
        }
      >
        <DialogTrigger asChild className={cn(fullWidth && 'w-full')}>
          <Button
            className={cn('h-9 shrink-0 whitespace-nowrap px-4 py-2', fullWidth ? 'w-full' : 'w-auto')}
            variant="outline"
            type="button"
            disabled={disabled || servicesCount === 0}
          >
            Transfer All Services
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen w-96 max-w-[580px] overflow-y-scroll rounded-md md:w-[580px]">
          <DialogTitle>Transfer All Services</DialogTitle>
          {isPending ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-sm text-gray-600">
                Transferring {servicesCount} service{servicesCount !== 1 ? 's' : ''}...
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">
                  You are about to transfer {servicesCount} service{servicesCount !== 1 ? 's' : ''}.
                </p>
                <p className="mt-1">
                  All services will be transferred to the same technician and scheduled for the same date.
                </p>
              </div>
              <Form {...form}>
                <form className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="basis-full">
                      <SelectField
                        name="assignedToId"
                        placeholder="Technician..."
                        label="Technician"
                        options={uniqueMembers.map((m) => ({
                          key: m.id,
                          value: m.id,
                          name: `${m.firstName} ${m.lastName}`
                        }))}
                      />
                    </div>

                    <WeekdaySelect value={weekday} onChange={(weekday: WeekdaysUppercase) => setWeekday(weekday)} />
                  </div>

                  <div className="mt-1">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <SelectField
                        label="Schedule to"
                        name="scheduledTo"
                        placeholder="Schedule to"
                        options={next10DatesWithChosenWeekday.map((date) => ({
                          key: date.key,
                          name: date.name,
                          value: date.value
                        }))}
                      />
                    </div>
                  </div>
                </form>
              </Form>
            </>
          )}
          {!isPending && (
            <div className="flex justify-around gap-4 pt-4">
              <Button className="w-full" onClick={transferServices}>
                Transfer All
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  form.reset();
                  setWeekday(selectedWeekday);
                  setNext10DatesWithChosenWeekday([]);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <AlertDialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error Transferring Services</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Results Dialog */}
      <AlertDialog open={!!transferResults} onOpenChange={(open) => !open && setTransferResults(null)}>
        <AlertDialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {transferResults?.failureCount === 0 ? (
                <span className="text-gray-600">✓ All Services Transferred Successfully</span>
              ) : transferResults?.successCount === 0 ? (
                <span className="text-gray-600">Transfer Failed</span>
              ) : (
                <span className="text-gray-600">Partial Transfer Completed</span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="grid grid-cols-3 gap-4 py-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{transferResults?.totalProcessed}</div>
                  <div className="text-gray-500">Total Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{transferResults?.successCount}</div>
                  <div className="text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{transferResults?.failureCount}</div>
                  <div className="text-gray-500">Failed</div>
                </div>
              </div>

              {transferResults && transferResults.failureCount > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-gray-700">Failed Transfers:</div>

                  {transferResults.results
                    .filter((result) => !result.success)
                    .map((result, index) => (
                      <div
                        key={result.serviceId || index}
                        className="mb-2 mt-2 rounded border border-red-200 bg-white p-3"
                      >
                        <div className="text-sm text-red-700">{result.message}</div>
                      </div>
                    ))}
                </div>
              )}

              {transferResults && transferResults.successCount > 0 && transferResults.failureCount > 0 && (
                <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  <strong>Note:</strong> {transferResults.successCount} service(s) were transferred successfully. The
                  failed transfers above were skipped and may require manual attention.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTransferResults(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

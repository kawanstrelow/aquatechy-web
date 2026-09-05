import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInDays, format, getDay } from 'date-fns';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import SelectField from '@/components/SelectField';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAssignmentsContext } from '@/context/assignments';
import { useTransferPermanentlyRoute } from '@/hooks/react-query/assignments/useTransferRoute';
import { useTransferService } from '@/hooks/react-query/services/transferService';
import { transferServiceSchema } from '@/schemas/service';
import { useMembersStore } from '@/store/members';
import { useWeekdayStore } from '@/store/weekday';
import { Assignment, TransferAssignment } from '@/ts/interfaces/Assignments';
import { Service, TransferService } from '@/ts/interfaces/Service';
import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';
import { isEmpty } from '@/utils';

import WeekdaySelect from '../assignments/WeekdaySelect';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  service: Service;
};

type FormValues = z.infer<typeof transferServiceSchema>;

type DateOption = {
  name: string;
  key: string;
  value: string;
};

export function DialogTransferService({ open, setOpen, service }: Props) {
  const { members } = useMembersStore(
    useShallow((state) => ({
      members: state.members,
      assignmentToId: state.assignmentToId
    }))
  );
  const { allAssignments } = useAssignmentsContext();

  const uniqueMembers = members.filter(
    (member, index, self) => index === self.findIndex((t) => t.id === member.id) && member.firstName !== ''
  );

  const selectedWeekday = useWeekdayStore((state) => state.selectedWeekday);
  const assignmentFromContext = allAssignments.find((assignment) => assignment.id === service.assignmentId);
  const assignmentForTransfer: Assignment =
    assignmentFromContext ?? ({ id: service.assignment?.id ?? service.assignmentId } as Assignment);
  const assignmentStartOn = service.assignment?.startOn ?? assignmentFromContext?.startOn;
  const assignmentEndAfter = service.assignment?.endAfter ?? assignmentFromContext?.endAfter;
  const isOneTimeService = Boolean(
    assignmentStartOn &&
      assignmentEndAfter &&
      differenceInDays(new Date(assignmentEndAfter), new Date(assignmentStartOn)) < 7
  );
  const isRecurringAssignment = Boolean(assignmentStartOn && assignmentEndAfter && !isOneTimeService);

  const [next10DatesWithChosenWeekday, setNext10DatesWithChosenWeekday] = useState<DateOption[]>([]);
  const [next10WeekdaysStartOn, setNext10WeekdaysStartOn] = useState<DateOption[]>([]);
  const [next10WeekdaysEndAfter, setNext10WeekdaysEndAfter] = useState<DateOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(transferServiceSchema),
    defaultValues: {
      scope: 'this_service',
      assignedToId: '',
      scheduledTo: '',
      weekday: selectedWeekday
    }
  });

  const [scope, weekday, startOn] = form.watch(['scope', 'weekday', 'startOn']);
  const isPermanentTransfer = isRecurringAssignment && scope === 'all_recurring';

  const resetFormState = () => {
    form.reset({
      scope: 'this_service',
      assignedToId: '',
      scheduledTo: '',
      weekday: selectedWeekday,
      startOn: undefined,
      endAfter: undefined,
      serviceId: undefined
    });
    setNext10DatesWithChosenWeekday([]);
    setNext10WeekdaysStartOn([]);
    setNext10WeekdaysEndAfter([]);
  };

  const validateForm = async (): Promise<boolean> => {
    form.formState.errors;
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

  const { mutate: transferServiceOccurrence, isPending: isPendingService } = useTransferService();

  const handlePermanentSuccess = () => {
    setManualLoading(false);
    resetFormState();
    setOpen(false);
  };

  const handlePermanentError = (message: string) => {
    setManualLoading(false);
    setErrorMessage(message);
  };

  const { mutate: transferPermanently, isPending: isPendingPermanently } = useTransferPermanentlyRoute(
    assignmentForTransfer,
    handlePermanentSuccess,
    handlePermanentError
  );

  const isPending = isPendingService || isPendingPermanently || manualLoading;

  function getNext10DatesBasedOnWeekday(selected: string) {
    if (!selected) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(selected.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error('Invalid weekday. Please use a valid weekday name.');
    }

    const today = new Date();
    const todayWeekday = getDay(today);
    let daysToNext = (targetWeekday - todayWeekday + 7) % 7;

    if (daysToNext === 0) {
      daysToNext = 0;
    } else {
      daysToNext = daysToNext || 7;
    }
    const dates: DateOption[] = [];

    for (let i = 0; i < 10; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysToNext + i * 7);

      dates.push({
        name: format(nextDate, 'EEEE, MMMM d, yyyy'),
        key: format(nextDate, 'yyyy-MM-dd'),
        value: String(nextDate)
      });
    }

    setNext10DatesWithChosenWeekday(dates);
  }

  function getNext10DatesForStartOnBasedOnWeekday(selected: string) {
    if (!selected) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(selected.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error('Invalid weekday. Please use a valid weekday name.');
    }

    const today = new Date();
    const todayWeekday = getDay(today);
    let daysToNext = (targetWeekday - todayWeekday + 7) % 7;

    if (daysToNext === 0) {
      daysToNext = 0;
    } else {
      daysToNext = daysToNext || 7;
    }
    const dates: DateOption[] = [];

    for (let i = 0; i < 10; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysToNext + i * 7);

      dates.push({
        name: format(nextDate, 'EEEE, MMMM d, yyyy'),
        key: format(nextDate, 'yyyy-MM-dd'),
        value: String(nextDate)
      });
    }

    setNext10WeekdaysStartOn(dates);
  }

  function getNext10DatesForEndAfterBasedOnWeekday(startOnDate: Date) {
    if (!startOnDate) return;

    const startDate = new Date(startOnDate);
    const dates: DateOption[] = [
      {
        name: 'No end',
        key: 'No end',
        value: 'No end'
      }
    ];

    for (let i = 1; i <= 10; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i * 7);

      dates.push({
        name: format(nextDate, 'EEEE, MMMM d, yyyy'),
        key: format(nextDate, 'yyyy-MM-dd'),
        value: String(nextDate)
      });
    }

    setNext10WeekdaysEndAfter(dates);
  }

  async function transferService() {
    if (!isPermanentTransfer) {
      form.setValue('serviceId', service.id);
    }

    const isValid = await validateForm();
    if (!isValid) {
      setOpen(true);
      return;
    }

    const values = form.getValues();

    if (isPermanentTransfer) {
      const payload: TransferAssignment = {
        assignmentId: assignmentForTransfer.id,
        assignmentToId: values.assignedToId,
        startOn: values.startOn as Date,
        endAfter: values.endAfter as string,
        weekday: values.weekday as string
      };

      setManualLoading(true);
      transferPermanently(payload);
      return;
    }

    const payload: TransferService = {
      serviceId: service.id,
      assignedToId: values.assignedToId,
      scheduledTo: values.scheduledTo as string
    };

    transferServiceOccurrence([payload], {
      onSuccess: () => {
        resetFormState();
        setOpen(false);
      }
    });
  }

  useEffect(() => {
    if (!weekday) return;

    if (isPermanentTransfer) {
      form.resetField('startOn');
      form.resetField('endAfter');
      getNext10DatesForStartOnBasedOnWeekday(weekday);
      return;
    }

    form.resetField('scheduledTo');
    getNext10DatesBasedOnWeekday(weekday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday, isPermanentTransfer]);

  useEffect(() => {
    if (startOn && isPermanentTransfer) {
      getNext10DatesForEndAfterBasedOnWeekday(startOn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOn, isPermanentTransfer]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!isRecurringAssignment && scope === 'all_recurring') {
      form.setValue('scope', 'this_service');
      form.resetField('startOn');
      form.resetField('endAfter');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurringAssignment, scope]);

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
                    resetFormState();
                  }, 0);
                }
              }
        }
      >
        <DialogContent className="max-h-screen w-96 max-w-[580px] overflow-y-auto rounded-md md:w-[580px]">
          <DialogTitle className="mb-4">Transfer Service</DialogTitle>
          {isPending ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-sm text-gray-600">
                {isPermanentTransfer ? 'Transferring assignment...' : 'Transferring service...'}
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form className="flex flex-col gap-4">
                {isOneTimeService && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950 [&>svg]:text-amber-700">
                    <Info className="h-4 w-4" />
                    <AlertTitle>One-time service</AlertTitle>
                    <AlertDescription>
                      This service is a one-time service and is not part of a recurring assignment.
                    </AlertDescription>
                  </Alert>
                )}

                <RadioGroup
                  value={scope}
                  onValueChange={(value) => {
                    if (!isRecurringAssignment && value === 'all_recurring') {
                      return;
                    }
                    form.setValue('scope', value as FormValues['scope']);
                    form.resetField('scheduledTo');
                    form.resetField('startOn');
                    form.resetField('endAfter');
                  }}
                  className="gap-3"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="this_service" id="transfer-scope-this-service" className="mt-1" />
                    <div className="grid gap-1">
                      <Label htmlFor="transfer-scope-this-service" className="cursor-pointer font-normal">
                        This service only
                      </Label>
                      <span className="text-muted-foreground text-xs">Move just this scheduled visit.</span>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 ${!isRecurringAssignment ? 'opacity-50' : ''}`}>
                    <RadioGroupItem
                      value="all_recurring"
                      id="transfer-scope-all-recurring"
                      className="mt-1"
                      disabled={!isRecurringAssignment}
                    />
                    <div className="grid gap-1">
                      <Label
                        htmlFor="transfer-scope-all-recurring"
                        className={
                          !isRecurringAssignment ? 'cursor-not-allowed font-normal' : 'cursor-pointer font-normal'
                        }
                      >
                        All recurring services permanently
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        Transfer the whole recurring assignment to a new technician and schedule.
                      </span>
                    </div>
                  </div>
                </RadioGroup>

                {isPermanentTransfer && (
                  <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                    <p className="font-semibold">This moves the entire recurring assignment, not just this visit.</p>
                    <p className="mt-1">Future services will follow the weekday, start, and end dates you select.</p>
                  </div>
                )}

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

                  <WeekdaySelect
                    value={weekday as WeekdaysUppercase}
                    onChange={(nextWeekday: WeekdaysUppercase) => form.setValue('weekday', nextWeekday)}
                  />
                </div>

                {isPermanentTransfer ? (
                  <div className="mt-1">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <SelectField
                        label="Start on"
                        name="startOn"
                        placeholder="Select start on date"
                        options={next10WeekdaysStartOn.map((date) => ({
                          key: date.key,
                          name: date.name,
                          value: date.value
                        }))}
                      />
                      <SelectField
                        label="End after"
                        name="endAfter"
                        placeholder="Select end after date"
                        options={next10WeekdaysEndAfter.map((date) => ({
                          key: date.key,
                          name: date.name,
                          value: date.value
                        }))}
                      />
                    </div>
                  </div>
                ) : (
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
                )}
              </form>
            </Form>
          )}
          {!isPending && (
            <div className="flex justify-around gap-4 pt-4">
              <Button className="w-full" onClick={transferService}>
                Transfer
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetFormState();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!errorMessage} onOpenChange={(shown) => !shown && setErrorMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error transferring assignment</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

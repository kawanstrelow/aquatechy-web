import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAssignmentsContext } from '@/context/assignments';
import { useServicesContext } from '@/context/services';
import { useTransferPermanentlyRoute, TransferResponse } from '@/hooks/react-query/assignments/useTransferRoute';
import { useTransferService, ServiceTransferResponse } from '@/hooks/react-query/services/transferService';
import { cn } from '@/lib/utils';
import { batchTransferServiceSchema } from '@/schemas/service';
import { useMembersStore } from '@/store/members';
import { useWeekdayStore } from '@/store/weekday';
import { Assignment, TransferAssignment } from '@/ts/interfaces/Assignments';
import { Service, TransferService } from '@/ts/interfaces/Service';
import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';
import { isEmpty } from '@/utils';

import WeekdaySelect from '../assignments/WeekdaySelect';

type FormValues = z.infer<typeof batchTransferServiceSchema>;

type DateOption = {
  name: string;
  key: string;
  value: string;
};

export function DialogTransferMultipleServices({
  services: servicesOverride,
  disabled,
  fullWidth = true,
  className
}: {
  services?: Service[];
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  const t = useTranslations('routes');
  const { services: contextServices } = useServicesContext();
  const services = servicesOverride ?? contextServices;
  const { allAssignments } = useAssignmentsContext();
  const { members } = useMembersStore(
    useShallow((state) => ({
      members: state.members,
      assignmentToId: state.assignmentToId
    }))
  );

  const uniqueMembers = members.filter(
    (member, index, self) => index === self.findIndex((t) => t.id === member.id) && member.firstName !== ''
  );

  const selectedWeekday = useWeekdayStore((state) => state.selectedWeekday);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transferResults, setTransferResults] = useState<ServiceTransferResponse | null>(null);
  const [permanentResults, setPermanentResults] = useState<TransferResponse | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const [next10DatesWithChosenWeekday, setNext10DatesWithChosenWeekday] = useState<DateOption[]>([]);
  const [next10WeekdaysStartOn, setNext10WeekdaysStartOn] = useState<DateOption[]>([]);
  const [next10WeekdaysEndAfter, setNext10WeekdaysEndAfter] = useState<DateOption[]>([]);

  const assignmentsToTransfer = useMemo(() => {
    const seen = new Set<string>();
    const result: Assignment[] = [];

    for (const service of services) {
      const assignmentId = service.assignment?.id ?? service.assignmentId;
      if (!assignmentId || seen.has(assignmentId)) continue;
      seen.add(assignmentId);

      const fromContext = allAssignments.find((assignment) => assignment.id === assignmentId);
      result.push(fromContext ?? ({ id: assignmentId } as Assignment));
    }

    return result;
  }, [services, allAssignments]);

  const form = useForm<FormValues>({
    resolver: zodResolver(batchTransferServiceSchema),
    defaultValues: {
      scope: 'one_time',
      assignedToId: '',
      scheduledTo: '',
      weekday: selectedWeekday
    }
  });

  const [scope, weekday, startOn] = form.watch(['scope', 'weekday', 'startOn']);
  const isPermanentTransfer = scope === 'permanent';

  const resetFormState = () => {
    form.reset({
      scope: 'one_time',
      assignedToId: '',
      scheduledTo: '',
      weekday: selectedWeekday,
      startOn: undefined,
      endAfter: undefined
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

  const handleTransferSuccess = (result: ServiceTransferResponse) => {
    setTransferResults(result);
    resetFormState();
    setOpen(false);
  };

  const handleTransferError = (error: string) => {
    setErrorMessage(error);
  };

  const handlePermanentSuccess = (result: TransferResponse) => {
    setManualLoading(false);
    setPermanentResults(result);
    resetFormState();
    setOpen(false);
  };

  const handlePermanentError = (error: string) => {
    setManualLoading(false);
    setErrorMessage(error);
  };

  const { mutate, isPending: isPendingService } = useTransferService(handleTransferSuccess, handleTransferError);
  const { mutate: transferPermanently, isPending: isPendingPermanently } = useTransferPermanentlyRoute(
    assignmentsToTransfer,
    handlePermanentSuccess,
    handlePermanentError
  );

  const isPending = isPendingService || isPendingPermanently || manualLoading;

  function getNext10DatesBasedOnWeekday(selected: string) {
    if (!selected) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(selected.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error(t('errors.invalidWeekday'));
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
      throw new Error(t('errors.invalidWeekday'));
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
        name: t('noEnd'),
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

  async function transferServices() {
    const isValid = await validateForm();
    if (!isValid) {
      setOpen(true);
      return;
    }

    const values = form.getValues();

    if (isPermanentTransfer) {
      if (assignmentsToTransfer.length === 0) {
        return;
      }

      const payload: TransferAssignment = {
        assignmentId: assignmentsToTransfer[0].id,
        assignmentToId: values.assignedToId,
        startOn: values.startOn as Date,
        endAfter: values.endAfter as string,
        weekday: values.weekday as string
      };

      setManualLoading(true);
      transferPermanently(payload);
      return;
    }

    const payload: TransferService[] = services.map((service) => ({
      serviceId: service.id,
      assignedToId: values.assignedToId,
      scheduledTo: values.scheduledTo as string
    }));

    if (payload.length === 0) {
      return;
    }

    mutate(payload);
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

  const servicesCount = services.length;
  const assignmentsCount = assignmentsToTransfer.length;

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
        <DialogTrigger asChild className={cn(fullWidth && 'w-full', className)}>
          <Button
            className={cn('h-9 shrink-0 px-4 py-2', fullWidth ? 'w-full' : 'w-auto whitespace-nowrap', className)}
            variant="outline"
            type="button"
            disabled={disabled || servicesCount === 0}
          >
            <span className="md:hidden">{t('transferAll')}</span>
            <span className="hidden md:inline">{t('transferAllServices')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-full max-w-[580px] overflow-y-auto rounded-md">
          <DialogTitle className="mb-4">{t('transferAllServices')}</DialogTitle>
          {isPending ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-sm text-gray-600">
                {isPermanentTransfer
                  ? t('transferringAssignments')
                  : servicesCount === 1
                    ? t('transferringOneService')
                    : t('transferringServices', { count: servicesCount })}
              </p>
            </div>
          ) : (
            <>
              <RadioGroup
                value={scope}
                onValueChange={(value) => {
                  form.setValue('scope', value as FormValues['scope']);
                  form.resetField('scheduledTo');
                  form.resetField('startOn');
                  form.resetField('endAfter');
                }}
                className="mb-2 gap-3"
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="one_time" id="transfer-all-scope-one-time" className="mt-1" />
                  <div className="grid gap-1">
                    <Label htmlFor="transfer-all-scope-one-time" className="cursor-pointer font-normal">
                      {t('oneTimeChange')}
                    </Label>
                    <span className="text-muted-foreground text-xs">{t('moveTheseVisits')}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="permanent" id="transfer-all-scope-permanent" className="mt-1" />
                  <div className="grid gap-1">
                    <Label htmlFor="transfer-all-scope-permanent" className="cursor-pointer font-normal">
                      {t('permanentChange')}
                    </Label>
                    <span className="text-muted-foreground text-xs">{t('transferAssignmentsPermanently')}</span>
                  </div>
                </div>
              </RadioGroup>

              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                {isPermanentTransfer ? (
                  <>
                    <p className="font-semibold">{t('transferAllAssignmentsWarning')}</p>
                    <p className="mt-1">{t('singleServicesWarning')}</p>
                    <p className="mt-1">{t('recurrentServicesWarning')}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">
                      {servicesCount === 1
                        ? t('aboutToTransferOne')
                        : t('aboutToTransferCount', { count: servicesCount })}
                    </p>
                    <p className="mt-1">{t('allServicesSameDate')}</p>
                  </>
                )}
              </div>

              <Form {...form}>
                <form className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="basis-full">
                      <SelectField
                        name="assignedToId"
                        placeholder={t('technicianPlaceholder')}
                        label={t('technician')}
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
                          label={t('startOn')}
                          name="startOn"
                          placeholder={t('startOn')}
                          options={next10WeekdaysStartOn.map((date) => ({
                            key: date.key,
                            name: date.name,
                            value: date.value
                          }))}
                        />
                        <SelectField
                          label={t('endAfter')}
                          name="endAfter"
                          placeholder={t('endAfter')}
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
                          label={t('scheduleTo')}
                          name="scheduledTo"
                          placeholder={t('scheduleTo')}
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
            </>
          )}
          {!isPending && (
            <div className="flex justify-around gap-4 pt-4">
              <Button
                className="w-full"
                onClick={transferServices}
                disabled={isPermanentTransfer && assignmentsCount === 0}
              >
                {t('transferAll')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetFormState();
                  setOpen(false);
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!errorMessage} onOpenChange={(isOpen) => !isOpen && setErrorMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPermanentTransfer ? t('errorTransferringRoute') : t('errorTransferringServices')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>{t('close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!transferResults} onOpenChange={(isOpen) => !isOpen && setTransferResults(null)}>
        <AlertDialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {transferResults?.failureCount === 0 ? (
                <span className="text-gray-600">{t('allServicesTransferred')}</span>
              ) : transferResults?.successCount === 0 ? (
                <span className="text-gray-600">{t('transferFailed')}</span>
              ) : (
                <span className="text-gray-600">{t('partialTransfer')}</span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="grid grid-cols-3 gap-4 py-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{transferResults?.totalProcessed}</div>
                  <div className="text-gray-500">{t('totalProcessed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{transferResults?.successCount}</div>
                  <div className="text-gray-500">{t('successful')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{transferResults?.failureCount}</div>
                  <div className="text-gray-500">{t('failed')}</div>
                </div>
              </div>

              {transferResults && transferResults.failureCount > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-gray-700">{t('failedTransfers')}</div>

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
                  <strong>{t('note')}</strong>{' '}
                  {transferResults.successCount === 1
                    ? t('partialServiceNoteOne')
                    : t('partialServiceNoteMany', { count: transferResults.successCount })}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTransferResults(null)}>{t('close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!permanentResults} onOpenChange={(isOpen) => !isOpen && setPermanentResults(null)}>
        <AlertDialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {permanentResults?.failureCount === 0 ? (
                <span className="text-green-600">{t('allAssignmentsTransferred')}</span>
              ) : permanentResults?.successCount === 0 ? (
                <span className="text-red-600">{t('transferFailed')}</span>
              ) : (
                <span className="text-yellow-600">{t('partialTransfer')}</span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="grid grid-cols-3 gap-4 py-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{permanentResults?.totalProcessed}</div>
                  <div className="text-gray-500">{t('totalProcessed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{permanentResults?.successCount}</div>
                  <div className="text-gray-500">{t('successful')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{permanentResults?.failureCount}</div>
                  <div className="text-gray-500">{t('failed')}</div>
                </div>
              </div>

              {permanentResults && permanentResults.failureCount > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-gray-700">{t('failedTransfers')}</div>

                  {permanentResults.results
                    .filter((result) => !result.success)
                    .map((result, index) => (
                      <div
                        key={result.assignmentId || index}
                        className="mb-2 mt-2 rounded border border-red-200 bg-white p-3"
                      >
                        <div className="text-sm text-red-700">{result.message}</div>
                      </div>
                    ))}
                </div>
              )}

              {permanentResults && permanentResults.successCount > 0 && permanentResults.failureCount > 0 && (
                <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  <strong>{t('note')}</strong>{' '}
                  {permanentResults.successCount === 1
                    ? t('partialAssignmentNoteOne')
                    : t('partialAssignmentNoteMany', { count: permanentResults.successCount })}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setPermanentResults(null)}>{t('close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

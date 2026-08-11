'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpdateCompanyPreferences } from '@/hooks/react-query/companies/updatePreferences';
import { useUpdateServicePreferences } from '@/hooks/react-query/companies/updateServicePreferences';
import { useUserStore } from '@/store/user';
import { Company } from '@/ts/interfaces/Company';

import {
  EmailPreferencesCard,
  FilterMaintenanceCard,
  ReadingAndConsumableGroupsCard,
  ServiceTypesCard
} from './components';

// Update the schema to include the new fields
const schema = z.object({
  sendEmails: z.boolean(),
  attachChemicalsReadings: z.boolean(),
  attachChecklist: z.boolean(),
  attachServicePhotos: z.boolean(),

  // New fields
  attachReadingsGroups: z.boolean(),
  attachConsumablesGroups: z.boolean(),
  attachPhotoGroups: z.boolean(),
  attachSelectorsGroups: z.boolean(),
  attachCustomChecklist: z.boolean(),

  ccEmail: z.string(),
  sendSkippedServiceEmails: z.boolean(),
  filterCleaningIntervalDays: z.coerce.number().min(1),
  filterReplacementIntervalDays: z.coerce.number().min(1),
  filterCleaningMustHavePhotos: z.boolean(),
  sendFilterCleaningEmails: z.boolean(),
  allowAnticipatedServices: z.boolean()
});

export default function Page({ company }: { company: Company }) {
  const { isPending: isEmailPending, mutate: updateEmailPrefs } = useUpdateCompanyPreferences(company.id);
  const { isPending: isServicePrefsPending, mutate: updateServicePrefs } = useUpdateServicePreferences(company.id);
  const { isFreePlan } = useUserStore(
    useShallow((state) => ({
      isFreePlan: state.isFreePlan
    }))
  );

  const user = useUserStore((state) => state.user);
  const previousSendEmails = useRef<boolean | null>(null);
  const isInitialRender = useRef(true);

  // Update the form default values
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      sendEmails: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.sendEmails || false,
      // attachChemicalsReadings: isFreePlan
      //   ? false
      //   : company.preferences?.serviceEmailPreferences?.attachChemicalsReadings || false,
      // attachChecklist: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachChecklist || false,
      // attachServicePhotos: isFreePlan
      //   ? false
      //   : company.preferences?.serviceEmailPreferences?.attachServicePhotos || false,
      ccEmail: company.preferences?.serviceEmailPreferences?.ccEmail || undefined,
      sendSkippedServiceEmails: company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails || false,
      filterCleaningIntervalDays: company.preferences?.equipmentMaintenancePreferences?.filterCleaningIntervalDays || 28,
      filterReplacementIntervalDays: company.preferences?.equipmentMaintenancePreferences?.filterReplacementIntervalDays || 365,
      filterCleaningMustHavePhotos: isFreePlan
        ? false
        : company.preferences?.equipmentMaintenancePreferences?.filterCleaningMustHavePhotos || false,
      sendFilterCleaningEmails: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.sendFilterCleaningEmails || false,

      // New fields
      attachReadingsGroups: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachReadingsGroups || false,
      attachConsumablesGroups: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachConsumablesGroups || false,
      attachPhotoGroups: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachPhotoGroups || false,
      attachSelectorsGroups: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachSelectorsGroups || false,
      attachCustomChecklist: isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachCustomChecklist || false,
      allowAnticipatedServices: company.preferences?.servicePreferences?.allowAnticipatedServices || false
    }
  });

  const sendEmails = form.watch('sendEmails');

  // Use useCallback to prevent infinite re-renders
  const handleEmailsChange = useCallback((newSendEmails: boolean) => {
    if (newSendEmails) {
      // form.setValue('attachChemicalsReadings', true, { shouldDirty: true });
      // form.setValue('attachChecklist', true, { shouldDirty: true });
      // form.setValue('attachServicePhotos', true, { shouldDirty: true });
      form.setValue('attachReadingsGroups', true, { shouldDirty: true });
      form.setValue('attachConsumablesGroups', true, { shouldDirty: true });
      form.setValue('attachPhotoGroups', true, { shouldDirty: true });
      form.setValue('attachSelectorsGroups', true, { shouldDirty: true });
      form.setValue('attachCustomChecklist', true, { shouldDirty: true });
    } else {
      // form.setValue('attachChemicalsReadings', false, { shouldDirty: true });
      // form.setValue('attachChecklist', false, { shouldDirty: true });
      // form.setValue('attachServicePhotos', false, { shouldDirty: true });
      form.setValue('attachReadingsGroups', false, { shouldDirty: true });
      form.setValue('attachConsumablesGroups', false, { shouldDirty: true });
      form.setValue('attachPhotoGroups', false, { shouldDirty: true });
      form.setValue('attachSelectorsGroups', false, { shouldDirty: true });
      form.setValue('attachCustomChecklist', false, { shouldDirty: true });
    }
  }, [form]);

  // Only trigger handleEmailsChange when sendEmails actually changes (not on initial render)
  useEffect(() => {
    if (isInitialRender.current) {
      // On initial render, just store the current value
      previousSendEmails.current = sendEmails;
      isInitialRender.current = false;
      return;
    }

    // Only trigger if the value actually changed and it's not the initial render
    if (previousSendEmails.current !== null && previousSendEmails.current !== sendEmails) {
      handleEmailsChange(sendEmails);
      previousSendEmails.current = sendEmails;
    }
  }, [sendEmails, handleEmailsChange]);

  const router = useRouter();

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [modalType, setModalType] = useState<'email' | 'filter' | 'general'>('email');

  const filterDays = form.watch('filterCleaningIntervalDays');

  // Watch form values to detect changes for each section
  const watchedValues = form.watch();

  // Check if email fields have changed
  const emailFieldsChanged = () => {
    // const emailFields = ['sendEmails', 'attachChemicalsReadings', 'attachChecklist', 'attachServicePhotos', 'ccEmail'];
    const emailFields = ['sendEmails', 'attachReadingsGroups', 'attachConsumablesGroups', 'attachPhotoGroups', 'attachSelectorsGroups', 'attachCustomChecklist', 'ccEmail', 'sendSkippedServiceEmails'];
    return emailFields.some(field => {
      const currentValue = watchedValues[field as keyof typeof watchedValues];
      const originalValue = getOriginalValue(field);
      return currentValue !== originalValue;
    });
  };

  // Check if filter fields have changed
  const filterFieldsChanged = () => {
    const filterFields = ['filterCleaningIntervalDays', 'filterReplacementIntervalDays', 'filterCleaningMustHavePhotos', 'sendFilterCleaningEmails'];
    return filterFields.some(field => {
      const currentValue = watchedValues[field as keyof typeof watchedValues];
      const originalValue = getOriginalValue(field);
      return currentValue !== originalValue;
    });
  };

  // Check if general fields have changed
  const generalFieldsChanged = () => {
    const generalFields = ['allowAnticipatedServices'];
    return generalFields.some(field => {
      const currentValue = watchedValues[field as keyof typeof watchedValues];
      const originalValue = getOriginalValue(field);
      return currentValue !== originalValue;
    });
  };

  // Helper function to get original values
  const getOriginalValue = (field: string) => {
    switch (field) {
      case 'sendEmails':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.sendEmails || false;
      // case 'attachChemicalsReadings':
      //   return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachChemicalsReadings || false;
      // case 'attachChecklist':
      //   return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachChecklist || false;
      // case 'attachServicePhotos':
      //   return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachServicePhotos || false;
      case 'attachReadingsGroups':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachReadingsGroups || false;
      case 'attachConsumablesGroups':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachConsumablesGroups || false;
      case 'attachPhotoGroups':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachPhotoGroups || false;
      case 'attachSelectorsGroups':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachSelectorsGroups || false;
      case 'attachCustomChecklist':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.attachCustomChecklist || false;
      case 'ccEmail':
        return company.preferences?.serviceEmailPreferences?.ccEmail || undefined;
      case 'sendSkippedServiceEmails':
        return company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails || false;
      case 'filterCleaningIntervalDays':
        return company.preferences?.equipmentMaintenancePreferences?.filterCleaningIntervalDays || 28;
      case 'filterReplacementIntervalDays':
        return company.preferences?.equipmentMaintenancePreferences?.filterReplacementIntervalDays || 365;
      case 'filterCleaningMustHavePhotos':
        return isFreePlan
          ? false
          : company.preferences?.equipmentMaintenancePreferences?.filterCleaningMustHavePhotos || false;
      case 'sendFilterCleaningEmails':
        return isFreePlan ? false : company.preferences?.serviceEmailPreferences?.sendFilterCleaningEmails || false;
      case 'allowAnticipatedServices':
        return company.preferences?.servicePreferences?.allowAnticipatedServices || false;
      default:
        return null;
    }
  };

  // Handle CC email submission
  const handleCcEmailSubmit = (ccEmail: string, _sendSkippedFromForm: boolean) => {
    const preservedSkipped =
      isFreePlan
        ? (company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails ?? false)
        : form.getValues('sendSkippedServiceEmails');

    const updateData = {
      serviceEmailPreferences: {
        sendEmails: form.getValues('sendEmails'),
        attachReadingsGroups: form.getValues('attachReadingsGroups'),
        attachConsumablesGroups: form.getValues('attachConsumablesGroups'),
        attachPhotoGroups: form.getValues('attachPhotoGroups'),
        attachSelectorsGroups: form.getValues('attachSelectorsGroups'),
        attachCustomChecklist: form.getValues('attachCustomChecklist'),
        ccEmail,
        sendFilterCleaningEmails: form.getValues('sendFilterCleaningEmails'),
        sendSkippedServiceEmails: preservedSkipped
      },
      companyId: company.id
    };

    updateEmailPrefs(updateData);
  };

  // Handle email preferences submission
  const handleEmailSubmit = (data: z.infer<typeof schema>) => {
    const {
      sendEmails,
      attachReadingsGroups,
      attachConsumablesGroups,
      attachPhotoGroups,
      attachSelectorsGroups,
      attachCustomChecklist,
      ccEmail,
      sendFilterCleaningEmails,
      sendSkippedServiceEmails
    } = data;

    const updateData = {
      serviceEmailPreferences: {
        sendEmails,
        attachReadingsGroups,
        attachConsumablesGroups,
        attachPhotoGroups,
        attachSelectorsGroups,
        attachCustomChecklist,
        ccEmail,
        sendFilterCleaningEmails,
        sendSkippedServiceEmails
      },
      companyId: company.id
    };

    updateEmailPrefs(updateData);
  };

  // Handle filter maintenance submission
  const handleFilterSubmit = (data: z.infer<typeof schema>) => {
    const {
      filterCleaningIntervalDays,
      filterReplacementIntervalDays,
      filterCleaningMustHavePhotos,
      sendEmails,
      attachReadingsGroups,
      attachConsumablesGroups,
      attachPhotoGroups,
      attachSelectorsGroups,
      attachCustomChecklist,
      ccEmail,
      sendFilterCleaningEmails,
      sendSkippedServiceEmails
    } = data;

    const updateData = {
      equipmentMaintenancePreferences: {
        filterCleaningIntervalDays: Number(filterCleaningIntervalDays),
        filterReplacementIntervalDays: Number(filterReplacementIntervalDays),
        filterCleaningMustHavePhotos: isFreePlan ? false : filterCleaningMustHavePhotos
      },
      serviceEmailPreferences: {
        sendEmails,
        attachReadingsGroups,
        attachConsumablesGroups,
        attachPhotoGroups,
        attachSelectorsGroups,
        attachCustomChecklist,
        ccEmail,
        sendFilterCleaningEmails,
        sendSkippedServiceEmails
      },
      companyId: company.id
    };

    updateEmailPrefs(updateData);
  };

  // Handle general preferences submission
  const handleGeneralSubmit = (data: z.infer<typeof schema>) => {
    const { allowAnticipatedServices } = data;

    updateServicePrefs({
      allowAnticipatedServices
    });
  };

  const ccEmail = form.watch('ccEmail');

  const originalCcEmail = company.preferences?.serviceEmailPreferences?.ccEmail || undefined;

  useEffect(() => {
    if (ccEmail !== originalCcEmail) {
      // Force the form to recognize the change
      form.setValue('ccEmail', ccEmail, { shouldDirty: true, shouldTouch: true });
    }
  }, [ccEmail, originalCcEmail, form]);

  useEffect(() => {
  }, [form.formState.isDirty, ccEmail, form]);



  if (isEmailPending || isServicePrefsPending) {
    return <LoadingSpinner />;
  }


  return (
    <div className="w-full space-y-4 md:space-y-8">
      <Form {...form}>
        <form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault();
            // Form submission is now handled by individual buttons
          }}
        >
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="flex h-auto min-h-9 w-full flex-wrap items-stretch justify-stretch gap-1 rounded-lg bg-slate-100 p-1 text-slate-500">
              <TabsTrigger
                value="email"
                className="flex-1 items-center justify-center rounded-md px-2 py-1.5 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
              >
                Communication
              </TabsTrigger>
              <TabsTrigger
                value="filter"
                className="flex-1 items-center justify-center rounded-md px-2 py-1.5 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
              >
                Equipment Maintenance
              </TabsTrigger>
              <TabsTrigger
                value="service-config"
                className="flex-1 items-center justify-center rounded-md px-2 py-1.5 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
              >
                App Customization
              </TabsTrigger>
              <TabsTrigger
                value="service-types"
                className="flex-1 items-center justify-center rounded-md px-2 py-1.5 text-sm transition-all data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow"
              >
                Service Types
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6">
              <EmailPreferencesCard
                company={company}
                form={form}
                onEmailSubmit={(data) => {
                  setFormData(data);
                  setModalType('email');
                  setShowConfirmModal(true);
                }}
                onCcEmailSubmit={handleCcEmailSubmit}
                emailFieldsChanged={emailFieldsChanged}
              />
            </TabsContent>

            <TabsContent value="filter" className="mt-6">
              <FilterMaintenanceCard
                company={company}
                form={form}
                onFilterSubmit={(data) => {
                  setFormData(data);
                  setModalType('filter');
                  setShowConfirmModal(true);
                }}
                filterFieldsChanged={filterFieldsChanged}
              />
            </TabsContent>

            <TabsContent value="service-config" className="mt-6">
              <ReadingAndConsumableGroupsCard company={company} />
            </TabsContent>

            <TabsContent value="service-types" className="mt-6">
              <ServiceTypesCard
                company={company}
                form={form}
                onGeneralSubmit={(data) => {
                  setFormData(data);
                  setModalType('general');
                  setShowConfirmModal(true);
                }}
                generalFieldsChanged={generalFieldsChanged}
              />
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl mb-4">
              {modalType === 'email'
                ? 'Update Email Preferences'
                : modalType === 'filter'
                ? 'Update Equipment Maintenance'
                : 'Update General Preferences'
              }
            </DialogTitle>

            <DialogDescription className="mt-4 text-left">
              {modalType === 'email'
                ? (
                  <>
                    This action will set the email notification preferences for all NEW CLIENTS created from now on under this company.
                    <br /><br />
                    Clients created before this change will need to be updated manually in their individual settings on the clients page or using the bulk actions page.
                    <br /><br />
                    <strong>Note:</strong> In order to send service emails, both the client preferences AND company preferences must be enabled.
                  </>
                )
                : modalType === 'filter'
                ? (
                  <>
                    This action will change the filter maintenance preferences for all NEW CLIENTS created from now on under this company. This includes cleaning intervals, replacement schedules, and photo requirements.
                    <br /><br />
                    Clients created before this change will need to be updated manually in their individual settings on the clients page or using the bulk actions page. The photo requirement to filter cleaning is the only preference that will be updated for all clients including the previous ones.
                    <br /><br />
                    <strong>Note:</strong> In order to send filter cleaning emails, both the client preferences AND company preferences must be enabled.
                  </>
                )
                : (
                  <>
                    This action will update the general preferences for this company.
                    <br /><br />
                    Changes to general preferences will apply to all services and clients under this company.
                  </>
                )
              }
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (formData) {
                  if (modalType === 'email') {
                    handleEmailSubmit(formData);
                  } else if (modalType === 'filter') {
                    handleFilterSubmit(formData);
                  } else {
                    handleGeneralSubmit(formData);
                  }
                }
                setShowConfirmModal(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}


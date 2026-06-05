'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useDidUpdateEffect } from '@/hooks/useDidUpdateEffect';
import { FieldType } from '@/ts/enums/enums';
import { Client } from '@/ts/interfaces/Client';
import { useUpdateClientPreferences } from '@/hooks/react-query/clients/updatePreferences';
import { useUserStore } from '@/store/user';

// Card on file / Stripe setup — next launch
// import StripeSaveCardSection from './StripeSaveCardSection';

const schema = z.object({
  sendEmails: z.boolean(),
  sendSMS: z.boolean(),
  attachChemicalsReadings: z.boolean(),
  attachChecklist: z.boolean(),
  attachServicePhotos: z.boolean(),
  sendFilterCleaningEmails: z.boolean(),

  // New fields
  attachReadingsGroups: z.boolean(),
  attachConsumablesGroups: z.boolean(),
  attachPhotoGroups: z.boolean(),
  attachSelectorsGroups: z.boolean(),
  attachCustomChecklist: z.boolean(),
});

export default function EmailPreferences({ client }: { client: Client }) {
  const { isPending, mutate } = useUpdateClientPreferences(client.id);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { isFreePlan } = useUserStore(
    useShallow((state) => ({
      isFreePlan: state.isFreePlan
    }))
  );

  const companyTeamHref = client.companyOwner?.id
    ? `/settings/companies/team/${client.companyOwner.id}`
    : '/settings/companies';

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sendEmails: client.preferences?.serviceEmailPreferences?.sendEmails || false,
      sendSMS: client.preferences?.serviceEmailPreferences?.sendSMS || false,
      attachChemicalsReadings: client.preferences?.serviceEmailPreferences?.attachChemicalsReadings || false,
      attachChecklist: client.preferences?.serviceEmailPreferences?.attachChecklist || false,
      attachServicePhotos: client.preferences?.serviceEmailPreferences?.attachServicePhotos || false,
      sendFilterCleaningEmails: client.preferences?.serviceEmailPreferences?.sendFilterCleaningEmails || false,

      // New fields
      attachReadingsGroups: client.preferences?.serviceEmailPreferences?.attachReadingsGroups || false,
      attachConsumablesGroups: client.preferences?.serviceEmailPreferences?.attachConsumablesGroups || false,
      attachPhotoGroups: client.preferences?.serviceEmailPreferences?.attachPhotoGroups || false,
      attachSelectorsGroups: client.preferences?.serviceEmailPreferences?.attachSelectorsGroups || false,
      attachCustomChecklist: client.preferences?.serviceEmailPreferences?.attachCustomChecklist || false,
    }
  });

  const { sendEmails } = form.getValues();
  useDidUpdateEffect(handleEmailsChange, [sendEmails]);

  function handleEmailsChange() {
    if (sendEmails) {
      // form.setValue('attachChemicalsReadings', true);
      // form.setValue('attachChecklist', true);
      // form.setValue('attachServicePhotos', true);
      form.setValue('attachReadingsGroups', true);
      form.setValue('attachConsumablesGroups', true);
      form.setValue('attachPhotoGroups', true);
      form.setValue('attachSelectorsGroups', true);
      form.setValue('attachCustomChecklist', true);
    } else {
      // form.setValue('attachChemicalsReadings', false);
      // form.setValue('attachChecklist', false);
      // form.setValue('attachServicePhotos', false);
      form.setValue('attachReadingsGroups', false);
      form.setValue('attachConsumablesGroups', false);
      form.setValue('attachPhotoGroups', false);
      form.setValue('attachSelectorsGroups', false);
      form.setValue('attachCustomChecklist', false);
    }
  }

  const handleConfirmSave = () => {
    const formData = form.getValues();
    mutate(formData);
    setShowConfirmModal(false);
  };

  if (isPending) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Card on file — next launch
      <StripeSaveCardSection client={client} variant="preferences" />
      */}

      <Form {...form}>
        <form className="w-full flex-col items-center" onSubmit={form.handleSubmit(() => setShowConfirmModal(true))}>
          {isFreePlan && (
            <div className="mb-6 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                On the Free plan you can turn on service emails for this client. Only <strong>photos</strong> will be sent in
                those emails—readings, consumables, selectors, checklist, and any custom email content are not included or
                customizable on Free.
              </p>
              <p className="text-sm text-amber-900">
                Service emails must also be enabled and configured in your{' '}
                <Link
                  href={companyTeamHref}
                  className="font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900"
                >
                  company email preferences
                </Link>{' '}
                (open your company, go to the Preferences tab, then Email notifications). Match those settings so emails
                send the way you expect.
              </p>
            </div>
          )}

          <div className="flex w-full flex-col divide-y border-gray-200">
            {fields.map((field) => (
              <div key={field.label} className="grid w-full grid-cols-1 items-center space-y-4 py-6 md:grid-cols-12">
                <div className="col-span-8 row-auto flex flex-col">
                  <label htmlFor={field.label} className="flex flex-col space-y-1">
                    <span className="text-sm font-semibold text-gray-800">{field.label}</span>
                  </label>
                  <span className="text-muted-foreground text-sm font-normal">{field.description}</span>
                </div>
                <div className="col-span-4 flex flex-col gap-2">
                  {field.itens.map((item) => {
                    const isIndependentToggle =
                      item.name === 'sendEmails' || item.name === 'sendSMS' || item.name === 'sendFilterCleaningEmails';

                    return (
                      <div key={item.name} className="flex w-full items-center gap-4">
                        <div className={field.type === FieldType.Default ? 'w-full' : ''}>
                          <InputField
                            disabled={isIndependentToggle ? false : sendEmails ? false : true}
                            key={item.name}
                            name={item.name}
                            type={field.type}
                            placeholder={field.type === FieldType.Default ? item.label : ''}
                          />
                        </div>
                        {field.type === FieldType.Switch && (
                          <label htmlFor={item.label}>
                            <div>
                              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                            </div>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button disabled={!form.formState.isDirty} className="mt-2">
              Save
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl mb-4">Update Notification Preferences</DialogTitle>
            <DialogDescription className="mt-4 text-left">
              <>
                This action will update the service notification preferences for this specific client.
                <br /><br />
                <strong>Note:</strong> In order to send service emails, SMS messages, or filter cleaning emails, both the client preferences AND company preferences must be enabled.
              </>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={isPending}>
              {isPending ? (
                <div
                  className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"
                />
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type Fields = {
  inputClassName?: string;
  type: FieldType;
  description: string;
  label: string;
  itens: {
    label: string;
    description: string;
    name: string;
  }[];
}[];

const fields: Fields = [
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'Send e-mails when a service is done.',
    label: 'Send service e-mails',
    itens: [
      {
        label: 'Send service e-mails',
        description: 'Send e-mails when a service is done.',
        name: 'sendEmails'
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'Send SMS when a service is done. Requires a valid client phone number.',
    label: 'Send service SMS',
    itens: [
      {
        label: 'Send service SMS',
        description: 'Send SMS when a service is done.',
        name: 'sendSMS'
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'Select the information you want to send in the service e-mails.',
    label: 'Include in service e-mails',
    itens: [
      // {
      //   label: 'Chemicals Readings',
      //   description: 'Send service e-mails with chemicals readings.',
      //   name: 'attachChemicalsReadings'
      // },
      // {
      //   label: 'Checklist',
      //   description: 'Send service e-mails with checklist.',
      //   name: 'attachChecklist'
      // },
      // {
      //   label: 'Service Photos',
      //   description: 'Send service e-mails with service photos.',
      //   name: 'attachServicePhotos'
      // }
      {
        label: 'Readings',
        description: 'Send service e-mails with readings.',
        name: 'attachReadingsGroups'
      },
      {
        label: 'Consumables',
        description: 'Send service e-mails with consumables.',
        name: 'attachConsumablesGroups'
      },
      {
        label: 'Photos',
        description: 'Send service e-mails with photos.',
        name: 'attachPhotoGroups'
      },
      {
        label: 'Selectors',
        description: 'Send service e-mails with selectors.',
        name: 'attachSelectorsGroups'
      },
      {
        label: 'Checklist',
        description: 'Send service e-mails with checklist.',
        name: 'attachCustomChecklist'
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'Send e-mails when filter cleaning is completed.',
    label: 'Filter cleaning notifications',
    itens: [
      {
        label: 'Send filter cleaning e-mails',
        description: 'Send e-mails when filter cleaning is completed.',
        name: 'sendFilterCleaningEmails'
      }
    ]
  }
];

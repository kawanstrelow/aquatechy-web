'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  attachTechnicianNotes: z.boolean()
});

const GROW_ONLY_FIELDS = [
  'sendSMS',
  'sendFilterCleaningEmails',
  'attachReadingsGroups',
  'attachConsumablesGroups',
  'attachSelectorsGroups',
  'attachCustomChecklist',
  'attachTechnicianNotes'
] as const;

type GrowOnlyField = (typeof GROW_ONLY_FIELDS)[number];

function isGrowOnlyField(name: string): name is GrowOnlyField {
  return (GROW_ONLY_FIELDS as readonly string[]).includes(name);
}

export default function EmailPreferences({ client }: { client: Client }) {
  const t = useTranslations('clients');
  const labelText = (key: string) => t(key as never);
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
      sendSMS: isFreePlan ? false : client.preferences?.serviceEmailPreferences?.sendSMS || false,
      attachChemicalsReadings: client.preferences?.serviceEmailPreferences?.attachChemicalsReadings || false,
      attachChecklist: client.preferences?.serviceEmailPreferences?.attachChecklist || false,
      attachServicePhotos: client.preferences?.serviceEmailPreferences?.attachServicePhotos || false,
      sendFilterCleaningEmails: isFreePlan
        ? false
        : client.preferences?.serviceEmailPreferences?.sendFilterCleaningEmails || false,

      // New fields — photos stay available on Free; other include options are Grow-only
      attachReadingsGroups: isFreePlan
        ? false
        : client.preferences?.serviceEmailPreferences?.attachReadingsGroups || false,
      attachConsumablesGroups: isFreePlan
        ? false
        : client.preferences?.serviceEmailPreferences?.attachConsumablesGroups || false,
      attachPhotoGroups: client.preferences?.serviceEmailPreferences?.attachPhotoGroups || false,
      attachSelectorsGroups: isFreePlan
        ? false
        : client.preferences?.serviceEmailPreferences?.attachSelectorsGroups || false,
      attachCustomChecklist: isFreePlan
        ? false
        : client.preferences?.serviceEmailPreferences?.attachCustomChecklist || false,
      attachTechnicianNotes: isFreePlan
        ? false
        : client.preferences?.serviceEmailPreferences?.attachTechnicianNotes || false
    }
  });

  const sendEmails = form.watch('sendEmails');
  useDidUpdateEffect(handleEmailsChange, [sendEmails]);

  // Keep Grow-only options off while on Free plan
  useEffect(() => {
    if (!isFreePlan) return;

    form.setValue('sendSMS', false);
    form.setValue('sendFilterCleaningEmails', false);
    form.setValue('attachReadingsGroups', false);
    form.setValue('attachConsumablesGroups', false);
    form.setValue('attachSelectorsGroups', false);
    form.setValue('attachCustomChecklist', false);
    form.setValue('attachTechnicianNotes', false);
  }, [isFreePlan, form]);

  function handleEmailsChange() {
    if (sendEmails) {
      form.setValue('attachPhotoGroups', true);
      if (!isFreePlan) {
        form.setValue('attachReadingsGroups', true);
        form.setValue('attachConsumablesGroups', true);
        form.setValue('attachSelectorsGroups', true);
        form.setValue('attachCustomChecklist', true);
        form.setValue('attachTechnicianNotes', true);
      } else {
        form.setValue('attachReadingsGroups', false);
        form.setValue('attachConsumablesGroups', false);
        form.setValue('attachSelectorsGroups', false);
        form.setValue('attachCustomChecklist', false);
        form.setValue('attachTechnicianNotes', false);
      }
    } else {
      form.setValue('attachReadingsGroups', false);
      form.setValue('attachConsumablesGroups', false);
      form.setValue('attachPhotoGroups', false);
      form.setValue('attachSelectorsGroups', false);
      form.setValue('attachCustomChecklist', false);
      form.setValue('attachTechnicianNotes', false);
    }
  }

  const handleConfirmSave = () => {
    const formData = form.getValues();
    const payload = isFreePlan
      ? {
          ...formData,
          sendSMS: false,
          sendFilterCleaningEmails: false,
          attachReadingsGroups: false,
          attachConsumablesGroups: false,
          attachSelectorsGroups: false,
          attachCustomChecklist: false,
          attachTechnicianNotes: false
        }
      : formData;
    mutate(payload);
    setShowConfirmModal(false);
  };

  if (isPending) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Form {...form}>
        <form className="w-full flex-col items-center" onSubmit={form.handleSubmit(() => setShowConfirmModal(true))}>
          {isFreePlan && (
            <div className="mb-6 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                {t.rich('preferences.freePlanPhotos', { strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
              <p className="text-sm text-amber-900">
                {t.rich('preferences.freePlanCompany', {
                  link: (chunks) => (
                    <Link
                      href={companyTeamHref}
                      className="font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900"
                    >
                      {chunks}
                    </Link>
                  )
                })}
              </p>
            </div>
          )}

          <div className="flex w-full flex-col divide-y border-gray-200">
            {fields.map((field) => (
              <div key={field.label} className="grid w-full grid-cols-1 items-center space-y-4 py-6 md:grid-cols-12">
                <div className="col-span-8 row-auto flex flex-col">
                  <label htmlFor={field.label} className="flex flex-col space-y-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {labelText(field.label)}
                      {isFreePlan && field.growOnly && (
                        <span className="ml-1.5 text-xs font-medium text-blue-600">{t('preferences.upgradePlan')}</span>
                      )}
                    </span>
                  </label>
                  <span className="text-muted-foreground text-sm font-normal">{labelText(field.description)}</span>
                </div>
                <div className="col-span-4 flex flex-col gap-2">
                  {field.itens.map((item) => {
                    const isIndependentToggle =
                      item.name === 'sendEmails' || item.name === 'sendSMS' || item.name === 'sendFilterCleaningEmails';
                    const growOnly = item.growOnly || isGrowOnlyField(item.name);
                    const disabledByPlan = isFreePlan && growOnly;
                    const disabledByEmail = !isIndependentToggle && !sendEmails;

                    return (
                      <div key={item.name} className="flex w-full items-center gap-4">
                        <div className={field.type === FieldType.Default ? 'w-full' : ''}>
                          <InputField
                            disabled={disabledByPlan || disabledByEmail}
                            key={item.name}
                            name={item.name}
                            type={field.type}
                            placeholder={field.type === FieldType.Default ? labelText(item.label) : ''}
                          />
                        </div>
                        {field.type === FieldType.Switch && (
                          <label htmlFor={item.label}>
                            <div>
                              <span className="text-sm font-semibold text-gray-800">
                                {labelText(item.label)}
                                {isFreePlan && growOnly && !field.growOnly && (
                                  <span className="ml-1.5 text-xs font-medium text-blue-600">
                                    {t('preferences.upgradePlan')}
                                  </span>
                                )}
                              </span>
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
              {t('shared.save')}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle className="mb-4 text-xl">{t('preferences.confirmTitle')}</DialogTitle>
            <DialogDescription className="mt-4 text-left">
              <>
                {t('preferences.confirmBody')}
                <br />
                <br />
                <strong>{t('shared.note')}</strong> {t('preferences.confirmNote')}
              </>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              {t('shared.cancel')}
            </Button>
            <Button onClick={handleConfirmSave} disabled={isPending}>
              {isPending ? (
                <div
                  className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"
                />
              ) : (
                t('shared.saveChanges')
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
  /** When true, the whole section is Grow-only (tag on section title). */
  growOnly?: boolean;
  itens: {
    label: string;
    description: string;
    name: string;
    growOnly?: boolean;
  }[];
}[];

const fields: Fields = [
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'preferences.sendServiceEmailsDescription',
    label: 'preferences.sendServiceEmails',
    itens: [
      {
        label: 'preferences.sendServiceEmails',
        description: 'preferences.sendServiceEmailsDescription',
        name: 'sendEmails'
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'preferences.sendServiceSmsDescription',
    label: 'preferences.sendServiceSms',
    growOnly: true,
    itens: [
      {
        label: 'preferences.sendServiceSms',
        description: 'preferences.sendServiceSmsItemDescription',
        name: 'sendSMS',
        growOnly: true
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'preferences.includeInEmailsDescription',
    label: 'preferences.includeInEmails',
    itens: [
      {
        label: 'preferences.readings',
        description: 'preferences.readingsDescription',
        name: 'attachReadingsGroups',
        growOnly: true
      },
      {
        label: 'preferences.consumables',
        description: 'preferences.consumablesDescription',
        name: 'attachConsumablesGroups',
        growOnly: true
      },
      {
        label: 'preferences.photos',
        description: 'preferences.photosDescription',
        name: 'attachPhotoGroups'
      },
      {
        label: 'preferences.selectors',
        description: 'preferences.selectorsDescription',
        name: 'attachSelectorsGroups',
        growOnly: true
      },
      {
        label: 'preferences.checklist',
        description: 'preferences.checklistDescription',
        name: 'attachCustomChecklist',
        growOnly: true
      },
      {
        label: 'preferences.technicianNotes',
        description: 'preferences.technicianNotesDescription',
        name: 'attachTechnicianNotes',
        growOnly: true
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'preferences.filterCleaningDescription',
    label: 'preferences.filterCleaning',
    growOnly: true,
    itens: [
      {
        label: 'preferences.sendFilterCleaning',
        description: 'preferences.sendFilterCleaningDescription',
        name: 'sendFilterCleaningEmails',
        growOnly: true
      }
    ]
  }
];

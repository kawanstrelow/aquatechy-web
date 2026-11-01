'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';
import { Mail } from 'lucide-react';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { FieldType } from '@/ts/enums/enums';
import { useUpdateCompanyPreferences } from '@/hooks/react-query/companies/updatePreferences';
import { Company } from '@/ts/interfaces/Company';
import { ServiceType } from '@/ts/interfaces/ServiceTypes';
import { ServiceTypeEmailPreferences } from '@/ts/interfaces/ServiceTypeEmailPreferences';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';

import { CompanySmsSettingsCard } from '../CompanySmsSettingsCard/CompanySmsSettingsCard';

const EMAIL_CONTENT_VARIABLES = [
  { variable: '%client.firstName%', replacedWith: 'emailPrefs.clientFirstName' },
  { variable: '%client.lastName%', replacedWith: 'emailPrefs.clientLastName' },
  { variable: '%poolAddress%', replacedWith: 'emailPrefs.poolAddress' },
  { variable: '%company.name%', replacedWith: 'emailPrefs.companyName' },
  { variable: '%serviceDate%', replacedWith: 'emailPrefs.serviceDate' }
] as const;

const serviceTypeEmailSchema = z.object({
  sendAutomaticEmails: z.boolean(),
  header: z.string().optional(),
  body: z.string().optional(),
  footer: z.string().optional(),
  technicianNotes: z.boolean(),
  sendReadingsGroups: z.boolean(),
  sendConsumablesGroups: z.boolean(),
  sendPhotoGroups: z.boolean(),
  sendSelectorsGroups: z.boolean(),
  sendChecklist: z.boolean()
});

const schema = z.object({
  ccEmail: z.string().optional(),
  sendSkippedServiceEmails: z.boolean().optional(),
  serviceTypes: z.record(z.string(), serviceTypeEmailSchema)
});

const SKIPPED_SERVICE_EMAIL_REASONS = [
  {
    title: 'emailPrefs.skipped.weather',
    description: 'emailPrefs.skipped.weatherDescription'
  },
  {
    title: 'emailPrefs.skipped.gate',
    description: 'emailPrefs.skipped.gateDescription'
  },
  {
    title: 'emailPrefs.skipped.animal',
    description: 'emailPrefs.skipped.animalDescription'
  },
  {
    title: 'emailPrefs.skipped.unresponsive',
    description: 'emailPrefs.skipped.unresponsiveDescription'
  },
  {
    title: 'emailPrefs.skipped.debris',
    description: 'emailPrefs.skipped.debrisDescription'
  }
] as const;

const EMAIL_TEXT_FIELDS = [
  {
    key: 'header',
    label: 'emailPrefs.header',
    description: 'emailPrefs.headerDescription',
    placeholder: 'emailPrefs.headerPlaceholder'
  },
  {
    key: 'body',
    label: 'emailPrefs.body',
    description: 'emailPrefs.bodyDescription',
    placeholder: 'emailPrefs.bodyPlaceholder'
  },
  {
    key: 'footer',
    label: 'emailPrefs.footer',
    description: 'emailPrefs.footerDescription',
    placeholder: 'emailPrefs.footerPlaceholder'
  }
] as const;

const EMAIL_INCLUDE_OPTIONS = [
  {
    key: 'technicianNotes',
    label: 'serviceTypes.technicianNotes',
    description: 'serviceTypes.includeTechnicianNotes',
    growOnly: true
  },
  {
    key: 'sendReadingsGroups',
    label: 'readings.groupsTitle',
    description: 'serviceTypes.includeReadings',
    growOnly: true
  },
  {
    key: 'sendConsumablesGroups',
    label: 'consumables.groupsTitle',
    description: 'serviceTypes.includeConsumables',
    growOnly: true
  },
  {
    key: 'sendPhotoGroups',
    label: 'photos.groupsTitle',
    description: 'serviceTypes.includePhotoGroups',
    growOnly: false
  },
  {
    key: 'sendSelectorsGroups',
    label: 'selectors.groupsTitle',
    description: 'serviceTypes.includeSelectors',
    growOnly: true
  },
  {
    key: 'sendChecklist',
    label: 'groups.checklist',
    description: 'serviceTypes.includeChecklist',
    growOnly: true
  }
] as const;

function GrowPlanSwitchLabel({
  label,
  description,
  isFreePlan
}: {
  label: string;
  description: string;
  isFreePlan: boolean;
}) {
  const t = useTranslations('settings');

  return (
    <div className="col-span-8 row-auto flex flex-col">
      <label className="flex flex-col space-y-1">
        <span className="text-sm font-semibold text-gray-800">
          {label}
          {isFreePlan && <span className="ml-1.5 text-xs font-medium text-blue-600">{t('actions.upgradePlan')}</span>}
        </span>
      </label>
      <span className="text-muted-foreground text-sm font-normal">{description}</span>
    </div>
  );
}

function EmailVariablesHelpLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="font-medium text-blue-600 hover:text-blue-800 hover:underline" onClick={onClick}>
      (How to use client info on the e-mail)
    </button>
  );
}

export interface EmailPreferencesCardProps {
  company: Company;
  form: any;
  onEmailSubmit: (data: z.infer<typeof schema>) => void;
  onCcEmailSubmit: (ccEmail: string, sendSkippedServiceEmails: boolean) => void;
  emailFieldsChanged: () => boolean;
}

export function EmailPreferencesCard({
  company,
  form,
  onEmailSubmit,
  onCcEmailSubmit,
  emailFieldsChanged
}: EmailPreferencesCardProps) {
  const { isPending: isEmailPending } = useUpdateCompanyPreferences(company.id);
  const { isFreePlan } = useUserStore(
    useShallow((state) => ({
      isFreePlan: state.isFreePlan
    }))
  );

  return (
    <Card className="w-full border-2">
      <EmailPreferencesContent
        company={company}
        form={form}
        onEmailSubmit={onEmailSubmit}
        onCcEmailSubmit={onCcEmailSubmit}
        emailFieldsChanged={emailFieldsChanged}
        isEmailPending={isEmailPending}
        isFreePlan={isFreePlan}
      />
    </Card>
  );
}

// Separate component that only loads when expanded
function EmailPreferencesContent({
  company,
  form,
  onEmailSubmit,
  onCcEmailSubmit,
  emailFieldsChanged,
  isEmailPending,
  isFreePlan
}: {
  company: Company;
  form: any;
  onEmailSubmit: (data: any) => void;
  onCcEmailSubmit: (ccEmail: string, sendSkippedServiceEmails: boolean) => void;
  emailFieldsChanged: () => boolean;
  isEmailPending: boolean;
  isFreePlan: boolean;
}) {
  const t = useTranslations('settings');

  const { data: serviceTypesData, isLoading } = useGetServiceTypes(company.id);
  const [emailTextServiceTypeId, setEmailTextServiceTypeId] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [skippedReasonsModalOpen, setSkippedReasonsModalOpen] = useState(false);
  const [emailVariablesModalOpen, setEmailVariablesModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const saveCompletedServiceEmails = useMutation({
    mutationFn: async (updates: { serviceTypeId: string; preferences: ServiceTypeEmailPreferences }[]) => {
      await Promise.all(
        updates.map(({ serviceTypeId, preferences }) =>
          clientAxios.patch(`/service-types/${serviceTypeId}/email-preferences`, {
            serviceTypeEmailPreferences: preferences
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: t('emailPrefs.errorCompleted'),
        description: error.response?.data?.message || t('messages.errorOccurred'),
        variant: 'error'
      });
    }
  });

  const saveServiceTypeEmailText = useMutation({
    mutationFn: async ({
      serviceTypeId,
      preferences
    }: {
      serviceTypeId: string;
      preferences: ServiceTypeEmailPreferences;
    }) => {
      await clientAxios.patch(`/service-types/${serviceTypeId}/email-preferences`, {
        serviceTypeEmailPreferences: preferences
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: t('emailPrefs.updated'),
        variant: 'success'
      });
      setEmailTextServiceTypeId(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: t('emailPrefs.errorUpdating'),
        description: error.response?.data?.message || t('messages.errorOccurred'),
        variant: 'error'
      });
    }
  });

  const getServiceTypeEmailPreferences = (serviceType: ServiceType): ServiceTypeEmailPreferences => {
    return (
      serviceType.serviceTypeEmailPreferences || {
        sendAutomaticEmails: false,
        technicianNotes: false,
        sendReadingsGroups: false,
        sendConsumablesGroups: false,
        sendPhotoGroups: false,
        sendSelectorsGroups: false,
        sendChecklist: false
      }
    );
  };

  const serviceTypes = useMemo(() => serviceTypesData?.serviceTypes || [], [serviceTypesData?.serviceTypes]);
  const editingServiceType = serviceTypes.find((serviceType) => serviceType.id === emailTextServiceTypeId) ?? null;

  // Set default values when service types data loads
  useEffect(() => {
    // Set CC email value
    form.setValue('ccEmail', company.preferences?.serviceEmailPreferences?.ccEmail || '');
    // Set sendSkippedServiceEmails value
    form.setValue(
      'sendSkippedServiceEmails',
      company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails || false
    );

    if (serviceTypes.length > 0) {
      serviceTypes.forEach((serviceType) => {
        const emailPrefs = getServiceTypeEmailPreferences(serviceType);
        form.setValue(`${serviceType.id}.sendAutomaticEmails`, emailPrefs.sendAutomaticEmails);
        form.setValue(`${serviceType.id}.header`, emailPrefs.header || '');
        form.setValue(`${serviceType.id}.body`, emailPrefs.body || '');
        form.setValue(`${serviceType.id}.footer`, emailPrefs.footer || '');
        form.setValue(`${serviceType.id}.technicianNotes`, emailPrefs.technicianNotes);
        form.setValue(`${serviceType.id}.sendReadingsGroups`, emailPrefs.sendReadingsGroups);
        form.setValue(`${serviceType.id}.sendConsumablesGroups`, emailPrefs.sendConsumablesGroups);
        form.setValue(`${serviceType.id}.sendPhotoGroups`, emailPrefs.sendPhotoGroups);
        form.setValue(`${serviceType.id}.sendSelectorsGroups`, emailPrefs.sendSelectorsGroups);
        form.setValue(`${serviceType.id}.sendChecklist`, emailPrefs.sendChecklist);
      });
    }
  }, [
    serviceTypes,
    form,
    company.preferences?.serviceEmailPreferences?.ccEmail,
    company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails
  ]);

  if (isLoading) {
    return (
      <CardContent className="p-6">
        <div className="flex items-center justify-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
          <span className="ml-2 text-sm">{t('emailPrefs.loadingServiceTypes')}</span>
        </div>
      </CardContent>
    );
  }

  if (serviceTypes.length === 0) {
    return (
      <CardContent className="p-6">
        <div className="text-center text-gray-500">
          <Mail className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>{t('emailPrefs.noServiceTypes')}</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      {isFreePlan && (
        <div className="mb-8 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-center text-sm text-amber-900">{t('emailPrefs.freePlanHint')}</p>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              {t('emailPrefs.upgradeEverything')}
            </Button>
          </div>
        </div>
      )}

      {/* CC Email Section */}
      <div className="mb-8">
        <Card className="border border-gray-200">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-gray-800">{t('emailPrefs.sendCompleted')}</span>
                <p className="text-muted-foreground text-sm font-normal">{t('emailPrefs.sendCompletedHint')}</p>
              </div>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                {serviceTypes.map((serviceType) => (
                  <div
                    key={serviceType.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{serviceType.name}</p>
                      {serviceType.description ? (
                        <p className="text-muted-foreground truncate text-sm">{serviceType.description}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailTextServiceTypeId(serviceType.id)}
                      >
                        {t('emailPrefs.changeEmailText')}
                      </Button>
                      <div className="w-fit shrink-0">
                        <InputField name={`${serviceType.id}.sendAutomaticEmails`} type={FieldType.Switch} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
              <div className="col-span-8 row-auto flex flex-col">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-semibold text-gray-800">{t('emailPrefs.ccEmail')}</span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">{t('emailPrefs.ccEmailHint')}</span>
              </div>
              <div className="col-span-4">
                <input
                  {...form.register('ccEmail')}
                  type="email"
                  placeholder={t('emailPrefs.ccPlaceholder')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
              <div className="col-span-8 row-auto flex flex-col">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {t('emailPrefs.sendSkipped')}{' '}
                    <button
                      type="button"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => setSkippedReasonsModalOpen(true)}
                    >
                      {t('emailPrefs.seeSkippedReasons')}
                    </button>
                    {isFreePlan && (
                      <span className="ml-1.5 text-xs font-medium text-blue-600">{t('actions.upgradePlan')}</span>
                    )}
                  </span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">{t('emailPrefs.sendSkippedHint')}</span>
              </div>
              <div className="col-span-4 flex items-center gap-4">
                <InputField disabled={isFreePlan} name="sendSkippedServiceEmails" type={FieldType.Switch} />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                disabled={isEmailPending || saveCompletedServiceEmails.isPending}
                className="w-full max-w-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const ccEmail = form.getValues('ccEmail');
                  const sendSkippedServiceEmails = form.getValues('sendSkippedServiceEmails');
                  onCcEmailSubmit(ccEmail, sendSkippedServiceEmails);

                  const updates = serviceTypes.flatMap((serviceType) => {
                    const sendAutomaticEmails = Boolean(form.getValues(`${serviceType.id}.sendAutomaticEmails`));
                    const savedPreferences = getServiceTypeEmailPreferences(serviceType);
                    if (sendAutomaticEmails === savedPreferences.sendAutomaticEmails) return [];
                    return [
                      {
                        serviceTypeId: serviceType.id,
                        preferences: {
                          ...savedPreferences,
                          sendAutomaticEmails
                        }
                      }
                    ];
                  });

                  if (updates.length > 0) {
                    saveCompletedServiceEmails.mutate(updates);
                  }
                }}
              >
                {isEmailPending || saveCompletedServiceEmails.isPending ? (
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
                ) : (
                  t('emailPrefs.save')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editingServiceType !== null}
        onOpenChange={(open) => {
          if (!open) setEmailTextServiceTypeId(null);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
          onClick={(event) => event.stopPropagation()}
          onInteractOutside={(event) => {
            if (emailVariablesModalOpen) event.preventDefault();
          }}
        >
          {editingServiceType ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('emailPrefs.serviceTypeEmail', { name: editingServiceType.name })}</DialogTitle>
                <DialogDescription>{t('emailPrefs.editDialogDescription')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">{t('emailPrefs.emailContent')}</h4>
                  {EMAIL_TEXT_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-sm font-semibold text-gray-800">
                        {t(field.label)} <EmailVariablesHelpLink onClick={() => setEmailVariablesModalOpen(true)} />
                        {isFreePlan ? (
                          <span className="ml-1.5 text-xs font-medium text-blue-600">{t('actions.upgradePlan')}</span>
                        ) : null}
                      </label>
                      <p className="text-muted-foreground text-sm">{t(field.description)}</p>
                      <textarea
                        {...form.register(`${editingServiceType.id}.${field.key}`)}
                        placeholder={t(field.placeholder)}
                        disabled={isFreePlan}
                        rows={3}
                        className={cn(
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          isFreePlan && 'cursor-not-allowed bg-gray-100 opacity-50'
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">{t('emailPrefs.includeInEmails')}</h4>
                  {EMAIL_INCLUDE_OPTIONS.map((option) => (
                    <div key={option.key} className="grid w-full grid-cols-1 items-center gap-2 md:grid-cols-12">
                      {option.growOnly ? (
                        <GrowPlanSwitchLabel
                          label={t(option.label)}
                          description={t(option.description)}
                          isFreePlan={isFreePlan}
                        />
                      ) : (
                        <div className="col-span-8 row-auto flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{t(option.label)}</span>
                          <span className="text-muted-foreground text-sm font-normal">{t(option.description)}</span>
                        </div>
                      )}
                      <div className="col-span-4">
                        <InputField
                          disabled={option.growOnly && isFreePlan}
                          name={`${editingServiceType.id}.${option.key}`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEmailTextServiceTypeId(null)}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={saveServiceTypeEmailText.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const values = form.getValues(editingServiceType.id) ?? {};
                    saveServiceTypeEmailText.mutate({
                      serviceTypeId: editingServiceType.id,
                      preferences: {
                        sendAutomaticEmails: Boolean(values.sendAutomaticEmails),
                        header: values.header || '',
                        body: values.body || '',
                        footer: values.footer || '',
                        technicianNotes: Boolean(values.technicianNotes),
                        sendReadingsGroups: Boolean(values.sendReadingsGroups),
                        sendConsumablesGroups: Boolean(values.sendConsumablesGroups),
                        sendPhotoGroups: Boolean(values.sendPhotoGroups),
                        sendSelectorsGroups: Boolean(values.sendSelectorsGroups),
                        sendChecklist: Boolean(values.sendChecklist)
                      }
                    });
                  }}
                >
                  {saveServiceTypeEmailText.isPending ? t('actions.saving') : t('emailPrefs.saveText')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <CompanySmsSettingsCard companyId={company.id} />

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('emailPrefs.unlockTitle')}</DialogTitle>
            <DialogDescription className="text-foreground text-left text-base">
              {t('emailPrefs.unlockDescription')}
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            <Link
              href="/settings/subscription"
              className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
              onClick={() => setUpgradeDialogOpen(false)}
            >
              {t('emailPrefs.viewPlans')}
            </Link>{' '}
            to compare plans and upgrade.
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => setUpgradeDialogOpen(false)}>
              {t('actions.gotIt')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skippedReasonsModalOpen} onOpenChange={setSkippedReasonsModalOpen}>
        <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('emailPrefs.skippedReasonsTitle')}</DialogTitle>
            <DialogDescription className="text-left">{t('emailPrefs.skippedReasonsDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {SKIPPED_SERVICE_EMAIL_REASONS.map((reason) => (
              <div key={reason.title} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(reason.title)}</p>
                  <p className="text-muted-foreground text-sm">{t(reason.description)}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setSkippedReasonsModalOpen(false)}>
              {t('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailVariablesModalOpen} onOpenChange={setEmailVariablesModalOpen}>
        <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('emailPrefs.variablesTitle')}</DialogTitle>
            <DialogDescription className="text-left">{t('emailPrefs.variablesDescription')}</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">{t('emailPrefs.variable')}</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">{t('emailPrefs.replacedWith')}</th>
                </tr>
              </thead>
              <tbody>
                {EMAIL_CONTENT_VARIABLES.map(({ variable, replacedWith }) => (
                  <tr key={variable} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-900">
                        {variable}
                      </code>
                    </td>
                    <td className="text-muted-foreground px-3 py-2">{t(replacedWith)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setEmailVariablesModalOpen(false)}>
              {t('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

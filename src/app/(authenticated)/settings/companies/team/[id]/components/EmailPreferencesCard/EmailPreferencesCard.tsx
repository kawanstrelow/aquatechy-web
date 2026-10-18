'use client';

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
  { variable: '%client.firstName%', replacedWith: 'Client first name' },
  { variable: '%client.lastName%', replacedWith: 'Client last name' },
  { variable: '%poolAddress%', replacedWith: 'Pool address' },
  { variable: '%company.name%', replacedWith: 'Company name' },
  { variable: '%serviceDate%', replacedWith: 'Service date' }
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
    title: 'Inclement Weather',
    description: 'Severe rain, lightning, high winds, or other hazardous weather made service impossible or unsafe'
  },
  {
    title: 'Gate/Entry Locked',
    description: 'Main gate, side gate, or pool enclosure was locked, preventing access to the service area'
  },
  {
    title: 'Unsecured Animal',
    description: 'A dog or other large pet was loose in the yard, preventing safe entry to the pool area'
  },
  {
    title: 'Client Unresponsive',
    description: 'Contact was attempted via phone/doorbell to resolve an access issue, but no response was received'
  },
  {
    title: 'Excess Debris / Post-Storm',
    description:
      'The volume of leaves, branches, or storm-related debris exceeds standard service capacity and requires a separate, specialized cleanup visit'
  }
] as const;

const EMAIL_TEXT_FIELDS = [
  {
    key: 'header',
    label: 'Email Header',
    description: 'Custom header text for the email',
    placeholder: 'Enter email header'
  },
  {
    key: 'body',
    label: 'Email Body',
    description: 'Main content of the email',
    placeholder: 'Enter email body'
  },
  {
    key: 'footer',
    label: 'Email Footer',
    description: 'Footer text for the email',
    placeholder: 'Enter email footer'
  }
] as const;

const EMAIL_INCLUDE_OPTIONS = [
  {
    key: 'technicianNotes',
    label: 'Technician Notes',
    description: 'Include technician notes in the email',
    growOnly: true
  },
  {
    key: 'sendReadingsGroups',
    label: 'Reading Groups',
    description: 'Include reading groups data in the email',
    growOnly: true
  },
  {
    key: 'sendConsumablesGroups',
    label: 'Consumable Groups',
    description: 'Include consumable groups data in the email',
    growOnly: true
  },
  {
    key: 'sendPhotoGroups',
    label: 'Photo Groups',
    description: 'Include photo groups in the email',
    growOnly: false
  },
  {
    key: 'sendSelectorsGroups',
    label: 'Selector Groups',
    description: 'Include selector groups data in the email',
    growOnly: true
  },
  {
    key: 'sendChecklist',
    label: 'Checklist',
    description: 'Include checklist data in the email',
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
  return (
    <div className="col-span-8 row-auto flex flex-col">
      <label className="flex flex-col space-y-1">
        <span className="text-sm font-semibold text-gray-800">
          {label}
          {isFreePlan && <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>}
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
        title: 'Error updating completed service emails',
        description: error.response?.data?.message || 'An error occurred',
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
        title: 'Email preferences updated successfully',
        variant: 'success'
      });
      setEmailTextServiceTypeId(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: 'Error updating email preferences',
        description: error.response?.data?.message || 'An error occurred',
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
          <span className="ml-2 text-sm">Loading service types...</span>
        </div>
      </CardContent>
    );
  }

  if (serviceTypes.length === 0) {
    return (
      <CardContent className="p-6">
        <div className="text-center text-gray-500">
          <Mail className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>No service types found. Please create service types first.</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      {isFreePlan && (
        <div className="mb-8 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-center text-sm text-amber-900">
            You are on the Free plan. You can set CC email, turn automatic service emails on or off, and choose whether
            to include photo groups. Other email customization requires Grow.
          </p>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              Customize everything? Upgrade your plan
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
                <span className="text-sm font-semibold text-gray-800">Send Completed Service Emails</span>
                <p className="text-muted-foreground text-sm font-normal">
                  Turn completed-service emails on or off for each service type
                </p>
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
                        Change email text
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
                  <span className="text-sm font-semibold text-gray-800">CC Email Address</span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">
                  Email address to receive copies of service notifications
                </span>
              </div>
              <div className="col-span-4">
                <input
                  {...form.register('ccEmail')}
                  type="email"
                  placeholder="Enter CC email address"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
              <div className="col-span-8 row-auto flex flex-col">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-semibold text-gray-800">
                    Send Skipped Service Emails{' '}
                    <button
                      type="button"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => setSkippedReasonsModalOpen(true)}
                    >
                      (see skipped reasons list)
                    </button>
                    {isFreePlan && <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>}
                  </span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">
                  Send email notifications when services are skipped
                </span>
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
                  'Save Email Configuration'
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
                <DialogTitle>{editingServiceType.name} email</DialogTitle>
                <DialogDescription>
                  Change the email text and choose what is included when this service is completed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Email Content</h4>
                  {EMAIL_TEXT_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-sm font-semibold text-gray-800">
                        {field.label} <EmailVariablesHelpLink onClick={() => setEmailVariablesModalOpen(true)} />
                        {isFreePlan ? (
                          <span className="ml-1.5 text-xs font-medium text-blue-600">
                            (upgrade to grow plan to be able to edit)
                          </span>
                        ) : null}
                      </label>
                      <p className="text-muted-foreground text-sm">{field.description}</p>
                      <textarea
                        {...form.register(`${editingServiceType.id}.${field.key}`)}
                        placeholder={field.placeholder}
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
                  <h4 className="text-sm font-semibold text-gray-800">Include in Emails</h4>
                  {EMAIL_INCLUDE_OPTIONS.map((option) => (
                    <div key={option.key} className="grid w-full grid-cols-1 items-center gap-2 md:grid-cols-12">
                      {option.growOnly ? (
                        <GrowPlanSwitchLabel
                          label={option.label}
                          description={option.description}
                          isFreePlan={isFreePlan}
                        />
                      ) : (
                        <div className="col-span-8 row-auto flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{option.label}</span>
                          <span className="text-muted-foreground text-sm font-normal">{option.description}</span>
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
                  Cancel
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
                  {saveServiceTypeEmailText.isPending ? 'Saving...' : 'Save email text'}
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
            <DialogTitle>Unlock full email customization</DialogTitle>
            <DialogDescription className="text-foreground text-left text-base">
              To customize skipped-service notifications, email header, body, footer, and all inclusion options in
              service emails, upgrade to the Grow plan.
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            <Link
              href="/settings/subscription"
              className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
              onClick={() => setUpgradeDialogOpen(false)}
            >
              View subscription plans
            </Link>{' '}
            to compare plans and upgrade.
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => setUpgradeDialogOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skippedReasonsModalOpen} onOpenChange={setSkippedReasonsModalOpen}>
        <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Skipped Service Email Reasons</DialogTitle>
            <DialogDescription className="text-left">
              When enabled, clients will receive email notifications when services are skipped for the following
              reasons:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {SKIPPED_SERVICE_EMAIL_REASONS.map((reason) => (
              <div key={reason.title} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{reason.title}</p>
                  <p className="text-muted-foreground text-sm">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setSkippedReasonsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailVariablesModalOpen} onOpenChange={setEmailVariablesModalOpen}>
        <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>How to use client info on the e-mail</DialogTitle>
            <DialogDescription className="text-left">
              You can use the following variables in your email header, body, and footer. They will be replaced with
              real values when the email is sent:
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">Variable</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">Replaced with</th>
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
                    <td className="text-muted-foreground px-3 py-2">{replacedWith}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setEmailVariablesModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, Mail } from 'lucide-react';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useUpdateServiceTypeEmailPreferences } from '@/hooks/react-query/service-types/useUpdateServiceTypeEmailPreferences';

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
  sendChecklist: z.boolean(),
});

const schema = z.object({
  ccEmail: z.string().optional(),
  sendSkippedServiceEmails: z.boolean().optional(),
  serviceTypes: z.record(z.string(), serviceTypeEmailSchema)
});

const SKIPPED_SERVICE_EMAIL_REASONS = [
  {
    title: 'Inclement Weather',
    description:
      'Severe rain, lightning, high winds, or other hazardous weather made service impossible or unsafe'
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
    description:
      'Contact was attempted via phone/doorbell to resolve an access issue, but no response was received'
  },
  {
    title: 'Excess Debris / Post-Storm',
    description:
      'The volume of leaves, branches, or storm-related debris exceeds standard service capacity and requires a separate, specialized cleanup visit'
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
    <button
      type="button"
      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
      onClick={onClick}
    >
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

  const [collapsedServiceTypes, setCollapsedServiceTypes] = useState<Record<string, boolean>>({});

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
        collapsedServiceTypes={collapsedServiceTypes}
        setCollapsedServiceTypes={setCollapsedServiceTypes}
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
  isFreePlan,
  collapsedServiceTypes,
  setCollapsedServiceTypes
}: {
  company: Company;
  form: any;
  onEmailSubmit: (data: any) => void;
  onCcEmailSubmit: (ccEmail: string, sendSkippedServiceEmails: boolean) => void;
  emailFieldsChanged: () => boolean;
  isEmailPending: boolean;
  isFreePlan: boolean;
  collapsedServiceTypes: Record<string, boolean>;
  setCollapsedServiceTypes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  // NOW the hook is called only when the card is expanded
  const { data: serviceTypesData, isLoading } = useGetServiceTypes(company.id);
  const [activeServiceTypeId, setActiveServiceTypeId] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [skippedReasonsModalOpen, setSkippedReasonsModalOpen] = useState(false);
  const [emailVariablesModalOpen, setEmailVariablesModalOpen] = useState(false);
  const updateEmailPreferences = useUpdateServiceTypeEmailPreferences(activeServiceTypeId || '');

  const toggleServiceTypeCollapsed = (serviceTypeId: string) => {
    setCollapsedServiceTypes((prev: Record<string, boolean>) => {
      // If the state is undefined, treat it as true (collapsed), so toggling makes it false (expanded)
      const currentState = prev[serviceTypeId] ?? true;
      return {
        ...prev,
        [serviceTypeId]: !currentState
      };
    });
  };

  const getServiceTypeEmailPreferences = (serviceType: ServiceType): ServiceTypeEmailPreferences => {
    return serviceType.serviceTypeEmailPreferences || {
      sendAutomaticEmails: false,
      technicianNotes: false,
      sendReadingsGroups: false,
      sendConsumablesGroups: false,
      sendPhotoGroups: false,
      sendSelectorsGroups: false,
      sendChecklist: false,
    };
  };

  const handleServiceTypeSubmit = (serviceTypeId: string, serviceTypeData: ServiceTypeEmailPreferences) => {
    updateEmailPreferences.mutate(serviceTypeData);
  };

  const serviceTypes = useMemo(() => serviceTypesData?.serviceTypes || [], [serviceTypesData?.serviceTypes]);

  // Set default values when service types data loads
  useEffect(() => {
    // Set CC email value
    form.setValue('ccEmail', company.preferences?.serviceEmailPreferences?.ccEmail || '');
    // Set sendSkippedServiceEmails value
    form.setValue('sendSkippedServiceEmails', company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails || false);
    
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
  }, [serviceTypes, form, company.preferences?.serviceEmailPreferences?.ccEmail, company.preferences?.serviceEmailPreferences?.sendSkippedServiceEmails]);

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
          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
            You are on the Free plan. You can set CC email, turn automatic service emails on or off, and choose whether to
            include photo groups. Other email customization requires Grow.
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
          <CardContent className="p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12 mt-6">
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
                    {isFreePlan && (
                      <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>
                    )}
                  </span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">
                  Send email notifications when services are skipped
                </span>
              </div>
              <div className="col-span-4 flex items-center gap-4">
                <InputField
                  disabled={isFreePlan}
                  name="sendSkippedServiceEmails"
                  type={FieldType.Switch}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button 
                type="button"
                disabled={isEmailPending} 
                className="w-full max-w-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const ccEmail = form.getValues('ccEmail');
                  const sendSkippedServiceEmails = form.getValues('sendSkippedServiceEmails');
                  onCcEmailSubmit(ccEmail, sendSkippedServiceEmails);
                }}
              >
                {isEmailPending ? (
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
                ) : (
                  'Save Email Configuration'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CompanySmsSettingsCard companyId={company.id} />

      <div className="space-y-4">
        {serviceTypes.map((serviceType) => {
          const isCollapsed = collapsedServiceTypes[serviceType.id] ?? true;
          const emailPrefs = getServiceTypeEmailPreferences(serviceType);
          
          return (
            <Card key={serviceType.id} className="border border-gray-200">
              <CardHeader 
                className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleServiceTypeCollapsed(serviceType.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{serviceType.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {serviceType.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-5 w-5 text-gray-600 transition-transform duration-200",
                      isCollapsed ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </CardHeader>
              
              {!isCollapsed && (
                <CardContent className="p-6 space-y-6">
                  {/* Send Automatic Emails */}
                  <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                    <div className="col-span-8 row-auto flex flex-col">
                      <label className="flex flex-col space-y-1">
                        <span className="text-sm font-semibold text-gray-800">Send Automatic Emails</span>
                      </label>
                      <span className="text-muted-foreground text-sm font-normal">
                        Automatically send emails when this service type is completed
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center gap-4">
                      <InputField
                        name={`${serviceType.id}.sendAutomaticEmails`}
                        type={FieldType.Switch}
                      />
                    </div>
                  </div>

                  {/* Email Content Fields */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800">Email Content</h4>
                    
                    {/* Header */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <div className="col-span-8 row-auto flex flex-col">
                        <label className="flex flex-col space-y-1">
                          <span className="text-sm font-semibold text-gray-800">
                            Email Header <EmailVariablesHelpLink onClick={() => setEmailVariablesModalOpen(true)} />
                            {isFreePlan && (
                              <span className="ml-1.5 text-xs font-medium text-blue-600">
                                (upgrade to grow plan to be able to edit)
                              </span>
                            )}
                          </span>
                        </label>
                        <span className="text-muted-foreground text-sm font-normal">
                          Custom header text for the email
                        </span>
                      </div>
                      <div className="col-span-4">
                        <textarea
                          {...form.register(`${serviceType.id}.header`)}
                          placeholder="Enter email header"
                          disabled={isFreePlan}
                          rows={3}
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            isFreePlan && "opacity-50 cursor-not-allowed bg-gray-100"
                          )}
                        />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <div className="col-span-8 row-auto flex flex-col">
                        <label className="flex flex-col space-y-1">
                          <span className="text-sm font-semibold text-gray-800">
                            Email Body <EmailVariablesHelpLink onClick={() => setEmailVariablesModalOpen(true)} />
                            {isFreePlan && (
                              <span className="ml-1.5 text-xs font-medium text-blue-600">
                                (upgrade to grow plan to be able to edit)
                              </span>
                            )}
                          </span>
                        </label>
                        <span className="text-muted-foreground text-sm font-normal">
                          Main content of the email
                        </span>
                      </div>
                      <div className="col-span-4">
                        <textarea
                          {...form.register(`${serviceType.id}.body`)}
                          placeholder="Enter email body"
                          disabled={isFreePlan}
                          rows={3}
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            isFreePlan && "opacity-50 cursor-not-allowed bg-gray-100"
                          )}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <div className="col-span-8 row-auto flex flex-col">
                        <label className="flex flex-col space-y-1">
                          <span className="text-sm font-semibold text-gray-800">
                            Email Footer <EmailVariablesHelpLink onClick={() => setEmailVariablesModalOpen(true)} />
                            {isFreePlan && (
                              <span className="ml-1.5 text-xs font-medium text-blue-600">
                                (upgrade to grow plan to be able to edit)
                              </span>
                            )}
                          </span>
                        </label>
                        <span className="text-muted-foreground text-sm font-normal">
                          Footer text for the email
                        </span>
                      </div>
                      <div className="col-span-4">
                        <textarea
                          {...form.register(`${serviceType.id}.footer`)}
                          placeholder="Enter email footer"
                          disabled={isFreePlan}
                          rows={3}
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                            isFreePlan && "opacity-50 cursor-not-allowed bg-gray-100"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Include in Emails */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800">Include in Emails</h4>
                    
                    {/* Technician Notes */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <GrowPlanSwitchLabel
                        label="Technician Notes"
                        description="Include technician notes in the email"
                        isFreePlan={isFreePlan}
                      />
                      <div className="col-span-4 flex items-center gap-4">
                        <InputField
                          disabled={isFreePlan}
                          name={`${serviceType.id}.technicianNotes`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>

                    {/* Reading Groups */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <GrowPlanSwitchLabel
                        label="Reading Groups"
                        description="Include reading groups data in the email"
                        isFreePlan={isFreePlan}
                      />
                      <div className="col-span-4 flex items-center gap-4">
                        <InputField
                          disabled={isFreePlan}
                          name={`${serviceType.id}.sendReadingsGroups`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>

                    {/* Consumable Groups */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <GrowPlanSwitchLabel
                        label="Consumable Groups"
                        description="Include consumable groups data in the email"
                        isFreePlan={isFreePlan}
                      />
                      <div className="col-span-4 flex items-center gap-4">
                        <InputField
                          disabled={isFreePlan}
                          name={`${serviceType.id}.sendConsumablesGroups`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>

                    {/* Photo Groups */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <div className="col-span-8 row-auto flex flex-col">
                        <label className="flex flex-col space-y-1">
                          <span className="text-sm font-semibold text-gray-800">Photo Groups</span>
                        </label>
                        <span className="text-muted-foreground text-sm font-normal">
                          Include photo groups in the email
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-4">
                        <InputField
                          name={`${serviceType.id}.sendPhotoGroups`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>

                    {/* Selector Groups */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <GrowPlanSwitchLabel
                        label="Selector Groups"
                        description="Include selector groups data in the email"
                        isFreePlan={isFreePlan}
                      />
                      <div className="col-span-4 flex items-center gap-4">
                        <InputField
                          disabled={isFreePlan}
                          name={`${serviceType.id}.sendSelectorsGroups`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                      <GrowPlanSwitchLabel
                        label="Checklist"
                        description="Include checklist data in the email"
                        isFreePlan={isFreePlan}
                      />
                      <div className="col-span-4 flex items-center gap-4">
                        <InputField
                          disabled={isFreePlan}
                          name={`${serviceType.id}.sendChecklist`}
                          type={FieldType.Switch}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="border-t pt-4">
                        <div className="flex justify-center">
                          <Button 
                            type="button"
                            disabled={updateEmailPreferences.isPending} 
                            className="w-full max-w-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveServiceTypeId(serviceType.id);
                              const formData = form.getValues();
                              const serviceTypeData = formData[serviceType.id];
                              if (serviceTypeData) {
                                handleServiceTypeSubmit(serviceType.id, serviceTypeData);
                              }
                            }}
                          >
                            {updateEmailPreferences.isPending ? (
                          <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
                        ) : (
                          `Save ${serviceType.name} Preferences`
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Unlock full email customization</DialogTitle>
            <DialogDescription className="text-left text-base text-foreground">
              To customize skipped-service notifications, email header, body, footer, and all inclusion options in service
              emails, upgrade to the Grow plan.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
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
              When enabled, clients will receive email notifications when services are skipped for the following reasons:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {SKIPPED_SERVICE_EMAIL_REASONS.map((reason) => (
              <div key={reason.title} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{reason.title}</p>
                  <p className="text-sm text-muted-foreground">{reason.description}</p>
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
              You can use the following variables in your email header, body, and footer. They will be replaced with real
              values when the email is sent:
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
                    <td className="px-3 py-2 text-muted-foreground">{replacedWith}</td>
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
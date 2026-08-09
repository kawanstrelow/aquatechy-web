'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, CalendarClock, Camera, Filter, Loader2Icon, Mail } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import InputField from '@/components/InputField';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  companyCreatePreferencesFormSchema,
  CompanyCreatePreferencesFormValues,
  getCompanyCreatePreferencesDefaults,
  toCompanyCreatePreferencesPayload
} from '@/schemas/companyCreatePreferences';
import { useUserStore } from '@/store/user';
import { FieldType } from '@/ts/enums/enums';
import { CompanyPreferencesOnCreate } from '@/ts/interfaces/Company';

type SwitchRowProps = {
  name: string;
  label: string;
  description: string;
  className?: string;
  disabled?: boolean;
  growOnly?: boolean;
};

function SwitchRow({ name, label, description, className, disabled, growOnly }: SwitchRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-3', disabled && 'opacity-60', className)}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium text-gray-900">
          {label}
          {growOnly && disabled && (
            <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>
          )}
        </p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">
        <InputField name={name} type={FieldType.Switch} disabled={disabled} />
      </div>
    </div>
  );
}

type SectionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

function SectionCard({ icon, title, description, children }: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50/80 px-5 py-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
          {icon}
        </div>
        <div className="min-w-0">
          <Typography element="h3" className="text-base font-semibold text-gray-900">
            {title}
          </Typography>
          <Typography element="p" className="mt-0.5 text-sm text-gray-600">
            {description}
          </Typography>
        </div>
      </div>
      <div className="space-y-1 px-5 py-2">{children}</div>
    </section>
  );
}

type PhotoPrefsBlockProps = {
  title: string;
  helper: string;
  prefix: 'beforeService' | 'afterService';
  showSendOnEmail: boolean;
};

function PhotoPrefsBlock({ title, helper, prefix, showSendOnEmail }: PhotoPrefsBlockProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{helper}</p>
      </div>
      <div className="divide-y divide-gray-200">
        <SwitchRow
          name={`${prefix}.isRequired`}
          label="Required on every visit"
          description="Technician must take this photo before finishing the service"
        />
        <SwitchRow
          name={`${prefix}.allowGallery`}
          label="Allow gallery upload"
          description="Technician can pick an existing photo instead of using the camera"
        />
        {showSendOnEmail && (
          <SwitchRow
            name={`${prefix}.sendOnEmail`}
            label="Attach to client email"
            description="Include this photo when service report emails are sent"
          />
        )}
      </div>
    </div>
  );
}

type CompanyCreatePreferencesFormProps = {
  companyEmail?: string;
  isSubmitting?: boolean;
  onBack: () => void;
  onSubmit: (preferences: CompanyPreferencesOnCreate) => void;
};

export function CompanyCreatePreferencesForm({
  companyEmail = '',
  isSubmitting = false,
  onBack,
  onSubmit
}: CompanyCreatePreferencesFormProps) {
  const { isFreePlan } = useUserStore(
    useShallow((state) => ({
      isFreePlan: state.isFreePlan
    }))
  );

  const form = useForm<CompanyCreatePreferencesFormValues>({
    resolver: zodResolver(companyCreatePreferencesFormSchema),
    defaultValues: getCompanyCreatePreferencesDefaults(companyEmail)
  });

  const sendAutomaticEmails = form.watch('sendAutomaticEmails');
  const sendPhotoGroups = form.watch('sendPhotoGroups');

  useEffect(() => {
    if (companyEmail && !form.getValues('ccEmail')) {
      form.setValue('ccEmail', companyEmail);
    }
  }, [companyEmail, form]);

  // Keep Grow-only options off while on Free plan
  useEffect(() => {
    if (!isFreePlan) return;

    form.setValue('sendFilterCleaningEmails', false);
    form.setValue('filterCleaningMustHavePhotos', false);
    form.setValue('sendReadingsGroups', false);
    form.setValue('sendConsumablesGroups', false);
    form.setValue('technicianNotes', false);
    form.setValue('sendChecklist', false);
  }, [isFreePlan, form]);

  const handleSubmit = (values: CompanyCreatePreferencesFormValues) => {
    const payloadValues = isFreePlan
      ? {
          ...values,
          sendFilterCleaningEmails: false,
          filterCleaningMustHavePhotos: false,
          sendReadingsGroups: false,
          sendConsumablesGroups: false,
          technicianNotes: false,
          sendChecklist: false
        }
      : values;

    onSubmit(toCompanyCreatePreferencesPayload(payloadValues));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4">
            <Typography element="h2" className="text-xl font-semibold text-gray-900">
              Set your defaults
            </Typography>
            <Typography element="p" className="mt-1 text-sm text-gray-600">
              We pre-filled recommended settings for most pool companies. Review them below — you can always change these
              later in company settings.
            </Typography>
            {isFreePlan && (
              <Typography element="p" className="mt-2 text-sm text-blue-800">
                Some email and filter options are available only on the Grow plan and stay disabled here.
              </Typography>
            )}
          </div>

          <SectionCard
            icon={<Mail className="h-4 w-4" />}
            title="Client emails"
            description="Choose when clients (and your office) get notified by email."
          >
            <div className="space-y-4 py-3">
              <div>
                <InputField
                  name="ccEmail"
                  label="Office CC email"
                  placeholder="office@example.com"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Receives a copy of service-related emails so your team stays in the loop.
                </p>
              </div>

              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-4">
                <SwitchRow
                  name="sendAutomaticEmails"
                  label="Send service report after Pool Cleaning"
                  description="When a Pool Cleaning visit is completed, email the client a service report"
                />
                <SwitchRow
                  name="sendSkippedServiceEmails"
                  label="Notify clients when a visit is skipped"
                  description="For example weather, locked gate, unsecured pet, or too much debris"
                />
                <SwitchRow
                  name="sendFilterCleaningEmails"
                  label="Notify clients after filter cleaning"
                  description="Email the client when filter cleaning work is finished"
                  disabled={isFreePlan}
                  growOnly
                />
              </div>
            </div>

            {sendAutomaticEmails && (
              <div className="border-t border-gray-100 py-4">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-900">What to include in the service report email</p>
                  <p className="text-sm text-gray-500">
                    On the Free plan only photos can be attached. Upgrade to Grow to include readings, chemicals, notes,
                    and checklist.
                  </p>
                </div>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-4">
                  <SwitchRow
                    name="sendReadingsGroups"
                    label="Water readings"
                    description="Measurements taken at the pool, like chlorine, pH, and alkalinity"
                    disabled={isFreePlan}
                    growOnly
                  />
                  <SwitchRow
                    name="sendConsumablesGroups"
                    label="Chemicals used"
                    description="Products added during the visit, like chlorine tabs or acid"
                    disabled={isFreePlan}
                    growOnly
                  />
                  <SwitchRow
                    name="sendPhotoGroups"
                    label="Photos"
                    description="Service photos taken during the visit"
                  />
                  <SwitchRow
                    name="technicianNotes"
                    label="Technician notes"
                    description="Written notes the technician left about the visit"
                    disabled={isFreePlan}
                    growOnly
                  />
                  <SwitchRow
                    name="sendChecklist"
                    label="Checklist"
                    description="Completed checklist items from the visit"
                    disabled={isFreePlan}
                    growOnly
                  />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={<Camera className="h-4 w-4" />}
            title="Service photos"
            description="Rules for the default before and after photos on Pool Cleaning visits."
          >
            <div className="grid grid-cols-1 gap-4 py-3 lg:grid-cols-2">
              <PhotoPrefsBlock
                title="Before service"
                helper="Usually a snapshot of the pool when the tech arrives"
                prefix="beforeService"
                showSendOnEmail={sendAutomaticEmails && sendPhotoGroups}
              />
              <PhotoPrefsBlock
                title="After service"
                helper="Usually a snapshot of the pool when the tech finishes"
                prefix="afterService"
                showSendOnEmail={sendAutomaticEmails && sendPhotoGroups}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<Filter className="h-4 w-4" />}
            title="Filter maintenance"
            description="How often filters should be cleaned or replaced, and whether photos are required."
          >
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="filterCleaningIntervalDays"
                  label="Clean every (days)"
                  type={FieldType.Number}
                  placeholder="28"
                />
                <InputField
                  name="filterReplacementIntervalDays"
                  label="Replace every (days)"
                  type={FieldType.Number}
                  placeholder="365"
                />
              </div>

              <div className="rounded-lg border border-gray-200 px-4">
                <SwitchRow
                  name="filterCleaningMustHavePhotos"
                  label="Require photos for filter work"
                  description="Technicians must photograph filter cleaning or replacement before marking it done"
                  disabled={isFreePlan}
                  growOnly
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<CalendarClock className="h-4 w-4" />}
            title="Scheduling"
            description="Control whether services can be completed ahead of schedule."
          >
            <div className="rounded-lg border border-gray-200 px-4 my-3">
              <SwitchRow
                name="allowAnticipatedServices"
                label="Allow anticipated services"
                description="Let technicians complete a visit before its scheduled date when it makes sense"
              />
            </div>
          </SectionCard>

          <div className="flex justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Save & continue'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

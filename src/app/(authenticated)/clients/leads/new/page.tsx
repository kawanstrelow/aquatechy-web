'use client';

import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AddressInput } from '@/components/AddressInput';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { Stepper, useSteps } from '@/components/stepper';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useCreateLead } from '@/hooks/react-query/leads/useCreateLead';
import { useCreateLeadAssignment } from '@/hooks/react-query/leads/useCreateLeadAssignment';
import { createLeadSchema, CreateLeadFormValues, toCreateLeadRequest } from '@/schemas/lead';
import { FieldType } from '@/ts/enums/enums';

import { LeadVisitForm, LeadVisitValues } from '../_components/LeadVisitForm';
import { managedCompanies } from '../managedCompanies';

export default function Page() {
  const t = useTranslations('clients');
  const router = useRouter();
  const [showNoCompaniesDialog, setShowNoCompaniesDialog] = useState(false);
  const savingRef = useRef(false);
  const { data: companies = [], isLoading: isCompaniesLoading, isSuccess: isCompaniesSuccess } = useGetCompanies();
  const companiesIManage = managedCompanies(companies);
  const createLead = useCreateLead();
  const createLeadAssignment = useCreateLeadAssignment();
  const steps = useSteps([
    { index: 0, active: true, complete: false, title: t('fields.lead') },
    { index: 1, active: false, complete: false, title: t('fields.visit') }
  ]);
  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      companyOwnerId: '',
      firstName: '',
      lastName: '',
      address: '',
      addressLine2: '',
      city: '',
      state: '',
      zip: '',
      notes: '',
      contactMethod: undefined,
      email: '',
      phone: ''
    }
  });
  const companyOwnerId = form.watch('companyOwnerId');
  const contactMethod = form.watch('contactMethod');
  const onlyCompanyId = companiesIManage.length === 1 ? companiesIManage[0].id : undefined;
  const isSaving = createLead.isPending || createLeadAssignment.isPending;
  const hasNoCompanies = companies.length === 0;

  useEffect(() => {
    if (isCompaniesSuccess && onlyCompanyId) {
      form.setValue('companyOwnerId', onlyCompanyId, { shouldValidate: true });
    }
  }, [form, isCompaniesSuccess, onlyCompanyId]);

  useEffect(() => {
    if (isCompaniesSuccess && companiesIManage.length === 0) {
      setShowNoCompaniesDialog(true);
    }
  }, [companiesIManage.length, isCompaniesSuccess]);

  function openLead(leadId: string) {
    router.push(`/clients/leads/${leadId}`);
  }

  async function saveLeadOnly() {
    if (savingRef.current) return;
    const isValid = await form.trigger();
    if (!isValid) {
      steps.goToStep(0);
      return;
    }

    savingRef.current = true;
    try {
      const created = await createLead.mutateAsync(toCreateLeadRequest(form.getValues()));
      openLead(created.id);
    } catch {
      savingRef.current = false;
    }
  }

  async function saveLeadWithVisit(visit: LeadVisitValues) {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const created = await createLeadAssignment.mutateAsync({
        ...toCreateLeadRequest(form.getValues()),
        assignmentToId: visit.assignmentToId,
        startOn: visit.startOn,
        weekday: visit.weekday,
        frequency: 'WEEKLY',
        ...(visit.serviceTypeId ? { serviceTypeId: visit.serviceTypeId } : {}),
        ...(visit.instructions ? { instructions: visit.instructions } : {})
      });
      openLead(created.id);
    } catch {
      savingRef.current = false;
    }
  }

  return (
    <div className="w-full p-2">
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Stepper steps={steps.stepsData} goToStep={steps.goToStep} />
        </div>
        <div className="flex w-full flex-col gap-4 px-5 py-5 lg:px-8 lg:py-6">
          {steps.currentStepIndex === 0 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(() => steps.nextStep())} className="flex w-full flex-col gap-4">
                <Typography element="h2" className="text-base">
                  Lead
                </Typography>
                <SelectField
                  name="companyOwnerId"
                  label={t('fields.company')}
                  placeholder={t('fields.company')}
                  options={companiesIManage.map((company) => ({
                    key: company.id,
                    name: company.name,
                    value: company.id
                  }))}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField name="firstName" label={t('fields.firstName')} placeholder={t('fields.firstName')} />
                  <InputField name="lastName" label={t('fields.lastName')} placeholder={t('fields.lastName')} />
                </div>
                <AddressInput
                  name="address"
                  label={t('fields.address')}
                  placeholder={t('fields.streetAddress')}
                  onAddressSelect={({ state, city, zipCode }) => {
                    form.setValue('state', state, { shouldValidate: true });
                    setTimeout(() => {
                      form.setValue('city', city, { shouldValidate: true });
                      form.setValue('zip', zipCode, { shouldValidate: true });
                    }, 500);
                  }}
                />
                <InputField
                  name="addressLine2"
                  label={t('fields.addressLine2Sentence')}
                  placeholder={t('fields.aptSuite')}
                />
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <StateAndCitySelect stateName="state" cityName="city" />
                  <InputField
                    name="zip"
                    label={t('fields.zipCode')}
                    placeholder={t('fields.zipCode')}
                    type={FieldType.Zip}
                  />
                </div>
                <SelectField
                  name="contactMethod"
                  label={t('fields.contact')}
                  placeholder={t('fields.phoneOrEmail')}
                  options={[
                    { key: 'phone', value: 'phone', name: t('fields.phone') },
                    { key: 'email', value: 'email', name: t('fields.email') }
                  ]}
                  onValueChange={(value) => {
                    if (value === 'email') form.setValue('phone', '');
                    if (value === 'phone') form.setValue('email', '');
                  }}
                />
                {contactMethod === 'phone' && (
                  <InputField
                    name="phone"
                    label={t('fields.phone')}
                    placeholder={t('fields.phone')}
                    type={FieldType.Phone}
                  />
                )}
                {contactMethod === 'email' && (
                  <InputField name="email" label={t('fields.email')} placeholder={t('fields.email')} />
                )}
                <InputField
                  name="notes"
                  label={t('fields.notes')}
                  placeholder={t('fields.notes')}
                  type={FieldType.TextArea}
                  className="h-28"
                />
                <Button type="submit" className="self-end" disabled={isCompaniesLoading}>
                  {t('shared.next')}
                </Button>
              </form>
            </Form>
          )}

          {steps.currentStepIndex === 1 && (
            <div className="flex w-full flex-col gap-4">
              <Typography element="h2" className="text-base">
                {t('fields.visit')}
              </Typography>
              <LeadVisitForm
                companyOwnerId={companyOwnerId}
                scheduleOnce
                onCollect={saveLeadWithVisit}
                onSkip={saveLeadOnly}
                onPrevious={steps.prevStep}
                isSubmitting={isSaving}
                submitLabel={t('leads.createLead')}
              />
            </div>
          )}
        </div>
      </div>
      <Dialog open={showNoCompaniesDialog} onOpenChange={setShowNoCompaniesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              {hasNoCompanies ? t('leads.noCompanies') : t('leads.limitedTitle')}
            </DialogTitle>
            <DialogDescription>
              {hasNoCompanies ? t('leads.createCompanyFirst') : t('leads.officeOnly')}
            </DialogDescription>
          </DialogHeader>
          {hasNoCompanies && (
            <Button onClick={() => router.push('/settings/companies')}>{t('shared.createCompany')}</Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

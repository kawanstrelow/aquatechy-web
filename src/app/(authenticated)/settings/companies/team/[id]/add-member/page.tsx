'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { AddressInput } from '@/components/AddressInput';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { useInviteMemberToACompany } from '@/hooks/react-query/companies/inviteMember';
import { Company } from '@/ts/interfaces/Company';
import { FieldType, IanaTimeZones } from '@/ts/enums/enums';
import { canManageCompanyTeam, getMemberRoleSelectOptions, toAssignableRoleEnum } from '@/utils/companyRoles';

function createExistingUserSchema(actorRole: string) {
  return z.object({
    companyId: z.string().min(1, { message: 'Company must be selected.' }),
    email: z.string().email({ message: 'Invalid email format.' }),
    role: z.enum(toAssignableRoleEnum(actorRole))
  });
}

function createNewUserSchema(actorRole: string) {
  return createExistingUserSchema(actorRole).extend({
    firstName: z.string().min(1, { message: 'First name is required.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    company: z.string().min(1, { message: 'Company is required.' }),
    phone: z.string().min(1, { message: 'Phone is required.' }),
    address: z.string().min(1, { message: 'Address is required.' }),
    city: z.string().min(1, { message: 'City is required.' }),
    state: z.string().min(1, { message: 'State is required.' }),
    zip: z.string().min(1, { message: 'ZIP code is required.' }),
    addressLine2: z.optional(z.string().trim())
  });
}

function isValidObjectId(id: string): boolean {
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  return objectIdRegex.test(id);
}

type Props = {
  params: { id: string };
};

export default function AddMemberPage({ params: { id } }: Props) {
  if (!id || !isValidObjectId(id)) {
    notFound();
  }

  const router = useRouter();
  const { data: company, isLoading: isCompanyLoading } = useGetCompany(id);
  const { data: companies, isLoading: isLoadingCompanies } = useGetCompanies();
  const myRole = companies?.find((c) => c.id === id)?.role;

  useEffect(() => {
    if (isCompanyLoading || isLoadingCompanies) return;
    if (!canManageCompanyTeam(myRole)) {
      router.replace('/settings/companies');
    }
  }, [isCompanyLoading, isLoadingCompanies, myRole, router]);

  if (isCompanyLoading || isLoadingCompanies) {
    return <LoadingSpinner />;
  }

  if (!canManageCompanyTeam(myRole) || !myRole) {
    return <LoadingSpinner />;
  }

  return <AddMemberContent id={id} myRole={myRole} company={company as Company | undefined} />;
}

function AddMemberContent({ id, myRole, company }: { id: string; myRole: string; company?: Company }) {
  const router = useRouter();
  const { mutate: inviteMember, isPending } = useInviteMemberToACompany();
  const roleOptions = getMemberRoleSelectOptions(myRole);
  const [step, setStep] = useState<null | 'existing' | 'new'>(null);

  const existingUserSchema = useMemo(() => createExistingUserSchema(myRole), [myRole]);
  const newUserSchema = useMemo(() => createNewUserSchema(myRole), [myRole]);

  const redirectAfterInvite = () => {
    router.push(`/settings/companies/team/${id}`);
  };

  const existingUserForm = useForm<z.infer<ReturnType<typeof createExistingUserSchema>>>({
    resolver: zodResolver(existingUserSchema),
    defaultValues: {
      companyId: id,
      email: '',
      role: 'Cleaner'
    }
  });

  const newUserForm = useForm<z.infer<ReturnType<typeof createNewUserSchema>>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      companyId: id,
      email: '',
      role: 'Cleaner',
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      addressLine2: ''
    }
  });

  useEffect(() => {
    existingUserForm.setValue('companyId', id);
    newUserForm.setValue('companyId', id);
  }, [id, existingUserForm, newUserForm]);

  useEffect(() => {
    if (company?.name && newUserForm.getValues('company') === '') {
      newUserForm.setValue('company', company.name);
    }
  }, [company, newUserForm]);

  const handleAddressSelect = (address: {
    fullAddress: string;
    state: string;
    city: string;
    zipCode: string;
    timezone: IanaTimeZones;
    addressLine2?: string;
  }) => {
    newUserForm.setValue('address', address.fullAddress);
    newUserForm.setValue('state', address.state);
    newUserForm.setValue('city', address.city);
    newUserForm.setValue('zip', address.zipCode);
    newUserForm.setValue('addressLine2', address.addressLine2);
  };

  function handleExistingUserSubmit(data: z.infer<ReturnType<typeof createExistingUserSchema>>) {
    inviteMember(
      {
        userInvitedEmail: data.email,
        companyId: data.companyId,
        role: data.role,
        userAlreadyExists: true
      },
      {
        onSuccess: () => {
          redirectAfterInvite();
        }
      }
    );
  }

  function handleNewUserSubmit(data: z.infer<ReturnType<typeof createNewUserSchema>>) {
    inviteMember(
      {
        userInvitedEmail: data.email,
        companyId: data.companyId,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        userAlreadyExists: false,
        addressLine2: data.addressLine2 || ''
      },
      {
        onSuccess: () => {
          redirectAfterInvite();
        }
      }
    );
  }

  const handleBack = () => setStep(null);
  const companyName = company?.name ?? '';

  if (!step) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-5 lg:p-8">
        <div className="mb-6 w-full max-w-md self-start">
          <Button variant="ghost" className="gap-2" onClick={() => router.push(`/settings/companies/team/${id}`)}>
            <ArrowLeftIcon className="h-4 w-4" />
            Back to company
          </Button>
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Add New Member
          {companyName ? <span className="mt-2 block text-lg font-medium text-gray-600">{companyName}</span> : null}
        </h1>
        <div className="mt-6 flex w-full max-w-md flex-col gap-4">
          <Button className="md:min-h-auto min-h-[3rem] w-full py-4 text-center md:py-2" onClick={() => setStep('new')}>
            The user is new on Aquatechy
          </Button>
          <Button
            className="md:min-h-auto min-h-[3rem] w-full py-4 text-center md:py-2"
            variant="outline"
            onClick={() => setStep('existing')}
          >
            The user already has an account on Aquatechy
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'existing') {
    return (
      <div className="w-full p-5 lg:p-8">
        <div
          className="mb-6 flex cursor-pointer items-center rounded-lg p-2 transition-colors hover:bg-gray-50"
          onClick={handleBack}
        >
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm font-normal text-gray-600">Back</span>
        </div>
        <div className="mx-auto w-full">
          <h1 className="mb-8 text-2xl font-bold text-gray-900">Invite Existing User</h1>
          <Form {...existingUserForm}>
            <form onSubmit={existingUserForm.handleSubmit(handleExistingUserSubmit)} className="space-y-6">
              <input type="hidden" {...existingUserForm.register('companyId')} />
              <InputField name="email" label="User E-mail" placeholder="Enter user e-mail" />
              <SelectField name="role" label="Role" placeholder="Select role" options={roleOptions} />
              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Inviting...' : 'Invite Member'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-5 lg:p-8">
      <div
        className="mb-6 flex cursor-pointer items-center rounded-lg p-2 transition-colors hover:bg-gray-50"
        onClick={handleBack}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-normal text-gray-600">Back</span>
      </div>
      <div className="mx-auto w-full">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Create and Invite New User</h1>
        <Form {...newUserForm}>
          <form onSubmit={newUserForm.handleSubmit(handleNewUserSubmit)} className="space-y-6">
            <input type="hidden" {...newUserForm.register('companyId')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField name="firstName" label="First Name" placeholder="Enter first name" />
              <InputField name="lastName" label="Last Name" placeholder="Enter last name" />
              <InputField name="company" label="Company" placeholder="Enter company name" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField name="email" label="Email" placeholder="Enter email address" />
              <InputField name="phone" label="Phone" placeholder="Enter phone number" type={FieldType.Phone} />
            </div>
            <div className="space-y-4">
              <AddressInput
                name="address"
                label="Address"
                placeholder="Enter address"
                onAddressSelect={handleAddressSelect}
              />
              <InputField name="addressLine2" label="Address Line 2" placeholder="Apt, suite, unit" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField name="state" label="State" placeholder="State" />
                <InputField name="city" label="City" placeholder="City" />
                <InputField name="zip" label="ZIP Code" placeholder="ZIP code" />
              </div>
            </div>
            <SelectField name="role" label="Role" placeholder="Select role" options={roleOptions} />
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Inviting...' : 'Invite Member'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

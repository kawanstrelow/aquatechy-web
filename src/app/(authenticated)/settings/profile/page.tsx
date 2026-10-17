'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ModalDeleteAccount } from '@/app/(authenticated)/account/ModalDeleteAccount';
import ChangePasswordDialog from '@/app/(authenticated)/account/change-password-modal';
import { AddressInput } from '@/components/AddressInput';
import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useUpdateUser } from '@/hooks/react-query/user/updateUser';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { useUserStore } from '@/store/user';
import { FieldType, IanaTimeZones, LanguageOptions } from '@/ts/enums/enums';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  firstName: defaultSchemas.firstName,
  lastName: defaultSchemas.lastName,
  company: defaultSchemas.company,
  phone: defaultSchemas.phone,
  email: defaultSchemas.email,
  address: defaultSchemas.address,
  zip: defaultSchemas.zipCode,
  state: defaultSchemas.state,
  city: defaultSchemas.city,
  language: defaultSchemas.language,
  addressLine2: defaultSchemas.addressLine2
});

export type IUserSchema = z.infer<typeof formSchema>;

export default function Page() {
  const user = useUserStore((state) => state.user);
  const { mutate, isPending, isSuccess } = useUpdateUser(user.id);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const form = useForm<IUserSchema>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      company: user?.company || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: user?.address || '',
      zip: user?.zip || '',
      state: user?.state || '',
      city: user?.city || '',
      language: user?.language || LanguageOptions.English,
      addressLine2: user?.addressLine2 || ''
    },
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    if (user.firstName === '') {
      setShowModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Account updated successfully',
        description: 'Your account has been updated successfully',
        variant: 'success'
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  }, [isSuccess, router]);

  if (isPending) return <LoadingSpinner />;

  function handleSubmit(data: IUserSchema) {
    mutate(data);
  }

  const handleAddressSelect = (address: {
    fullAddress: string;
    state: string;
    city: string;
    zipCode: string;
    timezone: IanaTimeZones;
    addressLine2?: string;
  }) => {
    form.setValue('address', address.fullAddress);
    form.setValue('state', address.state);
    form.setValue('city', address.city);
    form.setValue('zip', address.zipCode);
    form.setValue('addressLine2', address.addressLine2 || '');
  };

  return (
    <Form {...form}>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="inline-flex w-full flex-col items-start justify-start gap-4 px-5 py-5 lg:px-8 lg:py-6">
            <Typography element="h3">Basic Information</Typography>
            <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
              <InputField name="firstName" label="First Name" placeholder="First Name" />
              <InputField name="lastName" label="Last Name" placeholder="Last Name" />
              <InputField name="company" label="Company" placeholder="Company" />
            </div>
            <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
              <AddressInput
                name="address"
                label="Address"
                placeholder="Enter your address"
                onAddressSelect={handleAddressSelect}
              />
              <InputField name="addressLine2" label="Address Line 2" placeholder="Apt, suite, unit" />
              <InputField name="state" label="State" placeholder="State" />
              <InputField name="city" label="City" placeholder="City" />
              <InputField name="zip" label="Zip Code" placeholder="Zip Code" />
            </div>
            <Typography element="h3">Contact Information</Typography>
            <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
              <InputField name="phone" placeholder="Phone" label="Phone" type={FieldType.Phone} />
              <InputField disabled name="email" placeholder="E-mail" label="E-mail" />
            </div>
            <Button type="submit" className="h-10">
              Update account
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-4 border-t border-line px-5 py-5 md:flex-row lg:px-8">
          <ChangePasswordDialog />
          <ModalDeleteAccount />
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogTitle className="text-center">Welcome to Aquatechy!</DialogTitle>
          <DialogDescription className="text-center">
            Before start using the app, <b>you must complete</b> your profile.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </Form>
  );
}

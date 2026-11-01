import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { Form } from '@/components/ui/form';
import { paymentType } from '@/constants';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { useUserStore } from '@/store/user';
import { FieldType } from '@/ts/enums/enums';

import { Button } from '../../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../../components/ui/dialog';
import { useEditCompany } from '@/hooks/react-query/companies/updateCompany';
import { Company } from '@/ts/interfaces/Company';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';

export const updateCompanySchema = z.object({
  companyId: z
    .string({
      required_error: 'settings.errors.companyIdRequired',
      invalid_type_error: 'settings.errors.companyIdInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.companyIdMin' }),
  name: z
    .string({
      required_error: 'settings.errors.nameRequired',
      invalid_type_error: 'settings.errors.nameInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.nameMin' })
    .optional(),
  phone: z
    .string({
      required_error: 'settings.errors.phoneRequired',
      invalid_type_error: 'settings.errors.phoneInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.phoneMin' })
    .optional(),
  address: z
    .string({
      required_error: 'settings.errors.addressRequired',
      invalid_type_error: 'settings.errors.addressInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.addressMin' })
    .optional(),
  city: z
    .string({
      required_error: 'settings.errors.cityRequired',
      invalid_type_error: 'settings.errors.cityInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.cityMin' })
    .optional(),
  state: z
    .string({
      required_error: 'settings.errors.stateRequired',
      invalid_type_error: 'settings.errors.stateInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.stateMin' })
    .optional(),
  zip: z
    .string({
      required_error: 'settings.errors.zipRequired',
      invalid_type_error: 'settings.errors.zipInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.zipMin' })
    .optional(),
  status: z
    .enum(['Active', 'Inactive'], {
      required_error: 'settings.errors.statusRequired',
      invalid_type_error: 'settings.errors.statusInvalid'
    })
    .optional(),
  email: z
    .string({
      required_error: 'settings.errors.emailRequired',
      invalid_type_error: 'settings.errors.emailInvalidType'
    })
    .trim(),
  addressLine2: z.optional(z.string().trim())
});

export type FormSchema = z.infer<typeof updateCompanySchema>;

type PropsEdit = {
  children: React.ReactNode;
  companyId: string;
};

export function ModalEditCompany({ children, companyId }: PropsEdit) {
  const t = useTranslations('settings');

  const { data: companies, isLoading, isSuccess } = useGetCompanies();
  const { handleSubmit } = useEditCompany();

  // search on user.workRelationsAsAEmployer and user.workRelationsAsASubcontractor

  let selectedCompany: Company | undefined = undefined;
  selectedCompany = companies.find((company) => company.id === companyId);

  const form = useForm<FormSchema>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: selectedCompany?.name,
      phone: selectedCompany?.phone,
      address: selectedCompany?.address,
      city: selectedCompany?.city,
      state: selectedCompany?.state,
      zip: selectedCompany?.zip,
      status: selectedCompany?.status,
      email: selectedCompany?.email
    }
  });

  function handleEditCompany() {
    const a = {
      companyId: companyId,
      name: form.getValues('name'),
      phone: form.getValues('phone'),
      address: form.getValues('address'),
      city: form.getValues('city'),
      state: form.getValues('state'),
      zip: form.getValues('zip'),
      status: form.getValues('status'),
      email: form.getValues('email')
    };

    handleSubmit(a);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogTitle>{t('companies.editCompany')}</DialogTitle>
        <DialogHeader></DialogHeader>
        <Form {...form}>
          <form onSubmit={handleEditCompany}>
            <div className="inline-flex w-full flex-col items-start justify-start gap-8 bg-white">
              <div className="justify-start self-stretch">
                <div className="mb-4">
                  <InputField name="name" label={t('fields.name')} placeholder={t('fields.nameLower')} />
                </div>

                <div className="mb-4">
                  <InputField name="email" label={t('email')} placeholder={t('email')} />
                </div>

                <div className="mb-4">
                  <InputField name="phone" label={t('phone')} placeholder={t('fields.phoneLower')} />
                </div>

                <div className="mb-4">
                  <InputField name="address" label={t('address')} placeholder={t('address')} />
                </div>

                <div className="mb-4">
                  <InputField name="city" label={t('city')} placeholder={t('city')} />
                </div>

                <div className="mb-4">
                  <InputField name="state" label={t('state')} placeholder={t('state')} />
                </div>

                <div className="mb-4">
                  <InputField name="zip" label={t('fields.zip')} placeholder={t('fields.zip')} />
                </div>
              </div>

              <DialogTrigger asChild>
                <Button className="w-full" type="submit">
                  {t('actions.save')}
                </Button>
              </DialogTrigger>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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

const schema = z.object({
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
  addressLine2: z.optional(z.string().trim())
});

export type FormSchema = z.infer<typeof schema>;

type PropsView = {
  children: React.ReactNode;
  companyId: string;
};

export function ModalViewCompany({ children, companyId }: PropsView) {
  const t = useTranslations('settings');

  const { data: companies, isLoading } = useGetCompanies();

  // search on user.workRelationsAsAEmployer and user.workRelationsAsASubcontractor

  let selectedCompany: Company | undefined = undefined;
  selectedCompany = companies.find((company) => company.id === companyId);

  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: selectedCompany?.name,
      phone: selectedCompany?.phone,
      address: selectedCompany?.address,
      city: selectedCompany?.city,
      state: selectedCompany?.state,
      zip: selectedCompany?.zip,
      status: selectedCompany?.status,
      addressLine2: selectedCompany?.addressLine2 || ''
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogTitle>{t('companies.viewCompany')}</DialogTitle>
        <DialogHeader></DialogHeader>
        <Form {...form}>
          <form>
            <div className="inline-flex w-full flex-col items-start justify-start gap-8">
              <div className="justify-start self-stretch">
                <div className="mb-4">
                  <InputField name="name" label={t('fields.name')} disabled placeholder={t('fields.nameLower')} />
                </div>

                <div className="mb-4">
                  <InputField name="phone" label={t('phone')} disabled placeholder={t('fields.phoneLower')} />
                </div>

                <div className="mb-4">
                  <InputField name="address" label={t('address')} disabled placeholder={t('address')} />
                </div>
                <div className="mb-4">
                  <InputField name="addressLine2" label={t('addressLine2')} disabled placeholder={t('addressLine2')} />
                </div>
                <div className="mb-4">
                  <InputField name="city" label={t('city')} disabled placeholder={t('city')} />
                </div>

                <div className="mb-4">
                  <InputField name="state" label={t('state')} disabled placeholder={t('state')} />
                </div>

                <div className="mb-4">
                  <InputField name="zip" label={t('fields.zip')} disabled placeholder={t('fields.zip')} />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

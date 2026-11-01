import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import { Form } from '@/components/ui/form';

import { Button } from '../../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../../components/ui/dialog';

import { useEditCompanyMember } from '@/hooks/react-query/companies/updateCompanyMember';
import SelectField from '@/components/SelectField';
import { getMemberRoleSelectOptions, toAssignableRoleEnum } from '@/utils/companyRoles';

function createSchema(actorRole?: string | null) {
  return z.object({
    company: z.object({
      id: z
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
    }),
    id: z
      .string({
        required_error: 'settings.errors.idRequired',
        invalid_type_error: 'settings.errors.idInvalidType'
      })
      .trim()
      .min(1, { message: 'settings.errors.idMin' }),
    firstName: z
      .string({
        required_error: 'settings.errors.firstNameRequired',
        invalid_type_error: 'settings.errors.firstNameInvalidType'
      })
      .trim()
      .min(1, { message: 'settings.errors.firstNameMin' }),
    lastName: z
      .string({
        required_error: 'settings.errors.lastNameRequired',
        invalid_type_error: 'settings.errors.lastNameInvalidType'
      })
      .trim()
      .min(1, { message: 'settings.errors.lastNameMin' }),
    email: z
      .string({
        required_error: 'settings.errors.emailRequired',
        invalid_type_error: 'settings.errors.emailInvalidType'
      })
      .email({ message: 'settings.errors.emailInvalid' }),
    phone: z
      .string({
        required_error: 'settings.errors.phoneRequired',
        invalid_type_error: 'settings.errors.phoneInvalidType'
      })
      .trim()
      .min(1, { message: 'settings.errors.phoneMin' }),
    role: z.enum(toAssignableRoleEnum(actorRole), {
      required_error: 'settings.errors.roleRequired',
      invalid_type_error: 'settings.errors.roleNotAssignable'
    })
  });
}

type FormSchema = z.infer<ReturnType<typeof createSchema>>;

type PropsEdit = {
  children: React.ReactNode;
  id: string;
  company: {
    id: string;
    name: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
  actorRole?: string;
};

export function ModalEditCompanyMember({
  children,
  id,
  company,
  email,
  firstName,
  lastName,
  phone,
  role,
  actorRole
}: PropsEdit) {
  const t = useTranslations('settings');

  const { handleSubmit } = useEditCompanyMember();
  const schema = useMemo(() => createSchema(actorRole), [actorRole]);
  const roleOptions = getMemberRoleSelectOptions(actorRole);

  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: {
        id: company.id,
        name: company.name
      },
      id,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      role: role as FormSchema['role']
    }
  });

  function handleEditCompanyMember(data: FormSchema) {
    const a = {
      companyId: data.company.id,
      companyMemberId: data.id,
      role: data.role
    };

    handleSubmit(a);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogTitle>{t('companies.editMember')}</DialogTitle>
        <DialogHeader></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleEditCompanyMember(data))}>
            <div className="justify-start self-stretch">
              <div className="h-[10px]" />
              <InputField name="email" label={t('email')} placeholder={t('email')} disabled className="mb-2" />
            </div>
            <SelectField
              name="role"
              placeholder={t('companies.selectRole')}
              label={t('companies.role')}
              options={roleOptions}
            />

            <DialogTrigger asChild>
              <Button className="mt-12 w-full" type="submit">
                {t('actions.save')}
              </Button>
            </DialogTrigger>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

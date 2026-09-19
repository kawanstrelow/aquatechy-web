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
          required_error: 'companyId is required.',
          invalid_type_error: 'companyId must be a string.'
        })
        .trim()
        .min(1, { message: 'companyId must be at least 1 character.' }),
      name: z
        .string({
          required_error: 'name is required.',
          invalid_type_error: 'name must be a string.'
        })
        .trim()
        .min(1, { message: 'name must be at least 1 character.' })
    }),
    id: z
      .string({
        required_error: 'id is required.',
        invalid_type_error: 'id must be a string.'
      })
      .trim()
      .min(1, { message: 'id must be at least 1 character.' }),
    firstName: z
      .string({
        required_error: 'firstName is required.',
        invalid_type_error: 'firstName must be a string.'
      })
      .trim()
      .min(1, { message: 'firstName must be at least 1 character.' }),
    lastName: z
      .string({
        required_error: 'lastName is required.',
        invalid_type_error: 'lastName must be a string.'
      })
      .trim()
      .min(1, { message: 'lastName must be at least 1 character.' }),
    email: z
      .string({
        required_error: 'email is required.',
        invalid_type_error: 'email must be a string.'
      })
      .email({ message: 'Invalid email' }),
    phone: z
      .string({
        required_error: 'phone is required.',
        invalid_type_error: 'phone must be a string.'
      })
      .trim()
      .min(1, { message: 'phone must be at least 1 character.' }),
    role: z.enum(toAssignableRoleEnum(actorRole), {
      required_error: 'role is required.',
      invalid_type_error: 'You cannot assign this role.'
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
        <DialogTitle>Edit member</DialogTitle>
        <DialogHeader></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleEditCompanyMember(data))}>
            <div className="justify-start self-stretch">
              <div className="h-[10px]" />
              <InputField name="email" label="E-mail" placeholder="E-mail" disabled className="mb-2" />
            </div>
            <SelectField name="role" placeholder="Select role" label="Role" options={roleOptions} />

            <DialogTrigger asChild>
              <Button className="mt-12 w-full" type="submit">
                Save
              </Button>
            </DialogTrigger>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

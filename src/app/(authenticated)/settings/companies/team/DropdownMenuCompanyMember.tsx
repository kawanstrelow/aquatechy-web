import { useTranslations } from 'next-intl';
import React from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { LoadingSpinner } from '../../../../../components/LoadingSpinner';
import { Button } from '../../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '../../../../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../../../../../components/ui/dropdown-menu';

import { useDeleteCompanyMember } from '@/hooks/react-query/companies/deleteCompanyMember';
import { ModalEditCompanyMember } from './ModalEditCompanyMember';
import { CompanyMember } from '@/ts/interfaces/Company';
import { canMutateCompanyMember } from '@/utils/companyRoles';

type Props = CompanyMember & {
  actorRole?: string;
};

export default function DropdownMenuCompanyMember({
  id,
  company,
  firstName,
  lastName,
  email,
  phone,
  role,
  actorRole
}: Props) {
  const t = useTranslations('settings');
  const common = useTranslations('common');
  const { isPending, mutate } = useDeleteCompanyMember();

  const handleDelete = () => {
    mutate({
      companyId: company.id,
      memberId: id
    });
  };

  if (!canMutateCompanyMember(actorRole, role)) return null;

  if (isPending) return <LoadingSpinner />;

  return (
    <>
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="absolute right-0 top-0 self-center">
            <Button size="icon" variant="ghost" className="cursor-pointer">
              <BsThreeDotsVertical className="text-stone-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <ModalEditCompanyMember
              company={company}
              id={id}
              firstName={firstName}
              lastName={lastName}
              email={email}
              phone={phone}
              role={role}
              actorRole={actorRole}
            >
              <div className="flex w-full cursor-pointer items-center rounded p-1 text-gray-700 hover:bg-blue-50">
                {common('edit')}
              </div>
            </ModalEditCompanyMember>

            <DialogTrigger asChild>
              <div className="flex w-full cursor-pointer items-center rounded p-1 text-red-500 hover:bg-blue-50">
                {common('delete')}
              </div>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent>
          <DialogTitle className="text-center">{t('companies.areYouSure')}</DialogTitle>
          <DialogDescription>{t('companies.removeMemberDescription')}</DialogDescription>
          <div className="flex justify-around">
            <DialogTrigger asChild>
              <Button variant={'destructive'} onClick={handleDelete}>
                {common('delete')}
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button variant={'outline'}>{common('cancel')}</Button>
            </DialogTrigger>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

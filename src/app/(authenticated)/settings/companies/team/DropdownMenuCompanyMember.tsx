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
                Edit
              </div>
            </ModalEditCompanyMember>

            <DialogTrigger asChild>
              <div className="flex w-full cursor-pointer items-center rounded p-1 text-red-500 hover:bg-blue-50">
                Delete
              </div>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent>
          <DialogTitle className="text-center">Are you sure?</DialogTitle>
          <DialogDescription>Once you remove this member, you will lose all the information.</DialogDescription>
          <div className="flex justify-around">
            <DialogTrigger asChild>
              <Button variant={'destructive'} onClick={handleDelete}>
                Delete
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button variant={'outline'}>Cancel</Button>
            </DialogTrigger>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

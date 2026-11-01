import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Assignment } from '@/ts/interfaces/Assignments';
import { DialogDeleteAssignment } from '../ModalDeleteAssignment';
import { DialogTransferRoute } from '../ModalTransferRoute';

interface AssignmentActionsProps {
  assignment: Assignment;
}

export function AssignmentDropdownActions({ assignment }: AssignmentActionsProps) {
  const t = useTranslations('routes');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleActionSelect = (action: 'transfer' | 'delete') => {
    if (action === 'transfer') {
      setIsTransferModalOpen(true);
    } else if (action === 'delete') {
      setIsDeleteModalOpen(true);
    }
    setIsDropdownOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild className="self-center">
          <Button size="icon" variant="ghost">
            <BsThreeDotsVertical className="text-stone-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleActionSelect('transfer')}>{t('transferAssignment')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleActionSelect('delete')} className="text-red-500">
            {t('deleteAssignment')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogDeleteAssignment open={isDeleteModalOpen} setOpen={setIsDeleteModalOpen} assignment={assignment} />

      <DialogTransferRoute open={isTransferModalOpen} setOpen={setIsTransferModalOpen} assignment={assignment} />
    </>
  );
}

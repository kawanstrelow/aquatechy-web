import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Service } from '@/ts/interfaces/Service';
import { DialogDeleteService } from '../ModalDeleteService';
import { DialogTransferService } from '../ModalTransferService';

interface ServiceActionsProps {
  service: Service;
}

export function ServiceActions({ service }: ServiceActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleActionSelect = (action: 'delete' | 'transfer') => {
    setIsDropdownOpen(false); // Close dropdown first
    setTimeout(() => {
      // Open modal after dropdown is closed
      if (action === 'delete') {
        setIsDeleteModalOpen(true);
      } else {
        setIsTransferModalOpen(true);
      }
    }, 0);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <BsThreeDotsVertical className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleActionSelect('transfer')}>Transfer Service</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleActionSelect('delete')} className="text-red-500">
            Delete Service
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogDeleteService
        service={service}
        open={isDeleteModalOpen}
        setOpen={setIsDeleteModalOpen}
        clientId={service.clientOwnerId}
      />

      <DialogTransferService service={service} open={isTransferModalOpen} setOpen={setIsTransferModalOpen} />
    </>
  );
}

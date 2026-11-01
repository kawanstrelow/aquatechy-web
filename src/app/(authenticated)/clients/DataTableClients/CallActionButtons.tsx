import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdDeleteOutline } from 'react-icons/md';
import { Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog } from '@/components/ui/dialog';
import { Client } from '@/ts/interfaces/Client';
import { ModalDeleteClient } from './ModalDeleteClient';
import { useDeleteClient } from '@/hooks/react-query/clients/deleteClient';
import { useUserStore } from '@/store/user';

interface ActionButtonsProps {
  client: Client;
}

export function ActionButtons({ client }: ActionButtonsProps) {
  const t = useTranslations('clients');
  const { push } = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const { mutate: mutateDeleteClient, isPending: isDeletingClient } = useDeleteClient();
  const shouldDisableNewPools = useUserStore((state) => state.shouldDisableNewPools);

  const handleActionSelect = (action: 'view' | 'addPool' | 'delete') => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      switch (action) {
        case 'view':
          setIsNavigating(true);
          push(`/clients/${client.id}`);
          break;
        case 'addPool':
          push(`/clients/add-pool?clientId=${client.id}`);
          break;
        case 'delete':
          setIsDeleteModalOpen(true);
          break;
      }
    }, 0);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
  };

  return (
    <div onClick={handleDropdownClick}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleDropdownClick}>
            {isNavigating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <BsThreeDotsVertical className="text-stone-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleActionSelect('view')} disabled={isNavigating}>
            {isNavigating ? (
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t('shared.loading')}
              </div>
            ) : (
              t('shared.view')
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleActionSelect('addPool')}
            disabled={isNavigating || shouldDisableNewPools}
          >
            {t('list.addPool')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleActionSelect('delete')}
            className="text-red-500"
            disabled={isNavigating}
          >
            <div className="flex w-full items-center">
              {t('shared.delete')}
              <DropdownMenuShortcut>
                <MdDeleteOutline size={14} />
              </DropdownMenuShortcut>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isDeletingClient && setIsDeleteModalOpen(open)}>
        <ModalDeleteClient
          open={isDeleteModalOpen}
          setOpen={setIsDeleteModalOpen}
          isPending={isDeletingClient}
          handleSubmit={() =>
            mutateDeleteClient(client.id, {
              onSuccess: () => setIsDeleteModalOpen(false)
            })
          }
        />
      </Dialog>
    </div>
  );
}

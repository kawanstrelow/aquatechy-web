import { useTranslations } from 'next-intl';
import { MdDeleteOutline } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

type Props = {
  deletePool: () => void;
};

export function ModalDeletePool({ deletePool }: Props) {
  const t = useTranslations('clients');

  return (
    <Dialog>
      <DialogTrigger>
        <MdDeleteOutline className="cursor-pointer" />
      </DialogTrigger>
      <DialogContent>
        <DialogDescription>{t('pool.deletePoolShort')}</DialogDescription>
        <div className="flex w-full justify-around">
          <DialogTrigger className="w-fit" asChild>
            <Button onClick={deletePool} variant="destructive">
              {t('shared.delete')}
            </Button>
          </DialogTrigger>
          <DialogTrigger className="w-fit" asChild>
            <Button variant="outline">{t('shared.cancel')}</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}

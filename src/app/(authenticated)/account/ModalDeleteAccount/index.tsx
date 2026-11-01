'use client';

import { TrashIcon } from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDeleteUser } from '@/hooks/react-query/user/deleteUser';

export function ModalDeleteAccount() {
  const t = useTranslations('account');
  const [open, setOpen] = useState(false);

  const [inputConfirm, setInputConfirm] = useState('');
  const { mutate: deleteUser, isPending: isPendingDeleteUser } = useDeleteUser();

  if (isPendingDeleteUser) return <LoadingSpinner />;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 bg-red-500 hover:bg-red-500/90">
          <TrashIcon className="mr-2 h-6 w-6" />
          {t('deleteAccount')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2 text-center">
          <Typography>
            {t('deleteWarning')} <br />
            <b className="font-semibold">{t('deleteWarningIrreversible')}</b>
          </Typography>
          <Input
            onChange={(e) => setInputConfirm(e.target.value)}
            className="w-48"
            placeholder={t('typeDeleteToConfirm')}
          />
          <Button
            type="button"
            onClick={() => deleteUser()}
            disabled={inputConfirm !== 'DELETE'}
            variant="destructive"
            className="h-10w mt-2 w-fit"
          >
            {t('deleteAccount')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

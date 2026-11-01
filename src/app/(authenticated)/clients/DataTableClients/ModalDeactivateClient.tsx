import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void;
  isActive: boolean;
};

export function ModalDeactivateClient({ open, setOpen, handleSubmit, isActive }: Props) {
  const t = useTranslations('clients');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-2">{t('shared.areYouSure')}</DialogTitle>
          <DialogDescription className="text-start">
            {t('list.deactivateLead', {
              action: isActive ? t('list.deactivateMark') : t('list.deactivateActivate'),
              detail: isActive ? t('list.deactivatePreserved') : t('list.deactivateAgain')
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-around">
          <Button
            onClick={() => {
              handleSubmit();
              setOpen(false);
            }}
            variant={isActive ? 'destructive' : 'default'}
          >
            {isActive ? t('shared.deactivate') : t('shared.activate')}
          </Button>
          <Button onClick={() => setOpen(false)} variant={'outline'}>
            {t('shared.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

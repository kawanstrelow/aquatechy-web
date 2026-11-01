import { useTranslations } from 'next-intl';
import { Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSubmit: () => void;
  isPending?: boolean;
};

export function ModalDeleteClient({ open, setOpen, handleSubmit, isPending = false }: Props) {
  const t = useTranslations('clients');

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <DialogContent>
        <DialogHeader className="space-y-3">
          <DialogTitle>{t('list.deleteClientTitle')}</DialogTitle>
          <DialogDescription>{t('list.deleteClientDescription')}</DialogDescription>
        </DialogHeader>
        <div className="flex w-full gap-3">
          <Button onClick={handleSubmit} disabled={isPending} variant="destructive" className="flex-1">
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {t('shared.delete')}
          </Button>
          <Button
            onClick={() => setOpen(false)}
            disabled={isPending}
            variant="outline"
            className="flex-1 border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
          >
            {t('shared.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

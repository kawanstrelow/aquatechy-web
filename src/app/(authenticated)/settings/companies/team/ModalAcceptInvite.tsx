import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

export function ModalAcceptInvite({ children, handleSubmit }: { children: React.ReactNode; handleSubmit: () => void }) {
  const t = useTranslations('settings');
  const common = useTranslations('common');

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('companies.areYouSure')}</DialogTitle>
        <DialogHeader></DialogHeader>
        <DialogDescription>{t('companies.acceptInviteDescription')}</DialogDescription>
        <div className="flex justify-around">
          <DialogTrigger asChild>
            <Button onClick={handleSubmit}>{t('companies.accept')}</Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button variant="outline">{common('cancel')}</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}

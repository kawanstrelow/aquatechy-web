'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  open: boolean;
  productName: string;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (files: File[]) => void;
};

export function InstallPhotosDialog({ open, productName, isLoading, onOpenChange, onConfirm }: Props) {
  const t = useTranslations('shopping');
  const common = useTranslations('common');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) setFiles([]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('installPhotosDialog.title')}</DialogTitle>
          <DialogDescription>{t('installPhotosDialog.description', { product: productName })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="install-photos">{t('installPhotosDialog.photos')}</Label>
          <Input
            id="install-photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-500">{t('installPhotosDialog.selected', { count: files.length })}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
            {common('cancel')}
          </Button>
          <Button type="button" disabled={isLoading || files.length === 0} onClick={() => onConfirm(files)}>
            {isLoading ? t('installPhotosDialog.saving') : t('installPhotosDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

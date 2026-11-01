import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button, buttonVariants } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './ui/alert-dialog';
import { VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { type } from 'os';
import { open } from 'fs';

export type ConfirmActionDialogProps = {
  open?: boolean;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void>;
  onOpenChange?: (open: boolean) => void;
} & VariantProps<typeof buttonVariants>;

export default function ConfirmActionDialog({
  open = false,
  trigger: TriggerElement,
  title,
  confirmText,
  cancelText,
  description,
  onConfirm,
  onOpenChange,
  variant = 'default',
  size = 'default'
}: ConfirmActionDialogProps) {
  const t = useTranslations('shell');
  const resolvedTitle = title ?? t('areYouSure');
  const resolvedConfirm = confirmText ?? t('confirm');
  const resolvedCancel = cancelText ?? t('cancel');
  const [_open, _setOpen] = useState(open);
  const [isLoading, setIsLoading] = useState(false);

  // Sync internal state with open prop when controlled
  useEffect(() => {
    if (onOpenChange !== undefined) {
      // Controlled mode - sync with prop
      _setOpen(open);
    }
  }, [open, onOpenChange]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      // Close dialog after successful confirmation
      _setOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      // Keep dialog open on error so user can retry
      console.error('Error in confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    _setOpen(newOpen);
    if (isLoading) {
      setIsLoading(false);
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // Use controlled open prop if provided, otherwise use internal state
  const isOpen = onOpenChange !== undefined ? open : _open;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {TriggerElement ? <AlertDialogTrigger asChild>{TriggerElement}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant={variant} size={size} onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            <span>{resolvedConfirm}</span>
          </Button>
          <Button type="button" variant="outline" size={size} onClick={() => handleOpenChange(false)}>
            {resolvedCancel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

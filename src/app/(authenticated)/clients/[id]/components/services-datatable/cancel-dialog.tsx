'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';

import { Button } from '@/components/ui/button';

import { useDeleteService } from '@/hooks/react-query/services/deleteService';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useToast } from '@/components/ui/use-toast';

type DeleteServiceDialogProps = {
  serviceId: string;
  assignmentId: string;
  clientId: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
};

export default function DeleteServiceDialog({
  serviceId,
  assignmentId,
  clientId,
  trigger,
  onSuccess
}: DeleteServiceDialogProps) {
  const t = useTranslations('clients');
  const { toast } = useToast();

  const cancelService = useDeleteService(clientId);

  async function handleConfirm() {
    await cancelService.mutateAsync({
      serviceId,
      assignmentId
    });
    toast({
      variant: 'success',
      title: t('service.deletedTitle'),
      description: t('service.deletedDescription'),
      duration: 3000
    });
    onSuccess?.();
  }

  return (
    <ConfirmActionDialog
      variant="destructive"
      trigger={trigger}
      onConfirm={handleConfirm}
      description={t('service.deleteWarning')}
    />
  );
}

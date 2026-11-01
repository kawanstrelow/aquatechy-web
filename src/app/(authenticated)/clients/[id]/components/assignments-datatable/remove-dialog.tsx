'use client';

import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdOutlineFreeCancellation } from 'react-icons/md';
import { MdDeleteOutline } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDeleteService } from '@/hooks/react-query/services/deleteService';
import { PoolAssignmentsPopulated } from './columns';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useRemoveAssignmentService } from '@/hooks/react-query/assignments/removeAssignment';

type RemoveAssignmentDialogProps = {
  assignmentId: string;
};

export default function RemoveAssignmentDialog({ assignmentId }: RemoveAssignmentDialogProps) {
  const t = useTranslations('clients');
  const { toast } = useToast();

  const removeAssignmentService = useRemoveAssignmentService();

  async function handleConfirm() {
    await removeAssignmentService.mutateAsync({
      assignmentId
    });
  }

  return (
    <ConfirmActionDialog
      trigger={
        <Button variant="outline" size="icon" className="h-8 w-8 bg-red-500 text-white">
          <MdDeleteOutline className="h-4 w-4 text-white" />
        </Button>
      }
      onConfirm={handleConfirm}
      description={t('service.removeAssignment')}
    />
  );
}

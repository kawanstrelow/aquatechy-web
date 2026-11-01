'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { RecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useGetRecurringInvoiceTemplates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface RecurringInvoiceActionsProps {
  template: RecurringInvoiceTemplate;
  onEdit?: (template: RecurringInvoiceTemplate) => void;
  onDelete?: (template: RecurringInvoiceTemplate) => void;
}

export function RecurringInvoiceActions({ template, onEdit, onDelete }: RecurringInvoiceActionsProps) {
  const t = useTranslations('invoices');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleActionSelect = (action: string) => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      switch (action) {
        case 'edit':
          onEdit?.(template);
          break;
        case 'delete':
          onDelete?.(template);
          break;
      }
    }, 0);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div onClick={handleDropdownClick}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleDropdownClick} aria-label={t('actions.openActions')}>
            <BsThreeDotsVertical className="text-stone-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onSelect={() => handleActionSelect('edit')} className="cursor-pointer">
              <div className="flex w-full cursor-pointer items-center">{t('actions.edit')}</div>
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem onSelect={() => handleActionSelect('delete')} className="cursor-pointer text-red-500">
              <div className="flex w-full cursor-pointer items-center">{t('actions.delete')}</div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EstimateListRow } from '../../utils/estimateUiTypes';

interface EstimateActionsProps {
  estimate: EstimateListRow;
  onView?: (estimate: EstimateListRow) => void;
  onEdit?: (estimate: EstimateListRow) => void;
  onCancel?: (estimate: EstimateListRow) => void;
  onDownload?: (estimate: EstimateListRow) => void;
}

export function EstimateActions({ estimate, onView, onEdit, onCancel, onDownload }: EstimateActionsProps) {
  const t = useTranslations('invoices');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleActionSelect = (action: string) => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      switch (action) {
        case 'view':
          onView?.(estimate);
          break;
        case 'edit':
          onEdit?.(estimate);
          break;
        case 'cancel':
          onCancel?.(estimate);
          break;
        case 'download':
          onDownload?.(estimate);
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
          <DropdownMenuItem onSelect={() => handleActionSelect('view')} className="cursor-pointer">
            {t('actions.view')}
          </DropdownMenuItem>
          {estimate.status === 'draft' && (
            <DropdownMenuItem onSelect={() => handleActionSelect('edit')}>{t('actions.edit')}</DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => handleActionSelect('download')}>
            {t('actions.downloadPdf')}
          </DropdownMenuItem>
          {estimate.status !== 'accepted' && estimate.status !== 'cancelled' && (
            <DropdownMenuItem onSelect={() => handleActionSelect('cancel')} className="text-red-500">
              {t('list.cancelEstimateConfirm')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

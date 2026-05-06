import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdEdit, MdVisibility, MdDownload } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InvoiceListRow } from '../../utils/fakeData';

interface InvoiceActionsProps {
  invoice: InvoiceListRow;
  onView?: (invoice: InvoiceListRow) => void;
  onEdit?: (invoice: InvoiceListRow) => void;
  onCancelInvoice?: (invoice: InvoiceListRow) => void;
  onDownload?: (invoice: InvoiceListRow) => void;
  onMarkPaid?: (invoice: InvoiceListRow) => void;
  onMarkUnpaid?: (invoice: InvoiceListRow) => void;
}

export function InvoiceActions({ 
  invoice, 
  onView, 
  onEdit, 
  onCancelInvoice, 
  onDownload,
  onMarkPaid,
  onMarkUnpaid
}: InvoiceActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleActionSelect = (action: string) => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      switch (action) {
        case 'view':
          onView?.(invoice);
          break;
        case 'edit':
          onEdit?.(invoice);
          break;
        case 'cancelInvoice':
          onCancelInvoice?.(invoice);
          break;
        case 'download':
          onDownload?.(invoice);
          break;
        case 'markPaid':
          onMarkPaid?.(invoice);
          break;
        case 'markUnpaid':
          onMarkUnpaid?.(invoice);
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
          <Button variant="ghost" size="icon" onClick={handleDropdownClick}>
            <BsThreeDotsVertical className="text-stone-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleActionSelect('view')} className="cursor-pointer">
            <div className="flex w-full items-center cursor-pointer mr-36">
              View
              
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleActionSelect('edit')}>
            <div className="flex w-full items-center cursor-pointer">
              Edit
              
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleActionSelect('download')}>
            <div className="flex w-full items-center cursor-pointer">
              Download PDF
              
            </div>
          </DropdownMenuItem>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <DropdownMenuItem onSelect={() => handleActionSelect('markPaid')}>
              <div className="flex w-full items-center cursor-pointer">
                Mark as Paid
                
              </div>
            </DropdownMenuItem>
          )}
          {invoice.status === 'paid' && (
            <DropdownMenuItem onSelect={() => handleActionSelect('markUnpaid')}>
              <div className="flex w-full items-center cursor-pointer">
                Mark as Unpaid
                
              </div>
            </DropdownMenuItem>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' ? (
            <DropdownMenuItem
              onSelect={() => handleActionSelect('cancelInvoice')}
              className="text-red-500"
            >
              <div className="flex w-full items-center cursor-pointer">
                Cancel invoice
              </div>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SHOPPING_ITEM_STATUS_LABELS, SHOPPING_ITEM_STATUS_OPTIONS } from '@/constants/shopping';
import { ShoppingItemStatus, ShoppingListRow } from '@/ts/interfaces/Shopping';

interface ShoppingItemActionsProps {
  item: ShoppingListRow;
  onUpdateStatus: (item: ShoppingListRow, status: ShoppingItemStatus) => void;
  onDelete: (item: ShoppingListRow) => void;
}

export function ShoppingItemActions({ item, onUpdateStatus, onDelete }: ShoppingItemActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Update status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {SHOPPING_ITEM_STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  disabled={item.status === option.value}
                  onSelect={() => {
                    setIsDropdownOpen(false);
                    onUpdateStatus(item, option.value as ShoppingItemStatus);
                  }}
                  className="cursor-pointer"
                >
                  {SHOPPING_ITEM_STATUS_LABELS[option.value as ShoppingItemStatus]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setIsDropdownOpen(false);
              onDelete(item);
            }}
            className="cursor-pointer text-red-500"
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

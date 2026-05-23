'use client';

import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ProductListRow } from '@/ts/interfaces/Product';

interface ProductActionsProps {
  product: ProductListRow;
  onEdit?: (product: ProductListRow) => void;
  canEdit?: boolean;
}

export function ProductActions({ product, onEdit, canEdit = true }: ProductActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div onClick={handleDropdownClick}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleDropdownClick}>
            <BsThreeDotsVertical className="text-stone-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setIsDropdownOpen(false);
              onEdit?.(product);
            }}
            className="cursor-pointer"
          >
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

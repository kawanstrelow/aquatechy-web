'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

interface ExportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyWithMyRole[];
  initialSelectedIds: string[];
  onConfirm: (companyIds: string[]) => Promise<void>;
  isExporting: boolean;
}

export function ExportClientsDialog({
  open,
  onOpenChange,
  companies,
  initialSelectedIds,
  onConfirm,
  isExporting
}: ExportClientsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
    }
  }, [open, initialSelectedIds]);

  const allSelected = companies.length > 0 && selectedIds.length === companies.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(companies.map((company) => company.id));
  };

  const handleToggleCompany = (companyId: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...current, companyId] : current.filter((id) => id !== companyId)));
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    await onConfirm(selectedIds);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isExporting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export clients</DialogTitle>
          <DialogDescription>
            Choose one or more companies to include in the CSV. Inactive clients and pools are included.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleToggleAll} disabled={isExporting}>
            {allSelected ? 'Clear' : 'Select all'}
          </Button>
        </div>
        <div className="max-h-64 space-y-3 overflow-y-auto py-1">
          {companies.map((company) => {
            const checkboxId = `export-company-${company.id}`;
            return (
              <div key={company.id} className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={selectedIds.includes(company.id)}
                  disabled={isExporting}
                  onCheckedChange={(checked) => handleToggleCompany(company.id, checked === true)}
                />
                <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                  {company.name}
                </Label>
              </div>
            );
          })}
        </div>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isExporting || selectedIds.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

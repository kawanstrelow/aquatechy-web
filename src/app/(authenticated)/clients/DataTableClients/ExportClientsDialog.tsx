'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExportClientsFormat } from '@/hooks/react-query/clients/useExportClientsCSV';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

type ExportStep = 'companies' | 'format';

interface ExportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyWithMyRole[];
  initialSelectedIds: string[];
  onConfirm: (companyIds: string[], format: ExportClientsFormat) => Promise<void>;
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
  const t = useTranslations('clients');
  const needsCompanyStep = companies.length > 1;
  const [step, setStep] = useState<ExportStep>(needsCompanyStep ? 'companies' : 'format');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [format, setFormat] = useState<ExportClientsFormat>('csv');

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
      setFormat('csv');
      setStep(companies.length > 1 ? 'companies' : 'format');
    }
  }, [open, initialSelectedIds, companies.length]);

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleToggleCompany = (companyId: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...current, companyId] : current.filter((id) => id !== companyId)));
  };

  const handleNext = () => {
    if (selectedIds.length === 0) return;
    setStep('format');
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    await onConfirm(selectedIds, format);
  };

  const handleClose = () => {
    if (isExporting) return;
    onOpenChange(false);
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
        {step === 'companies' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('list.exportTitle')}</DialogTitle>
              <DialogDescription>{t('list.exportCompaniesDescription')}</DialogDescription>
            </DialogHeader>
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
              <Button type="button" variant="outline" onClick={handleClose} disabled={isExporting}>
                {t('shared.cancel')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearAll}
                disabled={isExporting || selectedIds.length === 0}
              >
                {t('shared.clearAll')}
              </Button>
              <Button type="button" onClick={handleNext} disabled={selectedIds.length === 0}>
                {t('shared.next')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('list.exportTitle')}</DialogTitle>
              <DialogDescription>{t('list.exportFormatDescription')}</DialogDescription>
            </DialogHeader>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportClientsFormat)}
              className="gap-3 py-1"
              disabled={isExporting}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="csv" id="export-format-csv" className="mt-1" />
                <div className="grid gap-1">
                  <Label htmlFor="export-format-csv" className="cursor-pointer font-normal">
                    CSV
                  </Label>
                  <span className="text-muted-foreground text-xs">{t('list.csvHint')}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="xlsx" id="export-format-xlsx" className="mt-1" />
                <div className="grid gap-1">
                  <Label htmlFor="export-format-xlsx" className="cursor-pointer font-normal">
                    {t('list.excel')}
                  </Label>
                  <span className="text-muted-foreground text-xs">{t('list.excelHint')}</span>
                </div>
              </div>
            </RadioGroup>
            <DialogFooter className="gap-2 sm:space-x-0">
              {needsCompanyStep ? (
                <Button type="button" variant="outline" onClick={() => setStep('companies')} disabled={isExporting}>
                  {t('shared.back')}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleClose} disabled={isExporting}>
                  {t('shared.cancel')}
                </Button>
              )}
              <Button type="button" onClick={handleConfirm} disabled={isExporting || selectedIds.length === 0}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isExporting ? t('shared.exporting') : t('shared.export')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

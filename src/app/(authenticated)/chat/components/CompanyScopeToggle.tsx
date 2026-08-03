'use client';

import { Building2, Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { cn } from '@/lib/utils';

type CompanyScopeToggleProps = {
  companies: CompanyWithMyRole[];
  selectedCompanyId: string | null;
  onSelect: (companyId: string) => void;
  disabled?: boolean;
};

export function CompanyScopeToggle({
  companies,
  selectedCompanyId,
  onSelect,
  disabled = false
}: CompanyScopeToggleProps) {
  const selected = companies.find((c) => c.id === selectedCompanyId) ?? companies[0];

  if (!selected) return null;

  if (companies.length === 1) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
        <Building2 className="h-3.5 w-3.5 text-slate-500" />
        <span className="max-w-[140px] truncate">{selected.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-1.5 rounded-full border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-100',
            disabled && 'opacity-70'
          )}
        >
          <Building2 className="h-3.5 w-3.5 text-slate-500" />
          <span className="max-w-[140px] truncate">{selected.name}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => onSelect(company.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{company.name}</span>
            {company.id === selected.id && <Check className="h-3.5 w-3.5 shrink-0 text-[#364D9D]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

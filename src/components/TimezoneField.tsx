'use client';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { withFormControl } from '@/hoc/withFormControl';
import { cn } from '@/lib/utils';
import { ianaTimezoneGroups, timezoneLabel } from '@/utils/ianaTimeZones';

type TimezoneFieldProps = {
  name: string;
  label?: string;
  placeholder: string;
};

type Props = {
  field: ControllerRenderProps<FieldValues, string>;
  form: UseFormReturn;
};

function TimezoneFieldInner({ field, placeholder }: Props & TimezoneFieldProps) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const groups = useMemo(() => ianaTimezoneGroups(), []);
  const selected = typeof field.value === 'string' ? field.value : '';

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between px-3 font-normal"
        >
          <span className={cn('truncate text-left', !selected && 'text-slate-500')}>
            {selected ? timezoneLabel(selected, now) : placeholder}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('search')} />
          <CommandList>
            <CommandEmpty>{t('noTimezoneFound')}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.area} heading={group.area}>
                {group.zones.map((zone) => (
                  <CommandItem
                    key={zone.id}
                    value={`${zone.city} ${zone.id}`}
                    onSelect={() => {
                      field.onChange(zone.id);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn('mr-2 h-4 w-4 shrink-0', selected === zone.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="truncate">{timezoneLabel(zone.id, now)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default withFormControl<TimezoneFieldProps>(TimezoneFieldInner);

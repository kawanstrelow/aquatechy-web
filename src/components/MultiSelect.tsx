import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder: string;
  disabled?: boolean;
  popoverClassName?: string;
}

// Atualmente não será usado, mas futuramente provavelmente será

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
  popoverClassName,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    return () => setOpen(false);
  }, []);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  return (
    <div className="w-[100%]">
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger disabled={disabled} asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`mt-2 w-full justify-between ${selected.length > 1 ? 'h-full' : 'h-9'}`}
            onClick={() => setOpen(!open)}
          >
            <div className="flex flex-wrap gap-1">
              {selected.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return (
                  <Badge
                    variant="secondary"
                    key={value}
                    className="mb-1 mr-1 flex items-center"
                    onClick={() => handleUnselect(value)}
                  >
                    {option ? option.label : value}
                    <button
                      className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                      onKeyDown={(e) => e.key === 'Enter' && handleUnselect(value)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleUnselect(value)}
                    >
                      <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}

            </div>
            {!selected.length && <p className="w-full text-start text-slate-500">{placeholder}</p>}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-500 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn('pointer-events-auto z-[100] p-0', popoverClassName)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="">
            <CommandInput placeholder="Search ..." />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup className="max-h-46 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value]
                    );
                    setOpen(true);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selected.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { MultiSelect };

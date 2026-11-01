import { useTranslations } from 'next-intl';

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  data: { key: string; value: string; name: string }[];
  placeholder: string;
  onChange: (value: string) => void;
  value: string;
};

export function FilterSelect({ data, placeholder, onChange, value }: Props) {
  const t = useTranslations('services');

  return (
    <Select onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent defaultValue={value}>
        <SelectGroup>
          {[
            {
              key: 'All',
              value: 'All',
              name: t('all')
            },
            ...data
          ].map((d) => (
            <SelectItem key={d.key} value={d.value}>
              {d.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

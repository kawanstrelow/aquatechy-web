import { useTranslations } from 'next-intl';

import { SelectOption } from '@/ts/interfaces/Others';

import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select';
import { translateOptionLabel } from '@/i18n/runtime';

import { Weekdays } from '../../../../constants';
import { WeekdaysUppercase } from '../../../../ts/interfaces/Weekday';

type Props = {
  onChange: (value: WeekdaysUppercase) => void;
  value: WeekdaysUppercase;
};

export default function WeekdaySelect({ onChange, value }: Props) {
  const t = useTranslations('routes');

  return (
    <div className="grid w-full gap-2">
      <Label>{t('weekday')}</Label>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger data-testid="select-weekday">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Weekdays.map((weekday: SelectOption) => (
              <SelectItem key={weekday.value} value={weekday.value}>
                {translateOptionLabel(weekday)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

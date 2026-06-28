import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { FieldType } from '@/ts/enums/enums';

import { InputMasked } from './InputMasked';
import { Checkbox } from './ui/checkbox';
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from './ui/form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

type MaskTypes = 'currencyValue' | 'percentValue' | 'phone';

type Props = {
  className?: string;
  disabled?: boolean;
  name: string;
  placeholder?: string;
  type?: FieldType;
  props?: React.HTMLProps<HTMLInputElement>;
  label?: string;
  value?: string;
};

export default function InputField({ name, placeholder, type = FieldType.Default, label, ...props }: Props) {
  const form = useFormContext();
  const [showPassword, setShowPassword] = useState(false); // To toggle visibility of password

  const types = {
    zip: {
      component: (field: ControllerRenderProps) => (
        <InputMasked mask="zipcode" field={field} placeholder={placeholder || ''} {...field} {...props} />
      )
    },
    phone: {
      component: (field: ControllerRenderProps) => {
        return <InputMasked mask="phone" field={field} placeholder={placeholder || ''} {...field} {...props} />;
      }
    },
    password: {
      component: (field: ControllerRenderProps) => (
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'} // Toggle between password and text type
            placeholder={placeholder}
            {...field}
            onChange={(e) => {
              form.setValue(name, e.target.value);
            }}
          />
          {/* Eye icon toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transform"
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <EyeOff className="text-gray-500" size={20} />
            ) : (
              <Eye className="text-gray-500" size={20} />
            )}
          </button>
        </div>
      )
    },
    default: {
      component: (field: ControllerRenderProps) => (
        <Input
          type="text"
          placeholder={placeholder}
          {...field}
          {...props}
          onChange={(e) => {
            form.setValue(name, e.target.value);
          }}
        />
      )
    },
    textArea: {
      component: (field: ControllerRenderProps) => (
        <Textarea
          placeholder={placeholder}
          {...props}
          {...field}
          style={{ marginTop: 0 }}
          onChange={(e) => {
            form.setValue(field.name, e.target.value);
          }}
        />
      )
    },
    checkbox: {
      component: (field: ControllerRenderProps) => (
        <div className="inline-flex items-start justify-start gap-2 self-stretch">
          <Checkbox
            {...field}
            {...props}
            checked={!!field.value}
            id={name}
            onCheckedChange={() => field.onChange(!field.value)}
          />
          <Label htmlFor={name} className="text-sm font-semibold leading-none text-gray-400">
            {placeholder}
          </Label>
        </div>
      )
    },
    percentValue: {
      component: (field: ControllerRenderProps) => (
        <InputMasked mask={type as MaskTypes} field={field} placeholder={placeholder || ''} {...field} {...props} />
      )
    },
    currencyValue: {
      component: (field: ControllerRenderProps) => (
        <InputMasked mask={type as MaskTypes} field={field} placeholder={placeholder || ''} {...field} {...props} />
      )
    },
    switch: {
      component: (field: ControllerRenderProps) => (
        <Switch {...props} checked={field.value} onCheckedChange={field.onChange} />
      )
    },
    number: {
      component: (field: ControllerRenderProps) => (
        <Input
          type="number"
          {...field}
          value={field.value ?? ''}
          className="h-9"
          {...(props.props || {})}
          onChange={(e) => {
            const nextValue =
              e.target.value === '' ? undefined : e.target.valueAsNumber;
            field.onChange(
              nextValue !== undefined && Number.isNaN(nextValue) ? e.target.value : nextValue
            );
            if (props.props?.onChange) {
              props.props.onChange(e);
            }
          }}
        />
      )
    },
    date: {
      component: (field: ControllerRenderProps) => (
        <Input
          type="date"
          placeholder={placeholder}
          {...field}
          value={field.value || ''}
          onChange={(e) => {
            field.onChange(e.target.value);
          }}
        />
      )
    }
  };

  if (type === FieldType.Date) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type="date"
                placeholder={placeholder}
                {...field}
                value={field.value || ''}
                onChange={(e) => {
                  field.onChange(e.target.value);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem className="flex h-full w-full flex-col gap-2">
            {!['checkbox'].includes(type) && label ? <Label className="text-nowrap">{label}</Label> : null}
            <FormControl>{types[type as keyof typeof types].component(field)}</FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

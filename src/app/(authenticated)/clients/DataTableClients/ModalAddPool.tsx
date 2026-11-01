import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { HasSaltSystemOptions } from '@/constants';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { poolSchema } from '@/schemas/pool';
import { FieldType, PoolType } from '@/ts/enums/enums';
import { isEmpty } from '@/utils';
import { CreatePool } from '@/ts/interfaces/Pool';
const createPoolSchema = poolSchema
  .omit({
    poolNotes: true,
    poolZip: true,
    poolCity: true,
    poolState: true,
    poolAddress: true
  })
  .and(
    z.object({
      clientOwnerId: z.string().min(1),
      zip: z
        .string({
          required_error: 'clients.errors.zipRequired',
          invalid_type_error: 'clients.errors.zipString'
        })
        .trim()
        .min(5, {
          message: 'clients.errors.zipRange'
        }),
      notes: z
        .string({
          required_error: 'clients.errors.notesRequired',
          invalid_type_error: 'clients.errors.notesString'
        })
        .trim()
        // .min(1, { message: 'Notes must be at least 1 character.' })
        .optional(),
      city: z
        .string({
          required_error: 'validation.city.required',
          invalid_type_error: 'validation.city.invalidType'
        })
        .trim()
        .min(1, { message: 'validation.city.min' }),
      state: z
        .string({
          required_error: 'validation.state.required',
          invalid_type_error: 'validation.state.invalidType'
        })
        .trim()
        .min(1, { message: 'clients.errors.stateOneCharacter' }),
      address: z
        .string({
          required_error: 'validation.address.required',
          invalid_type_error: 'validation.address.invalidType'
        })
        .trim()
        .min(1, { message: 'validation.address.min' }),
      monthlyPayment: defaultSchemas.monthlyPayment
    })
  );

export type CreatePoolType = z.infer<typeof createPoolSchema>;

type Props = {
  handleAddPool: (data: CreatePool) => void;
  clientOwnerId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function ModalAddPool({ handleAddPool, clientOwnerId, open, setOpen }: Props) {
  const t = useTranslations('clients');
  const form = useForm<CreatePoolType>({
    resolver: zodResolver(createPoolSchema),
    defaultValues: {
      clientOwnerId,
      address: '',
      animalDanger: false,
      city: '',
      enterSide: '',
      lockerCode: '',
      monthlyPayment: undefined,
      notes: undefined,
      hasSaltSystem: 'false',
      state: '',
      zip: '',
      bodyOfWater: ''
    }
  });

  useEffect(() => {
    form.reset();
  }, [open]);

  const validateForm = async (): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = form.formState.errors; // also works if you read form.formState.isValid
    await form.trigger();
    if (form.formState.isValid) {
      return true;
    }
    if (isEmpty(form.formState.errors)) {
      console.error('Error in the form');
    } else {
      console.error(form.formState.errors);
    }
    return false;
  };

  async function handleSubmit(data: CreatePoolType) {
    const isValid = await validateForm();
    if (isValid) {
      const { hasSaltSystem, ...rest } = data;
      const hasSalt = hasSaltSystem === 'true';
      handleAddPool({
        ...rest,
        monthlyPayment: data.monthlyPayment ?? undefined,
        hasSaltSystem: hasSalt,
        poolType: hasSalt ? PoolType.Salt : PoolType.Chlorine,
        bodyOfWater: data.bodyOfWater?.trim() || undefined,
        estimatesConvertedFrom: data.estimatesConvertedFrom
      });
      form.reset();
      setOpen(false);
      return;
    }
  }

  return (
    <>
      <DialogContent className="h-[660px] max-w-[1200px]">
        <DialogTitle>{t('list.createPool')}</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <div className="-mt-2 flex gap-4">
              <InputField name="address" label={t('fields.address')} placeholder={t('fields.poolAddressTitle')} />
            </div>
            <div className="-mt-2 flex gap-4">
              <StateAndCitySelect stateName="state" cityName="city" />
              <InputField name="zip" label={t('fields.zip')} placeholder={t('fields.poolZip')} type={FieldType.Zip} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField
                name="monthlyPayment"
                label={t('fields.monthlyPayment')}
                placeholder={t('fields.monthlyPayment')}
                type={FieldType.CurrencyValue}
              />
              <InputField name="lockerCode" label={t('fields.lockerCode')} placeholder={t('fields.lockerCode')} />
              <InputField
                name="animalDanger"
                label={t('fields.animalDanger')}
                placeholder={t('fields.animalDangerQuestion')}
                type={FieldType.Checkbox}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField name="enterSide" label={t('fields.enterSide')} placeholder={t('fields.enterSide')} />
              <InputField
                name="bodyOfWater"
                label={t('fields.bodyOfWater')}
                placeholder={t('fields.bodyOfWaterExample')}
              />
              <SelectField
                name="hasSaltSystem"
                label={t('fields.saltSystem')}
                placeholder={t('fields.saltSystem')}
                options={HasSaltSystemOptions}
              />
            </div>
            <div>
              <InputField
                className="h-40"
                type={FieldType.TextArea}
                name="notes"
                label={t('fields.poolNotes')}
                placeholder={t('fields.poolNotes')}
              />
            </div>
            <div className="m-auto flex w-[50%] justify-around gap-4">
              <Button className="w-full" variant={'default'} color="green" type="submit">
                {t('shared.create')}
              </Button>
              <Button className="w-full" onClick={() => setOpen(false)} variant={'outline'}>
                {t('shared.cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </>
  );
}

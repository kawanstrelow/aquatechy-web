import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { PoolTypes } from '@/constants';
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
          required_error: 'Zip is required.',
          invalid_type_error: 'Zip must be a string.'
        })
        .trim()
        .min(5, {
          message: 'Zip must be between 5 and 10 (with hifen) digits.'
        }),
      notes: z
        .string({
          required_error: 'Notes is required.',
          invalid_type_error: 'Notes must be a string.'
        })
        .trim()
        // .min(1, { message: 'Notes must be at least 1 character.' })
        .optional(),
      city: z
        .string({
          required_error: 'City is required.',
          invalid_type_error: 'City must be a string.'
        })
        .trim()
        .min(1, { message: 'City must be at least 1 character.' }),
      state: z
        .string({
          required_error: 'State is required.',
          invalid_type_error: 'State must be a string.'
        })
        .trim()
        .min(1, { message: 'State must be at least 1 character.' }),
      address: z
        .string({
          required_error: 'Address is required.',
          invalid_type_error: 'Address must be a string.'
        })
        .trim()
        .min(1, { message: 'Address must be at least 1 character.' }),
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
      poolType: undefined,
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
      handleAddPool({
        ...data,
        monthlyPayment: data.monthlyPayment ?? undefined,
        poolType: data.poolType as PoolType,
        bodyOfWater: data.bodyOfWater?.trim() || undefined
      });
      form.reset();
      setOpen(false);
      return;
    }
  }

  return (
    <>
      <DialogContent className="h-[660px] max-w-[1200px]">
        <DialogTitle>Create Pool</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <div className="-mt-2 flex gap-4">
              <InputField name="address" label="Address" placeholder="Pool Address" />
            </div>
            <div className="-mt-2 flex gap-4">
              <StateAndCitySelect stateName="state" cityName="city" />
              <InputField name="zip" label="Zip" placeholder="Pool zip" type={FieldType.Zip} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField
                name="monthlyPayment"
                label="Monthly payment"
                placeholder="Monthly payment"
                type={FieldType.CurrencyValue}
              />
              <InputField name="lockerCode" label="Locker code" placeholder="Locker code" />
              <InputField
                name="animalDanger"
                label="Animal danger"
                placeholder="Is there a danger of animal attack?"
                type={FieldType.Checkbox}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField name="enterSide" label="Enter side" placeholder="Enter side" />
              <InputField name="bodyOfWater" label="Body of water" placeholder="e.g. Main pool, spa" />
              <SelectField name="poolType" label="Chemical type" placeholder="Chemical type" options={PoolTypes} />
            </div>
            <div>
              <InputField
                className="h-40"
                type={FieldType.TextArea}
                name="notes"
                label="Pool notes"
                placeholder="Pool notes"
              />
            </div>
            <div className="m-auto flex w-[50%] justify-around gap-4">
              <Button className="w-full" variant={'default'} color="green" type="submit">
                Create
              </Button>
              <Button className="w-full" onClick={() => setOpen(false)} variant={'outline'}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </>
  );
}

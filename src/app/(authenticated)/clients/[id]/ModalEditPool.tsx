import { UseFormReturn } from 'react-hook-form';
import { MdOutlineEdit } from 'react-icons/md';

import InputField from '@/components/InputField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FieldType } from '@/ts/enums/enums';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  handleSubmit: () => void;
  monthlyPaymentChanged: boolean;
};

export function DialogEditPool({ form, handleSubmit, monthlyPaymentChanged }: Props) {
  const isDirty = form.formState.isDirty;

  return (
    <Dialog>
      <DialogTrigger>
        <MdOutlineEdit className="cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="max-h-screen max-w-fit overflow-y-scroll">
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div>
            <InputField name="address" placeholder="Address" />
          </div>
          <div className="inline-flex items-start justify-start gap-4 self-stretch">
            <StateAndCitySelect cityName="city" stateName="state" />
          </div>
          <div className="inline-flex items-start justify-start gap-4 self-stretch">
            <InputField name="monthlyPayment" placeholder="Monthly payment" type={FieldType.CurrencyValue} />
            <InputField name="lockerCode" placeholder="Gate code" />
            <InputField name="enterSide" placeholder="Enter side" />
          </div>

          <div className="mb-4 h-full w-full">
            <InputField className="h-full" type={FieldType.TextArea} name="notes" placeholder="Location notes..." />
          </div>
          {(isDirty || monthlyPaymentChanged) && (
            <Button className="mt-4" type="submit">
              Save
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

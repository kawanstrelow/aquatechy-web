'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from '@radix-ui/react-icons';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import { InputFile } from '@/components/InputFile';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Categories } from '@/constants';
import useGetClients from '@/hooks/react-query/clients/getClients';
import { useCreateRequest } from '@/hooks/react-query/requests/createRequest';
import { useUserStore } from '@/store/user';
import { FieldType } from '@/ts/enums/enums';
import { Client } from '@/ts/interfaces/Client';
import { isEmpty } from '@/utils';
import { buildSelectOptions } from '@/utils/formUtils';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetPoolsByClientId from '@/hooks/react-query/pools/getPoolsByClientId';

const schema = z.object({
  category: z.string().min(1, { message: 'Category is required' }),
  createdByUserId: z.string().min(1, { message: 'createdByUserId is required' }),
  poolId: z.string().min(1, { message: 'Pool is required' }),
  clientId: z.string().min(1, { message: 'Client is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  outcome: z.string().optional(),
  photo: z.array(z.any())
});

export type CreateRequest = z.infer<typeof schema> & { createdAt: string };

export function ModalAddRequest() {
  const [open, setOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const { mutate: createRequest, isPending: isPendingCreate } = useCreateRequest();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      category: '',
      createdByUserId: user?.id,
      poolId: '',
      description: '',
      photo: [],
      outcome: undefined
    }
  });

  useEffect(() => {
    form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit(data: z.infer<typeof schema>) {
    if (isEmpty(form.formState.errors)) {
      createRequest({
        ...data,
        createdAt: new Date().toISOString()
      });
      setOpen(false);
    }
  }

  const { data: clients, isLoading: isLoadingClients } = useGetAllClients();
  const clientId = form.watch('clientId');
  const { data: pools = [], isLoading: isPoolsLoading } = useGetPoolsByClientId(
    open ? clientId : null
  );
  const isLoading = isLoadingClients || isPendingCreate;

  // Reset poolId when client changes (but not on initial mount)
  const prevClientIdRef = React.useRef<string | undefined>();
  useEffect(() => {
    if (clientId && prevClientIdRef.current !== undefined && clientId !== prevClientIdRef.current) {
      form.resetField('poolId');
    }
    prevClientIdRef.current = clientId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto flex items-center justify-center">
          <PlusIcon className="mr-2" />
          Add request
        </Button>
      </DialogTrigger>
      <DialogContent className="w-96 rounded-md md:w-[680px]">
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((data) => handleSubmit(data))}>
            <DialogTitle>New Request</DialogTitle>
            <div className="flex gap-4">
              <SelectField
                options={buildSelectOptions(
                  clients?.filter((client: Client) => client.isActive),
                  {
                    key: 'id',
                    name: 'fullName',
                    value: 'id'
                  }
                )}
                placeholder={clients?.length || 0 > 0 ? 'Clients' : 'No clients available'}
                name="clientId"
              />
              {clientId && (
                <SelectField
                  options={buildSelectOptions(
                    pools.filter((pool) => pool.isActive),
                    {
                      key: 'id',
                      name: 'name',
                      value: 'id'
                    }
                  )}
                  placeholder={isPoolsLoading ? 'Loading pools...' : pools.length === 0 ? 'No pools available' : 'Pools'}
                  name="poolId"
                />
              )}
            </div>
            <div>
              <InputField name="description" placeholder="Description" type={FieldType.TextArea} label=" " />
            </div>
            <div>
              <div className="h-44">
                <InputFile
                  showIcon={false}
                  handleChange={(images) => form.setValue('photo', images)}
                  defaultPhotos={[]}
                />
              </div>
            </div>
            <SelectField name="category" options={Categories} placeholder="Category" />

            <Button className="w-full" type="submit">
              Create
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

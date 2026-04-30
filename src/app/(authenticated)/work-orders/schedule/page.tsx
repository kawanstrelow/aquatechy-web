'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { PaginationDemo } from '@/components/PaginationDemo';
import SelectField from '@/components/SelectField';
import { DatePicker } from '@/components/ui/date-picker';
import { useUserStore } from '@/store/user';
import { formatPoolNameWithBodyOfWater } from '@/utils';
import { buildSelectOptions } from '@/utils/formUtils';

import { DataTableWorkOrders } from './DataTableWorkOrders';
import { columns } from './columns';
import useGetWorkOrdersServices, { UseGetWorkOrdersServicesParams } from '@/hooks/react-query/services/getWorkOrdersServices';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DataTableServicesSkeleton from '../../services/DataTableServices/skeleton';
import { ReloadIcon } from '@radix-ui/react-icons';
import { X } from 'lucide-react';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import { useForm } from 'react-hook-form';
import useGetPoolsByClient from '@/hooks/react-query/pools/getByClients';
import { Pool } from '@/ts/interfaces/Pool';

const defaultValues: UseGetWorkOrdersServicesParams = {
  from: (() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  })(), // 7 days ago
  to: (() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  })(), // 7 days forward
  completedByUserId: null,
  clientId: null,
  companyOwnerId: null,
  page: 1,
  limit: 20
};

const countAppliedFilters = (filters: UseGetWorkOrdersServicesParams): number => {
  return Object.keys(filters).reduce((count, key) => {
    const currentValue = filters[key as keyof UseGetWorkOrdersServicesParams];
    const defaultValue = defaultValues[key as keyof UseGetWorkOrdersServicesParams];

    if (currentValue === undefined || currentValue === defaultValue) return count;

    const isDate = key === 'from' || key === 'to';
    if (isDate) {
      return new Date(currentValue as string).toISOString() !== new Date(defaultValue as string).toISOString()
        ? count + 1
        : count;
    }

    return count + 1;
  }, 0);
};

export default function Page() {
  const router = useRouter();
  const { data: companies } = useGetCompanies();
  const filtersForm = useForm<UseGetWorkOrdersServicesParams>({
    defaultValues
  });
  const { data: clients, isLoading: isLoadingClients } = useGetAllClients();
  const clientId = filtersForm.watch('clientId') ?? undefined;
  const { data: pools, isLoading: isLoadingPools } = useGetPoolsByClient(clientId);
  const user = useUserStore((state) => state.user);
  const { data: members } = useGetMembersOfAllCompaniesByUserId(user.id);

  const formValuesListner = filtersForm.watch();
  const appliedFilters = useMemo(() => countAppliedFilters(formValuesListner), [formValuesListner]);

  const workOrdersServicesQuery = useGetWorkOrdersServices(filtersForm.getValues());

  useEffect(() => {
    if (!user?.firstName) {
      router.push('/onboarding');
    }
  }, [user, router]);

  const onSubmit = async (formData: UseGetWorkOrdersServicesParams) => {
    filtersForm.setValue('page', 1);
    await workOrdersServicesQuery.refetch({ ...formData, page: 1, limit: 20 });
  };

  const handlePageChange = async (page: number) => {
    filtersForm.setValue('page', page);
    const currentFilters = filtersForm.getValues();
    await workOrdersServicesQuery.refetch({ ...currentFilters, page, limit: 20 });
  };

  const handleClearFilters = async () => {
    filtersForm.reset(defaultValues);
    await workOrdersServicesQuery.refetch(defaultValues);
  };

  return (
    <div>
      <Form {...filtersForm}>
        <form className="flex w-full flex-col gap-4" onSubmit={filtersForm.handleSubmit(onSubmit)}>
          <div className="flex flex-col justify-start gap-2 p-4 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-5 lg:flex-row">
              <FormItem className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
                <FormLabel>From</FormLabel>
                <FormControl>
                  <DatePicker
                    className="w-full lg:w-fit"
                    placeholder="Created From"
                    value={filtersForm.watch('from') ? new Date(filtersForm.watch('from')) : undefined}
                    onChange={(date) => {
                      if (date) {
                        // Set to start of day in local time
                        const localDate = new Date(date.setHours(0, 0, 0, 0));
                        filtersForm.setValue('from', localDate.toISOString());
                      } else {
                        filtersForm.setValue('from', defaultValues.from);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
              <FormItem className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
                <FormLabel>To</FormLabel>
                <FormControl>
                  <DatePicker
                    className="w-full lg:w-fit"
                    placeholder="Created To"
                    value={filtersForm.watch('to') ? new Date(filtersForm.watch('to')) : undefined}
                    onChange={(date) => {
                      if (date) {
                        // Set to end of day in local time
                        const localDate = new Date(date.setHours(23, 59, 59, 999));
                        filtersForm.setValue('to', localDate.toISOString());
                      } else {
                        filtersForm.setValue('to', defaultValues.to);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            </div>

            <Button type="submit">
              {workOrdersServicesQuery.isPending && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  More filters
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Work Orders Services filter</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 md:flex-row">
                  <FormItem className="flex w-full flex-col gap-1">
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Created From"
                        value={filtersForm.watch('from') ? new Date(filtersForm.watch('from')) : undefined}
                        onChange={(date) =>
                          filtersForm.setValue('from', date ? date.toISOString() : defaultValues.from)
                        }
                      />
                    </FormControl>
                  </FormItem>
                  <FormItem className="flex w-full flex-col gap-1">
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Created To"
                        value={filtersForm.watch('to') ? new Date(filtersForm.watch('to')) : undefined}
                        onChange={(date) => filtersForm.setValue('to', date ? date.toISOString() : defaultValues.to)} // Slice is to get only the date part in a format backend can understand
                      />
                    </FormControl>
                  </FormItem>
                </div>
                <FormItem className="w-full">
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <FormField
                      name="companyOwnerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectField
                              disabled={companies.length === 0}
                              placeholder="Select company"
                              {...field}
                              options={
                                companies.length > 0
                                  ? companies.map((company) => {
                                    return {
                                      key: company.id,
                                      value: company.id,
                                      name: company.name
                                    };
                                  })
                                  : []
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FormControl>
                </FormItem>
                <FormItem className="w-full">
                  <FormLabel>Member</FormLabel>
                  <FormControl>
                    <FormField
                      name="completedByUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectField
                              disabled={members.length === 0}
                              placeholder="Select member"
                              {...field}
                              options={
                                members.length > 0
                                  ? members
                                    .filter((member, index, self) =>
                                      // Keep only the first occurrence of each member ID
                                      index === self.findIndex(m => m.id === member.id)
                                    )
                                    .map((member) => ({
                                      key: member.id,
                                      value: member.id,
                                      name: member.firstName + ' ' + member.lastName
                                    }))
                                  : []
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FormControl>
                </FormItem>

                <FormItem className="w-full">
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <FormField
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectField
                              placeholder={clients?.length || 0 > 0 ? 'Select client' : 'No clients available'}
                              {...field}
                              options={buildSelectOptions(clients || [], {
                                key: 'id',
                                name: 'fullName',
                                value: 'id'
                              })}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FormControl>
                </FormItem>

                <FormItem className="w-full">
                  <FormLabel>Pool</FormLabel>
                  <FormControl>
                    <FormField
                      name="poolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectField
                              {...field}
                              disabled={!clientId || isLoadingPools}
                              placeholder={isLoadingPools ? 'Loading pools...' : 'Select pool'}
                              options={(pools || []).map((pool: Pool) => ({
                                key: pool.id,
                                name: formatPoolNameWithBodyOfWater(pool),
                                value: pool.id
                              }))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FormControl>
                </FormItem>

                <DialogFooter>
                  <Button type="button" onClick={() => filtersForm.handleSubmit(onSubmit)()}>
                    {workOrdersServicesQuery.isPending && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                    Apply
                  </Button>
                  {appliedFilters > 0 && (
                    <Button type="button" variant="outline" onClick={handleClearFilters}>
                      Clear
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {appliedFilters > 0 && (
              <Button variant="outline" onClick={handleClearFilters}>
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  {appliedFilters}
                </span>
                <span>Clear</span>
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>

      {workOrdersServicesQuery.isPending || workOrdersServicesQuery.isLoading ? (
        <DataTableServicesSkeleton />
      ) : (
        <>
          <DataTableWorkOrders columns={columns} data={workOrdersServicesQuery.data?.services || []} />
          {workOrdersServicesQuery.data && workOrdersServicesQuery.data.totalCount > 0 && (
            <PaginationDemo
              currentPage={workOrdersServicesQuery.data.currentPage || filtersForm.watch('page') || 1}
              totalItems={workOrdersServicesQuery.data.totalCount}
              itemsPerPage={workOrdersServicesQuery.data.itemsPerPage || 20}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

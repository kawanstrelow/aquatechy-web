'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, X } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { MultiSelect } from '@/components/MultiSelect';
import SelectField from '@/components/SelectField';
import { Categories, RequestStatus } from '@/constants';
import useGetRequests, { UseGetRequestsParams } from '@/hooks/react-query/requests/getRequests';
import { useUserStore } from '@/store/user';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import { Client } from '@/ts/interfaces/Client';
import { buildSelectOptions } from '@/utils/formUtils';
import { Input } from '@/components/ui/input';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';

import { DataTableRequests } from './DataTableRequests';
import { columns } from './DataTableRequests/columns';
import DataTableRequestsSkeleton from './DataTableRequests/skeleton';
import { PaginationDemo } from '@/components/PaginationDemo';

const defaultValues: UseGetRequestsParams = {
  from: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString(),
  to: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
  status: ['Pending'],
  category: null,
  clientId: null,
  companyId: null,
  page: 1,
  limit: 20
};

const countAppliedFilters = (filters: UseGetRequestsParams): number => {
  return Object.keys(filters).reduce((count, key) => {
    const currentValue = filters[key as keyof UseGetRequestsParams];
    const defaultValue = defaultValues[key as keyof UseGetRequestsParams];

    if (currentValue === undefined || currentValue === defaultValue) return count;

    if (key === 'status') {
      const current = ((currentValue as string[]) ?? []).slice().sort().join(',');
      const def = ((defaultValue as string[]) ?? []).slice().sort().join(',');
      return current !== def ? count + 1 : count;
    }

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
  const user = useUserStore((state) => state.user);
  const { data: clients } = useGetAllClients();
  const { data: companies = [] } = useGetCompanies();

  // Initialize requestsQuery with initial filters
  const [currentFilters, setCurrentFilters] = useState<UseGetRequestsParams>(defaultValues);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const itemsPerPage = 20; // Match this with your backend limit

  const requestsQuery = useGetRequests({
    ...currentFilters,
    page: currentPage,
    limit: itemsPerPage
  });

  const filtersForm = useForm<UseGetRequestsParams>({
    defaultValues
  });

  const formValuesListener = filtersForm.watch();
  const appliedFilters = useMemo(() => countAppliedFilters(formValuesListener), [formValuesListener]);

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user]);

  // Sync form with current filters when they change
  useEffect(() => {
    filtersForm.reset(currentFilters);
  }, [currentFilters, filtersForm]);

  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);

  useEffect(() => {
    if (!filtersDialogOpen) {
      document.body.style.pointerEvents = '';
    }
  }, [filtersDialogOpen]);

  const onSubmit = async (formData: UseGetRequestsParams) => {
    const newFilters = {
      ...formData,
      page: 1, // Reset to first page when applying filters
      limit: itemsPerPage
    };
    setCurrentPage(1);
    setCurrentFilters(newFilters);
    setFiltersDialogOpen(false);
    await requestsQuery.refetch(newFilters);
  };

  const handleClearFilters = async () => {
    filtersForm.reset(defaultValues);
    setCurrentPage(1);
    setCurrentFilters(defaultValues);
    setFiltersDialogOpen(false);
    await requestsQuery.refetch(defaultValues);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (requestsQuery.isLoading) return <LoadingSpinner />;

  return (
    <div>
      <Form {...filtersForm}>
        <form
          className="flex w-full flex-col gap-4"
          onSubmit={filtersForm.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-2 p-4">
            <Input
              className="w-full md:w-[250px]"
              placeholder="Filter requests..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />

            <FormItem className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <FormLabel className="whitespace-nowrap">From</FormLabel>
              <FormControl className="w-full md:w-auto">
                <DatePicker
                  placeholder="Created From"
                  value={
                    filtersForm.watch('from')
                      ? new Date(filtersForm.watch('from'))
                      : undefined
                  }
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(date.setHours(0, 0, 0, 0));
                      filtersForm.setValue('from', localDate.toISOString(), { shouldDirty: true });
                    } else {
                      filtersForm.setValue('from', defaultValues.from, { shouldDirty: true });
                    }
                  }}
                />
              </FormControl>
            </FormItem>

            <FormItem className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <FormLabel className="whitespace-nowrap">To</FormLabel>
              <FormControl className="w-full md:w-auto">
                <DatePicker
                  placeholder="Created To"
                  value={
                    filtersForm.watch('to')
                      ? new Date(filtersForm.watch('to'))
                      : undefined
                  }
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(date.setHours(23, 59, 59, 999));
                      filtersForm.setValue('to', localDate.toISOString(), { shouldDirty: true });
                    } else {
                      filtersForm.setValue('to', defaultValues.to, { shouldDirty: true });
                    }
                  }}
                />
              </FormControl>
            </FormItem>

            <Dialog open={filtersDialogOpen} onOpenChange={setFiltersDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" className="flex items-center gap-2 w-full md:w-auto">
                  More filters
                  {filtersForm.formState.isDirty && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      *
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Requests filter</DialogTitle>
                </DialogHeader>

                <FormItem className="w-full">
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <FormField
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectField
                              placeholder="Select company"
                              {...field}
                              options={buildSelectOptions(companies, {
                                key: 'id',
                                name: 'name',
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
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <FormField
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MultiSelect
                              placeholder="Select status"
                              options={RequestStatus.map((s) => ({ label: s.name, value: s.value }))}
                              selected={field.value ?? []}
                              onChange={(value) => {
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FormControl>
                </FormItem>

                <FormItem className="w-full">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <FormField
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <SelectField
                              placeholder="Select category"
                              {...field}
                              options={Categories}
                              itemClassName="whitespace-normal text-left"
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
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
                              options={buildSelectOptions(
                                clients?.filter((client: Client) => client.isActive),
                                {
                                  key: 'id',
                                  name: 'fullName',
                                  value: 'id'
                                }
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FormControl>
                </FormItem>

                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => filtersForm.handleSubmit(onSubmit)()}
                  >
                    {requestsQuery.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

            <Button
              type="submit"
              size="sm"
              className="w-full md:w-auto"
              disabled={!filtersForm.formState.isDirty && appliedFilters === 0}
            >
              {requestsQuery.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply
            </Button>

            {appliedFilters > 0 && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                size="sm"
                className="w-full md:w-auto"
              >
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


      {requestsQuery.isPending || requestsQuery.isLoading ? (
        <DataTableRequestsSkeleton />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTableRequests
            columns={columns}
            data={requestsQuery.data?.requests || []}
            globalFilter={globalFilter}
          />

          <div className="flex justify-center py-4">
            {requestsQuery.data && requestsQuery.data.totalCount > 0 && (
              <PaginationDemo
                currentPage={Number(requestsQuery.data.currentPage) || currentPage}
                totalItems={requestsQuery.data.totalCount}
                itemsPerPage={requestsQuery.data.itemsPerPage || itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { X } from 'lucide-react';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { SHOPPING_ITEM_STATUS_OPTIONS } from '@/constants/shopping';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetShoppingItems from '@/hooks/react-query/shopping-items/useGetShoppingItems';
import { useCreateShoppingItem } from '@/hooks/react-query/shopping-items/useCreateShoppingItem';
import { useUpdateShoppingItemStatus } from '@/hooks/react-query/shopping-items/useUpdateShoppingItemStatus';
import { useDeleteShoppingItem } from '@/hooks/react-query/shopping-items/useDeleteShoppingItem';
import { useUserStore } from '@/store/user';
import { ShoppingItemStatus, ShoppingListRow } from '@/ts/interfaces/Shopping';
import { getClientCompanyOwnerId, isClientActive } from '@/utils/clientUtils';

import { AddShoppingItemDialog } from './_components/AddShoppingItemDialog';
import { ShoppingSummaryCards } from './_components/ShoppingSummaryCards';
import { createColumns } from './DataTableShoppingItems/columns';
import { DataTableShoppingItems } from './DataTableShoppingItems';

type FilterFormData = {
  companyId: string;
  clientId: string;
  poolId: string;
  status: string;
};

export default function ShoppingOverviewPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();
  const { data: allClients = [] } = useGetAllClients();

  const filtersForm = useForm<FilterFormData>({
    defaultValues: {
      companyId: '',
      clientId: 'all',
      poolId: 'all',
      status: 'all'
    }
  });

  const companyId = filtersForm.watch('companyId');
  const clientId = filtersForm.watch('clientId');
  const poolId = filtersForm.watch('poolId');
  const status = filtersForm.watch('status');

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  useEffect(() => {
    if (!companyId && companies.length > 0) {
      filtersForm.setValue('companyId', companies[0].id);
    }
  }, [companies, companyId, filtersForm]);

  useEffect(() => {
    filtersForm.setValue('poolId', 'all');
  }, [clientId, filtersForm]);

  const clientsForCompany = useMemo(
    () =>
      allClients.filter(
        (client) => isClientActive(client) && getClientCompanyOwnerId(client) === companyId
      ),
    [allClients, companyId]
  );

  const { clientNameById, poolNameById } = useMemo(() => {
    const clientNames: Record<string, string> = {};
    const poolNames: Record<string, string> = {};

    clientsForCompany.forEach((client) => {
      clientNames[client.id] = client.fullName;
      client.pools?.forEach((pool) => {
        poolNames[pool.id] = pool.name;
      });
    });

    return { clientNameById: clientNames, poolNameById: poolNames };
  }, [clientsForCompany]);

  const summaryQuery = useGetShoppingItems({
    companyId,
    clientNameById,
    poolNameById
  });

  const itemsQuery = useGetShoppingItems({
    companyId,
    status: status !== 'all' ? status : null,
    clientId: clientId !== 'all' ? clientId : null,
    poolId: poolId !== 'all' ? poolId : null,
    clientNameById,
    poolNameById
  });

  const { mutateAsync: createItem, isPending: isCreating } = useCreateShoppingItem();
  const { mutateAsync: updateStatus } = useUpdateShoppingItemStatus(companyId);
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteShoppingItem(companyId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ShoppingListRow | null>(null);

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        key: company.id,
        value: company.id,
        name: company.name
      })),
    [companies]
  );

  const clientOptions = useMemo(
    () => [
      { key: 'all', value: 'all', name: 'All clients' },
      ...clientsForCompany.map((client) => ({
        key: client.id,
        value: client.id,
        name: client.fullName
      }))
    ],
    [clientsForCompany]
  );

  const poolOptions = useMemo(() => {
    const options = [{ key: 'all', value: 'all', name: 'All pools' }];
    const pools =
      clientId !== 'all'
        ? clientsForCompany.find((client) => client.id === clientId)?.pools ?? []
        : clientsForCompany.flatMap((client) => client.pools ?? []);

    pools.forEach((pool) => {
      if (!options.some((option) => option.value === pool.id)) {
        options.push({ key: pool.id, value: pool.id, name: pool.name });
      }
    });

    return options;
  }, [clientsForCompany, clientId]);

  const statusOptions = [{ key: 'all', value: 'all', name: 'All statuses' }, ...SHOPPING_ITEM_STATUS_OPTIONS];

  const appliedFilters = useMemo(() => {
    let count = 0;
    if (clientId !== 'all') count++;
    if (poolId !== 'all') count++;
    if (status !== 'all') count++;
    if (companies.length > 1 && companyId && companyId !== companies[0]?.id) count++;
    return count;
  }, [clientId, poolId, status, companies, companyId]);

  const handleClearFilters = () => {
    filtersForm.reset({
      companyId: companies[0]?.id ?? '',
      clientId: 'all',
      poolId: 'all',
      status: 'all'
    });
  };

  const handleUpdateStatus = async (item: ShoppingListRow, newStatus: ShoppingItemStatus) => {
    await updateStatus({
      shoppingItemId: item.id,
      data: { status: newStatus }
    });
  };

  const handleDeleteClick = (item: ShoppingListRow) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const columns = createColumns(handleUpdateStatus, handleDeleteClick);

  if (isLoadingCompanies) return <LoadingSpinner />;

  return (
    <FormProvider {...filtersForm}>
      <div className="flex flex-col gap-6 p-2">
        <ConfirmActionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Remove item"
          description={
            itemToDelete
              ? `Remove ${itemToDelete.productName} from the shopping list for ${itemToDelete.poolName}?`
              : 'Remove this item from the shopping list?'
          }
          confirmText={isDeleting ? 'Removing…' : 'Remove'}
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          variant="destructive"
        />

        {summaryQuery.isLoading ? (
          <LoadingSpinner />
        ) : (
          <ShoppingSummaryCards items={summaryQuery.data ?? []} />
        )}

        <div className="flex w-full flex-wrap items-center gap-2">
          <Button type="button" className="shrink-0" onClick={() => setAddDialogOpen(true)} disabled={!companyId}>
            <PlusIcon className="mr-2" />
            Add item
          </Button>
          {companies.length > 1 && (
            <div className="min-w-[140px] flex-1">
              <SelectField name="companyId" options={companyOptions} placeholder="Company" />
            </div>
          )}
          <div className="min-w-[140px] flex-1">
            <SelectField name="clientId" options={clientOptions} placeholder="Client" />
          </div>
          <div className="min-w-[140px] flex-1">
            <SelectField name="poolId" options={poolOptions} placeholder="Pool" />
          </div>
          <div className="min-w-[140px] flex-1">
            <SelectField name="status" options={statusOptions} placeholder="Status" />
          </div>
          {appliedFilters > 0 && (
            <Button variant="outline" type="button" className="ml-auto shrink-0" onClick={handleClearFilters}>
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                {appliedFilters}
              </span>
              Clear
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {itemsQuery.isLoading ? (
          <LoadingSpinner />
        ) : (
          <DataTableShoppingItems columns={columns} data={itemsQuery.data ?? []} />
        )}

        <AddShoppingItemDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          companyId={companyId}
          companies={companies}
          allClients={allClients}
          isLoading={isCreating}
          onSubmit={async (params) => {
            await createItem(params);
            setAddDialogOpen(false);
          }}
        />
      </div>
    </FormProvider>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { PlusIcon } from '@radix-ui/react-icons';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { useUserStore } from '@/store/user';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PaginationDemo } from '@/components/PaginationDemo';
import useGetEstimates, { UseGetEstimatesParams } from '@/hooks/react-query/estimates/useGetEstimates';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useDownloadEstimatePDF } from '@/hooks/react-query/estimates/useDownloadEstimatePDF';
import { useCancelEstimate } from '@/hooks/react-query/estimates/useCancelEstimate';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { EstimateStatus } from '@/ts/interfaces/Estimate';

import { EstimateSummaryCards } from './_components/EstimateSummaryCards';
import { DataTableEstimates } from './DataTableEstimates/index';
import { createColumns } from './DataTableEstimates/columns';
import { EstimateListRow } from './utils/estimateUiTypes';

const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

const getTodayEnd = () => {
  const now = new Date();
  return new Date(now.setHours(23, 59, 59, 999));
};

const defaultDateFrom = getFirstDayOfMonth();
const defaultDateTo = getTodayEnd();

interface FilterFormData {
  from?: Date;
  to?: Date;
  status: string;
  client: string;
  company: string;
}

export default function EstimatesPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: allClients } = useGetAllClients();
  const { data: companies = [] } = useGetCompanies();
  const { mutateAsync: downloadPDF } = useDownloadEstimatePDF();
  const { mutateAsync: cancelEstimate, isPending: isCancelling } = useCancelEstimate();

  const [currentFilters, setCurrentFilters] = useState<UseGetEstimatesParams>({
    page: 1,
    clientId: null,
    companyOwnerId: null,
    status: null,
    fromDate: defaultDateFrom.toISOString().split('T')[0],
    toDate: defaultDateTo.toISOString()
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [estimateToCancel, setEstimateToCancel] = useState<EstimateListRow | null>(null);

  const filtersForm = useForm<FilterFormData>({
    defaultValues: {
      from: defaultDateFrom,
      to: defaultDateTo,
      status: 'all',
      client: 'all',
      company: 'all'
    }
  });

  const estimatesQuery = useGetEstimates({
    ...currentFilters,
    page: currentPage
  });

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  const clients = useMemo(() => {
    if (!allClients) return [];
    return allClients
      .filter((client) => client.isActive)
      .map((client) => ({
        id: client.id,
        name: client.fullName || `${client.firstName} ${client.lastName}`
      }));
  }, [allClients]);

  const companiesList = useMemo(() => {
    if (!companies || companies.length === 0) return [];
    return companies.map((company) => ({
      id: company.id,
      name: company.name
    }));
  }, [companies]);

  const estimateClients = useMemo(() => {
    const clientMap = new Map<string, { id: string; name: string }>();
    estimatesQuery.data?.estimates.forEach((est) => {
      if (!clientMap.has(est.clientId)) {
        clientMap.set(est.clientId, { id: est.clientId, name: est.clientName });
      }
    });
    return Array.from(clientMap.values());
  }, [estimatesQuery.data?.estimates]);

  const watchedFrom = filtersForm.watch('from');
  const watchedTo = filtersForm.watch('to');
  const watchedStatus = filtersForm.watch('status');
  const watchedClient = filtersForm.watch('client');
  const watchedCompany = filtersForm.watch('company');

  const appliedFilters = useMemo(() => {
    let count = 0;
    if (watchedStatus && watchedStatus !== 'all') count++;
    if (watchedClient && watchedClient !== 'all') count++;
    if (watchedCompany && watchedCompany !== 'all') count++;
    if (watchedFrom && watchedFrom.getTime() !== defaultDateFrom.getTime()) count++;
    if (watchedTo && watchedTo.getTime() !== defaultDateTo.getTime()) count++;
    return count;
  }, [watchedFrom, watchedTo, watchedStatus, watchedClient, watchedCompany]);

  const handleClearFilters = async () => {
    const firstOfMonth = getFirstDayOfMonth();
    const todayEnd = getTodayEnd();

    filtersForm.reset({
      from: firstOfMonth,
      to: todayEnd,
      status: 'all',
      client: 'all',
      company: 'all'
    });

    const newFilters: UseGetEstimatesParams = {
      page: 1,
      clientId: null,
      companyOwnerId: null,
      status: null,
      fromDate: firstOfMonth.toISOString().split('T')[0],
      toDate: todayEnd.toISOString()
    };

    setCurrentPage(1);
    setCurrentFilters(newFilters);
    await estimatesQuery.refetch({ ...newFilters, page: 1 });
  };

  useEffect(() => {
    const values = filtersForm.getValues();

    const newFilters: UseGetEstimatesParams = {
      page: 1,
      clientId: values.client && values.client !== 'all' ? values.client : null,
      companyOwnerId: values.company && values.company !== 'all' ? values.company : null,
      status:
        values.status && values.status !== 'all' ? (values.status as EstimateStatus) : null,
      fromDate: values.from ? values.from.toISOString().split('T')[0] : null,
      toDate: values.to ? new Date(values.to.setHours(23, 59, 59, 999)).toISOString() : null
    };

    const filtersChanged =
      newFilters.clientId !== currentFilters.clientId ||
      newFilters.companyOwnerId !== currentFilters.companyOwnerId ||
      newFilters.status !== currentFilters.status ||
      newFilters.fromDate !== currentFilters.fromDate ||
      newFilters.toDate !== currentFilters.toDate;

    if (filtersChanged) {
      setCurrentPage(1);
      setCurrentFilters(newFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFrom, watchedTo, watchedStatus, watchedClient, watchedCompany]);

  const handleView = (estimate: EstimateListRow) => {
    router.push(`/invoices/estimates/${estimate.id}`);
  };

  const handleEdit = (estimate: EstimateListRow) => {
    router.push(`/invoices/estimates/${estimate.id}/edit`);
  };

  const handleCancelEstimate = (estimate: EstimateListRow) => {
    setEstimateToCancel(estimate);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancelEstimate = async () => {
    if (estimateToCancel) {
      await cancelEstimate(estimateToCancel.id);
      setCancelDialogOpen(false);
      setEstimateToCancel(null);
    }
  };

  const handleDownload = async (estimate: EstimateListRow) => {
    await downloadPDF({ estimateId: estimate.id });
  };

  const handleCreateEstimate = () => {
    router.push('/invoices/estimates/new');
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await estimatesQuery.refetch({ ...currentFilters, page });
  };

  const columns = createColumns(handleView, handleEdit, handleCancelEstimate, handleDownload);

  if (estimatesQuery.isLoading) return <LoadingSpinner />;

  return (
    <FormProvider {...filtersForm}>
      <div className="flex flex-col gap-6 p-2">
        <ConfirmActionDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          title="Cancel estimate"
          description={
            estimateToCancel
              ? `Cancel estimate #${estimateToCancel.estimateNumber}? It will remain in your records as cancelled.`
              : 'Cancel this estimate? It will remain in your records as cancelled.'
          }
          confirmText={isCancelling ? 'Cancelling…' : 'Cancel estimate'}
          cancelText="Close"
          onConfirm={handleConfirmCancelEstimate}
          variant="destructive"
        />

        <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={handleCreateEstimate}>
              <PlusIcon className="mr-2" />
              New Estimate
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <FormItem className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <FormLabel className="whitespace-nowrap">From</FormLabel>
              <FormControl>
                <DatePicker
                  className="w-full sm:w-fit"
                  placeholder="Issued From"
                  value={watchedFrom || defaultDateFrom}
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(date);
                      localDate.setHours(0, 0, 0, 0);
                      filtersForm.setValue('from', localDate);
                    } else {
                      filtersForm.setValue('from', defaultDateFrom);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
            <FormItem className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <FormLabel className="whitespace-nowrap">To</FormLabel>
              <FormControl>
                <DatePicker
                  className="w-full sm:w-fit"
                  placeholder="Issued To"
                  value={watchedTo || defaultDateTo}
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(date);
                      localDate.setHours(23, 59, 59, 999);
                      filtersForm.setValue('to', localDate);
                    } else {
                      filtersForm.setValue('to', defaultDateTo);
                    }
                  }}
                />
              </FormControl>
            </FormItem>

            {appliedFilters > 0 && (
              <Button variant="outline" type="button" onClick={handleClearFilters}>
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  {appliedFilters}
                </span>
                <span>Clear</span>
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>

        <EstimateSummaryCards estimates={estimatesQuery.data?.estimates ?? []} />

        {estimatesQuery.isPending || estimatesQuery.isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <DataTableEstimates
              columns={columns}
              data={estimatesQuery.data?.estimates ?? []}
              clients={clients.length > 0 ? clients : estimateClients}
              companies={companiesList}
              onCompanyChange={(companyId) => {
                filtersForm.setValue('company', companyId);
              }}
              onRowClick={(estimate) => handleView(estimate)}
            />

            {estimatesQuery.data && estimatesQuery.data.totalCount > 0 && (
              <div className="flex justify-center py-4">
                <PaginationDemo
                  currentPage={currentPage}
                  totalItems={estimatesQuery.data.totalCount}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </FormProvider>
  );
}

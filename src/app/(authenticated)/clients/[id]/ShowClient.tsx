'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useUpdateClient } from '@/hooks/react-query/clients/updateClient';
import { Client } from '@/ts/interfaces/Client';
import { calculateTotalAssignmentsOfAllPools, calculateTotalMonthlyOfAllPools } from '@/utils';
import { getInitials } from '@/utils/others';

import ClientInfo from './ClientInfo';
import PoolHeader from './PoolHeader';
import { ModalDeactivateClient } from '../DataTableClients/ModalDeactivateClient';
import EmailPreferences from './EmailPreferences';
import EstimatesTab from './tabs/EstimatesTab';
import InvoicesTab from './tabs/InvoicesTab';
import { Separator } from '@/components/ui/separator';
import { ModalDeleteClient } from '../DataTableClients/ModalDeleteClient';
import { useDeleteClient } from '@/hooks/react-query/clients/deleteClient';

type Props = {
  client: Client;
};

export default function ShowClient({ client }: Props) {
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { mutate: updateClient, isPending } = useUpdateClient<{ isActive: boolean }>();
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient();
  const router = useRouter();
  const { data: companies = [] } = useGetCompanies();
  const membership = companies.find((c) => c.id === client.companyOwnerId);
  const canViewBilling = membership?.role === 'Owner' || membership?.role === 'Admin';

  const [tab, setTab] = useState<'client_info' | 'pools' | 'invoices' | 'estimates' | 'email_preferences'>(
    'client_info'
  );

  if (isPending || isDeleting) return <LoadingSpinner />;

  const selectedTabStyles = 'text-gray-800 font-semibold';



  const handleDeactivateClient = () => {
    updateClient({ isActive: false });
  };

  const handleActivateClient = () => {
    updateClient({ isActive: true });
  };

  const handleDeleteClient = () => {
    deleteClient(client.id);
  };

  const handleAddPool = () => {
    router.push(`/clients/add-pool?clientId=${client.id}`);
  };

  return (
    <div>
      <div className="flex flex-col items-start gap-6 self-stretch pt-2 lg:flex-row lg:pt-0">
        <div className="w-full lg:max-w-sm">
          <div className="relative flex w-full flex-col items-center justify-start gap-6 text-nowrap rounded-lg border px-6 pb-6 pt-16">
            <div className="w-[100% - 16px] absolute left-2 right-2 top-2 h-[148px] rounded bg-gradient-to-b from-sky-400 to-teal-400" />

            <div className="PhotoName flex h-[206px] flex-col items-center justify-start gap-3 self-stretch">
              <Avatar className="h-[140px] w-[140px]">
                <AvatarImage src={''} />
                <AvatarFallback className="text-5xl">
                  {client && client.fullName ? getInitials(client.fullName) : ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex h-[54px] flex-col items-center justify-center gap-1 self-stretch">
                <span className="z-10 flex flex-col items-center gap-0.5 self-stretch text-wrap text-center text-xl font-semibold leading-[30px] text-gray-800">
                  <span>
                    {client.fullName}{' '}
                    {!client.isActive ? <span className="text-sm font-medium text-red-500">Inactive</span> : null}
                  </span>
                  {!client.isActive && client.deactivatedAt ? (
                    <span className="text-xs font-normal text-gray-500">
                      Inactive since {format(new Date(client.deactivatedAt), 'MMMM d, yyyy')}
                    </span>
                  ) : null}
                </span>
                <div className="text-sm font-medium text-gray-500">{client.address}, {client.addressLine2}</div>
              </div>
            </div>
            <div className="flex flex-row flex-wrap items-start justify-start gap-[18px] self-start lg:flex-col lg:flex-nowrap">
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">Email</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">{client.email}</div>
                </div>
              </div>
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">Company Owner</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">{client.companyOwner.name}</div>
                </div>
              </div>
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">Phone Number</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">{client.phone}</div>
                </div>
              </div>
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="Text inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">Locations</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">
                    {client.pools.length > 0
                      ? client.pools.length === 1
                        ? '1 Pool'
                        : `${client.pools.length} Pools`
                      : 'No Pools'}
                  </div>
                </div>
              </div>
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">Last Service</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">
                    {client.lastServiceDate != undefined
                      ? format(new Date(client.lastServiceDate), 'MMMM, dd, yyyy')
                      : 'No Services'}
                  </div>
                </div>
              </div>
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="text-sm font-medium text-gray-500">Joined</div>
                  <div className="text-sm font-medium text-gray-800">
                    {format(new Date(client.createdAt), 'MMMM, dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-center gap-2">
                <a href={`mailto:${client.email}`} className='w-full'>
                  <Button variant={'outline'} className='w-full'>
                    E-mail
                  </Button>
                </a>
                <Button onClick={handleAddPool} className="w-full" variant={'default'}>
                  Add pool
                </Button>
                <Separator className="w-full bg-gray-200 opacity-50" />
              <div className="flex w-full justify-center gap-2">
                  <Button
                    onClick={() => setDeactivateModalOpen(true)}
                    className="w-full"
                    variant={client.isActive ? 'destructive' : 'default'}
                  >
                    {client.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button onClick={() => setDeleteModalOpen(true)} variant={'destructive'} className='w-full'>
                    Delete
                  </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-start">
          <div className="inline-flex h-full w-full flex-col items-start justify-start gap-6">
            <div className="inline-flex flex-wrap items-start justify-start gap-6 self-stretch text-nowrap md:flex-nowrap">
              <div className="inline-flex shrink grow basis-0 flex-col items-start justify-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="inline-flex items-start justify-start gap-4 self-stretch">
                  <div className="inline-flex shrink grow basis-0 flex-col items-start justify-start gap-2">
                    <div className="self-stretch text-base font-medium leading-normal text-gray-500">
                      Monthly payment
                    </div>
                    <div className="self-stretch text-[28px] font-semibold text-gray-800">
                      ${calculateTotalMonthlyOfAllPools(client.pools)}
                    </div>
                  </div>
                  <div className="CircleIconBagde flex h-10 w-10 items-center justify-center gap-2 rounded-[100px] bg-gradient-to-b from-orange-500 to-yellow-400 p-2">
                    <div className="AttachMoney relative h-[18px] w-[18px]" />
                  </div>
                </div>
              </div>
              <div className="RightBadgeStatisticCard inline-flex shrink grow basis-0 flex-col items-start justify-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="TitleNumbers inline-flex items-start justify-start gap-4 self-stretch">
                  <div className="TitleNumbers inline-flex shrink grow basis-0 flex-col items-start justify-start gap-2">
                    <div className="self-stretch text-base font-medium leading-normal text-gray-500">Services</div>
                    <div className="self-stretch text-[28px] font-semibold text-gray-800">
                      {calculateTotalAssignmentsOfAllPools(client.pools)}
                    </div>
                  </div>
                  <div className="CircleIconBagde flex h-10 w-10 items-center justify-center gap-2 rounded-[100px] bg-gradient-to-b from-blue-600 to-sky-400 p-2">
                    <div className="FiSrTimeAdd relative h-[18px] w-[18px]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="inline-flex items-start justify-start gap-4 self-stretch border-b border-gray-200">
              <div
                onClick={() => setTab('client_info')}
                className="inline-flex flex-col items-start justify-start gap-2.5"
              >
                <div
                  className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'client_info' && selectedTabStyles}`}
                >
                  Basic Information
                </div>
                {tab === 'client_info' && <div className="Rectangle2 h-0.5 self-stretch bg-gray-800" />}
              </div>
              <div onClick={() => setTab('pools')} className="inline-flex flex-col items-start justify-start gap-2.5">
                <div className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'pools' && selectedTabStyles}`}>
                  Pools
                </div>
                {tab === 'pools' && <div className="h-0.5 self-stretch bg-gray-800" />}
              </div>
              {canViewBilling ? (
                <div onClick={() => setTab('invoices')} className="inline-flex flex-col items-start justify-start gap-2.5">
                  <div
                    className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'invoices' && selectedTabStyles}`}
                  >
                    Invoices
                  </div>
                  {tab === 'invoices' && <div className="h-0.5 self-stretch bg-gray-800" />}
                </div>
              ) : null}
              {canViewBilling ? (
                <div onClick={() => setTab('estimates')} className="inline-flex flex-col items-start justify-start gap-2.5">
                  <div
                    className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'estimates' && selectedTabStyles}`}
                  >
                    Estimates
                  </div>
                  {tab === 'estimates' && <div className="h-0.5 self-stretch bg-gray-800" />}
                </div>
              ) : null}
              <div
                onClick={() => setTab('email_preferences')}
                className="inline-flex flex-col items-start justify-start gap-2.5"
              >
                <div
                  className={`text-sm text-gray-500 hover:cursor-pointer ${
                    tab === 'email_preferences' && selectedTabStyles
                  }`}
                >
                  Preferences
                </div>
                {tab === 'email_preferences' && <div className="h-0.5 self-stretch bg-gray-800" />}
              </div>
            </div>
            {tab === 'client_info' ? (
              <ClientInfo client={client} />
            ) : tab === 'pools' ? (
              client.pools.length > 0 ? (
                <PoolHeader pools={client.pools} clientId={client.id} />
              ) : (
                <div className="flex flex-col items-center w-full justify-center gap-4 py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pools Found</h3>
                    <p className="text-gray-500 mb-4">
                      This client doesn't have any pools yet. Add a pool to get started with services.
                    </p>
                  </div>
                  <Button onClick={handleAddPool} className="px-6">
                    Create Pool
                  </Button>
                </div>
              )
            ) : tab === 'invoices' ? (
              <InvoicesTab clientId={client.id} />
            ) : tab === 'estimates' ? (
              <EstimatesTab clientId={client.id} />
            ) : (
              <EmailPreferences client={client} />
            )}
          </div>
        </div>
      </div>

      {/* Deactivate Client Modal */}
      <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
        <ModalDeactivateClient
          open={deactivateModalOpen}
          setOpen={setDeactivateModalOpen}
          handleSubmit={client.isActive ? handleDeactivateClient : handleActivateClient}
          isActive={client.isActive}
        />
      </Dialog>

      {/* Delete Client Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalDeleteClient
          open={deleteModalOpen}
          setOpen={setDeleteModalOpen}
          handleSubmit={handleDeleteClient}
        />
      </Dialog>
    </div>
  );
}


'use client';

import { useTranslations } from 'next-intl';
import { PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useGetLeads } from '@/hooks/react-query/leads/useGetLeads';
import { Lead } from '@/ts/interfaces/Lead';

import { managedCompanies } from './managedCompanies';

function leadAddress(lead: Lead) {
  return [lead.address, lead.addressLine2].filter(Boolean).join(', ');
}

export default function Page() {
  const t = useTranslations('clients');
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [companyOwnerId, setCompanyOwnerId] = useState('all');
  const { data: companies = [], isLoading: isCompaniesLoading } = useGetCompanies();
  const companiesIManage = managedCompanies(companies);
  const {
    data: leads = [],
    isLoading: isLeadsLoading,
    isError: isLeadsError
  } = useGetLeads(companiesIManage.map((company) => company.id));

  const visibleLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const companyMatch = companyOwnerId === 'all' || lead.companyOwnerId === companyOwnerId;
      if (!companyMatch) return false;
      if (!term) return true;

      return [lead.firstName, lead.lastName, lead.email, lead.phone, lead.address, lead.addressLine2]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [companyOwnerId, leads, search]);

  if (isCompaniesLoading || (companiesIManage.length > 0 && isLeadsLoading)) return <LoadingSpinner />;

  if (isLeadsError) {
    return <p className="p-6 text-sm text-gray-500">{t('leads.loadError')}</p>;
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <div className="flex w-full flex-col items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 md:flex-row">
          <div className="flex w-full flex-col gap-4 md:flex-row">
            {companiesIManage.length > 0 && (
              <>
                <Button asChild>
                  <Link href="/clients/leads/new">
                    <PlusIcon className="mr-2" />
                    {t('leads.new')}
                  </Link>
                </Button>
                <Input
                  placeholder={t('leads.search')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="md:max-w-xs"
                />
              </>
            )}
          </div>
          {companiesIManage.length > 1 && (
            <Select value={companyOwnerId} onValueChange={setCompanyOwnerId}>
              <SelectTrigger className="md:max-w-xs">
                <SelectValue placeholder={t('fields.company')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('shared.allCompanies')}</SelectItem>
                {companiesIManage.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {companiesIManage.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">{t('leads.officeOnly')}</p>
        ) : (
          <Table>
            <TableHeader className="bg-surface">
              <TableRow className="border-line bg-surface hover:bg-surface">
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.phone')}</TableHead>
                <TableHead>{t('columns.email')}</TableHead>
                <TableHead>{t('columns.address')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLeads.length > 0 ? (
                visibleLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clients/leads/${lead.id}`)}
                  >
                    <TableCell>
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>{lead.phone || '—'}</TableCell>
                    <TableCell>{lead.email || '—'}</TableCell>
                    <TableCell>{leadAddress(lead) || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t('leads.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

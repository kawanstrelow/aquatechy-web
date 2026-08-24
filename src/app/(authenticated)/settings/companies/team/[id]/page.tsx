'use client';

import { notFound, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUserStore } from '@/store/user';

import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { isManagementRole } from '@/utils/aiChatAccess';
import ShowCompany from './ShowCompany';

function isValidObjectId(id: string): boolean {
  // Verifica se o ID é uma string de 24 caracteres hexadecimais
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  return objectIdRegex.test(id);
}

type Props = {
  params: {
    id: string;
  };
};

export default function Page({ params: { id } }: Props) {
  if (!id || !isValidObjectId(id)) {
    notFound();
  }

  const { data, isLoading } = useGetCompany(id);
  const { data: companies, isLoading: isLoadingCompanies } = useGetCompanies();
  const user = useUserStore((state) => state.user);

  const router = useRouter();

  const myRole = companies?.find((c) => c.id === id)?.role;

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  useEffect(() => {
    if (isLoading || isLoadingCompanies || !data) return;
    if (!isManagementRole(myRole)) {
      router.replace('/settings/companies');
    }
  }, [data, id, isLoading, isLoadingCompanies, myRole, router]);

  if (isLoading || isLoadingCompanies) return <LoadingSpinner />;

  if (!data) {
    notFound();
  }

  if (!isManagementRole(myRole)) {
    return <LoadingSpinner />;
  }

  return <ShowCompany company={data} />;
}

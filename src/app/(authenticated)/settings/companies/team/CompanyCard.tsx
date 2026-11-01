'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '../../../../../components/ui/separator';
import { cn } from '@/lib/utils';
import { isManagementRole } from '@/utils/aiChatAccess';
import { getInitials } from '@/utils/others';

import { CompanyMembershipAction } from './CompanyMembershipAction';

type Props = {
  companyId: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  status: string;
  imageUrl?: string | null;
  href?: string;
};

export function CompanyCard({ companyId, name, email, phone, role, status, imageUrl, href }: Props) {
  const t = useTranslations('settings');
  const router = useRouter();
  const isPendingAcceptance = status !== 'Active';
  const canOpenCompanyPage = isManagementRole(role) || Boolean(href);

  const goToCompany = () => {
    if (!canOpenCompanyPage) return;
    router.push(href ?? `/settings/companies/team/${companyId}`);
  };

  return (
    <div
      className={cn(
        'relative inline-flex w-full flex-col items-center justify-start gap-4 rounded-lg border border-zinc-200 bg-white p-4 md:max-w-80',
        canOpenCompanyPage && 'cursor-pointer'
      )}
      onClick={canOpenCompanyPage ? goToCompany : undefined}
      onKeyDown={
        canOpenCompanyPage
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToCompany();
              }
            }
          : undefined
      }
      role={canOpenCompanyPage ? 'link' : undefined}
      tabIndex={canOpenCompanyPage ? 0 : undefined}
    >
      {isPendingAcceptance && (
        <div className="pointer-events-none absolute -top-0 left-0 rounded-tl-lg bg-yellow-500 px-3 py-1 text-center text-xs font-medium text-white">
          {t('companies.pendingAcceptance')}
        </div>
      )}

      <div className="mt-2 flex flex-col items-center justify-start gap-3 self-stretch">
        <Avatar className="size-24">
          <AvatarImage src={imageUrl || ''} alt={t('companies.logoAlt', { name })} />
          <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex w-full flex-col items-center gap-2">
          <div className="self-stretch text-center text-sm font-semibold text-gray-800">{name}</div>
          <div className="flex min-h-9 w-full shrink-0 items-center justify-center">
            {companyId ? (
              <CompanyMembershipAction
                companyId={companyId}
                companyName={name}
                membershipStatus={status as 'Active' | 'Inactive'}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Separator />
      <div className="flex w-full flex-col gap-2.5">
        {role && (
          <div className="flex items-center justify-between gap-3">
            <div className="shrink-0 text-xs font-normal leading-[18px] text-gray-500">{t('companies.myRole')}</div>
            <div className="min-w-0 truncate text-right text-xs font-medium leading-[18px] text-gray-400">
              {t.has(`roles.${role}`) ? t(`roles.${role}`) : role}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0 text-xs font-normal leading-[18px] text-gray-500">{t('email')}</div>
          <div className="min-w-0 truncate text-right text-xs font-medium leading-[18px] text-gray-400">{email}</div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0 text-xs font-normal leading-[18px] text-gray-500">{t('phone')}</div>
          <div className="min-w-0 truncate text-right text-xs font-medium leading-[18px] text-gray-400">{phone}</div>
        </div>
      </div>
    </div>
  );
}

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { getInitials } from '@/utils/others';

import { Separator } from '../../../../../components/ui/separator';

import { CompanyMember } from '@/ts/interfaces/Company';
import { canMutateCompanyMember } from '@/utils/companyRoles';

import DropdownMenuCompanyMember from './DropdownMenuCompanyMember';

type Props = CompanyMember & {
  hideCompanyRow?: boolean;
  actorRole?: string;
};

export function CompanyMemberCard({
  status,
  company,
  id,
  firstName,
  lastName,
  email,
  phone,
  role,
  address,
  city,
  state,
  zip,
  hideCompanyRow = false,
  actorRole
}: Props) {
  const t = useTranslations('settings');
  const canMutate = Boolean(id) && canMutateCompanyMember(actorRole, role);

  return (
    <div className="relative flex w-full cursor-pointer flex-col items-center justify-start gap-4 rounded-lg border border-zinc-200 bg-white p-4 md:w-80">
      {canMutate && (
        <DropdownMenuCompanyMember
          status={status}
          company={company}
          id={id}
          role={role}
          email={email}
          phone={phone}
          firstName={firstName}
          lastName={lastName}
          address={address}
          city={city}
          state={state}
          zip={zip}
          actorRole={actorRole}
        />
      )}

      <div className="flex w-full flex-col items-center justify-start gap-4">
        <Avatar className="size-24">
          <AvatarImage src={''} />
          <AvatarFallback className="text-2xl">{getInitials(`${firstName} ${lastName}`)}</AvatarFallback>
        </Avatar>

        <div className="flex w-full flex-col items-center justify-center gap-1">
          <div className="w-full truncate text-center text-sm font-semibold text-gray-800">
            {firstName ? `${firstName} ${lastName}` : email}
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex w-full flex-col gap-2">
        {!hideCompanyRow && (
          <div className="flex w-full justify-between text-xs text-gray-500">
            <span>{t('company')}</span>
            <span className="truncate text-right text-gray-400">{company.name}</span>
          </div>
        )}

        <div className="flex w-full justify-between text-xs text-gray-500">
          <span>{t('companies.role')}</span>
          <span className="truncate text-right text-gray-400">
            {t.has(`roles.${role}`) ? t(`roles.${role}`) : role}
          </span>
        </div>

        {firstName && (
          <div className="flex w-full justify-between text-xs text-gray-500">
            <span>{t('companies.name')}</span>
            <span className="truncate text-right text-gray-400">{`${firstName} ${lastName}`}</span>
          </div>
        )}

        <div className="flex w-full justify-between text-xs text-gray-500">
          <span>{t('companies.status')}</span>
          <span className="truncate text-right text-gray-400">
            {t.has(`statuses.${status}`) ? t(`statuses.${status}`) : status}
          </span>
        </div>

        {status === 'Active' && (
          <div className="flex w-full justify-between text-xs text-gray-500">
            <span>{t('phone')}</span>
            <span className="truncate text-right text-gray-400">{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

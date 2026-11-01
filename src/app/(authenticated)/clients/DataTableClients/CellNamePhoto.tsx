import { CellContext } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

import { Client } from '@/ts/interfaces/Client';

export default function NamePhoto(cell: CellContext<Client, unknown>) {
  const t = useTranslations('clients');
  const { fullName, email } = cell.row.original;

  return (
    <div className="flex flex-col">
      <span>
        {fullName} {!cell.row.original.isActive ? <span className="text-red-500">{t('shared.inactive')}</span> : ''}
      </span>
      <span>{email}</span>
    </div>
  );
}

import { CellContext } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

import { Client } from '@/ts/interfaces/Client';

export default function Phones(cell: CellContext<Client, unknown>) {
  const t = useTranslations('clients');
  const { phone } = cell.row.original;
  return (
    <div className="flex flex-col">
      <span>{t('list.primaryPhone', { phone })}</span>
    </div>
  );
}

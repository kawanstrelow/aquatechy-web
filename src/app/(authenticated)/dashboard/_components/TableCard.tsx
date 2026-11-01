import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface TableCardProps {
  title: string;
  items: {
    name: string;
    value?: string | number;
    thirdColumn?: string | number;
  }[];
  columns?: 2 | 3;
  columnLabels?: {
    first?: string;
    second?: string;
    third?: string;
  };
  onClick?: string;
}

const truncateText = (text: string, maxLength: number = 30) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export function TableCard({ title, items, columns = 2, onClick }: TableCardProps) {
  const t = useTranslations('dashboard');
  const hasData = items && items.length > 0;
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-gray-100 p-6 shadow-sm">
      <h3 className="mb-4 truncate text-sm font-medium text-blue-600" title={title}>
        {truncateText(title)}
      </h3>

      {hasData ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <span className="flex-1 truncate text-sm text-gray-700" title={item.name}>
                {truncateText(item.name)}
              </span>
              {item.value && (
                <span
                  className={`text-sm font-medium ${columns === 3 ? 'text-left text-blue-600' : 'text-right text-gray-700'} flex-1 truncate`}
                  title={item.value.toString()}
                >
                  {truncateText(item.value.toString())}
                </span>
              )}
              {columns === 3 && item.thirdColumn && (
                <span
                  className="flex-1 truncate text-right text-sm font-medium text-gray-700"
                  title={item.thirdColumn.toString()}
                >
                  {truncateText(item.thirdColumn.toString())}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center">
          <span className="text-sm text-gray-400">{t('noData')}</span>
        </div>
      )}
    </div>
  );
}

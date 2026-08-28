const POOL_CLEANING_SERVICE_TYPE = 'Pool Cleaning';

type ServiceTypeLabelProps = {
  name?: string | null;
};

export function ServiceTypeLabel({ name }: ServiceTypeLabelProps) {
  if (!name) return null;

  const isPoolCleaning = name === POOL_CLEANING_SERVICE_TYPE;

  return (
    <span
      className={
        isPoolCleaning
          ? 'inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600'
          : 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700'
      }
    >
      {name}
    </span>
  );
}

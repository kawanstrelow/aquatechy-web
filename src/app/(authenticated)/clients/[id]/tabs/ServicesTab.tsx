import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Info } from 'lucide-react';

import { BasicServicesDataTable } from '@/components/basic-services-datatable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Service } from '@/ts/interfaces/Service';
import { Pool } from '@/ts/interfaces/Pool';
import { columns } from '../components/services-datatable/columns';
import { ModalViewService } from '../components/ModalViewService';

interface ServicesTabProps {
  services: Service[];
  pool: Pool;
}

export default function ServicesTab({ services, pool }: ServicesTabProps) {
  const t = useTranslations('clients');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  // Sort services by scheduledTo date (most recent first)
  const sortedServices = [...services].sort((a, b) => {
    const dateA = new Date(a.scheduledTo);
    const dateB = new Date(b.scheduledTo);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <>
      <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="font-semibold text-blue-900 dark:text-blue-100">
          {t('servicesTab.recentTitle')}
        </AlertTitle>
        <AlertDescription className="mt-2 text-blue-800 dark:text-blue-200">
          {t.rich('servicesTab.recentDescription', {
            services: (chunks) => <span className="font-medium">{chunks}</span>
          })}
        </AlertDescription>
      </Alert>

      <BasicServicesDataTable
        columns={columns}
        data={sortedServices}
        onRowClick={(row) => {
          setSelectedService(row.original);
          setOpen(true);
        }}
      />

      {selectedService && <ModalViewService service={selectedService} pool={pool} open={open} setOpen={setOpen} />}
    </>
  );
}

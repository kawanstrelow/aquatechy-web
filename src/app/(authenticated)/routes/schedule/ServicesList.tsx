import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useServicesContext } from '@/context/services';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { getInitials } from '@/utils/others';
import { ServiceTypeLabel } from '@/components/ServiceTypeLabel';
import { Service } from '@/ts/interfaces/Service';
import { ServiceActions } from './components/ServiceActions';

type ServicesListProps = {
  services?: Service[];
};

export function ServicesList({ services: servicesOverride }: ServicesListProps) {
  const { services: contextServices } = useServicesContext();
  const services = servicesOverride ?? contextServices;

  if (services.length === 0) {
    return (
      <div className="flex w-full justify-center px-3 py-8">
        <span className="text-sm text-slate-500">No services found for this day</span>
      </div>
    );
  }

  return (
    <>
      {services.map((service) => (
        <div className="flex" key={service.id}>
          <ServiceItem service={service} id={service.id} key={service.id} />
        </div>
      ))}
    </>
  );
}

type ServiceItemProps = {
  id: string;
  service: Service;
};

export function ServiceItem({ id, service }: ServiceItemProps) {
  const { width = 0 } = useWindowDimensions();
  const name = `${service?.clientOwner?.firstName} ${service?.clientOwner?.lastName}`;
  const address = `${service?.clientOwner?.address}, ${service?.clientOwner?.city}, ${service?.clientOwner?.state}, ${service?.clientOwner?.zip}`;

  const mdScreen = width < 900;

  return (
    <div className="flex w-full min-w-0 items-start justify-between gap-2 border-b border-slate-100 bg-white px-3 py-3">
      <div className="flex min-w-0 flex-1 items-start gap-2 py-1">
        {!mdScreen && (
          <Avatar className="mt-0.5 shrink-0 cursor-pointer text-sm">
            <AvatarImage src={''} />
            <AvatarFallback>{getInitials(name!)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 text-pretty">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-pretty text-sm font-medium">
            <span>{name}</span>
            <ServiceTypeLabel name={service.serviceType?.name} />
          </div>
          <div className="w-full break-words text-xs text-gray-500">{address}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-center">
        <div className="flex h-8 min-w-16 items-center justify-center rounded-lg border border-gray-100 px-2">
          <div className="text-center text-sm font-semibold text-gray-800">{service.status}</div>
        </div>
        <ServiceActions service={service} />
      </div>
    </div>
  );
}

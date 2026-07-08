import { useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useServicesContext } from '@/context/services';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { getInitials } from '@/utils/others';
import { ServiceTypeLabel } from '@/components/ServiceTypeLabel';
import { Service } from '@/ts/interfaces/Service';
import { ServiceActions } from './components/ServiceActions';

export function ServicesList() {
  const user = useUserStore((state) => state.user);

  const { services } = useServicesContext();

  const assignedToId = useMembersStore((state) => state.assignedToId);

  const { width = 0 } = useWindowDimensions();

  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [openDialogTransfer, setOpenDialogTransfer] = useState(false);

  const [service, setService] = useState<Service>();

  const shouldPermitChangeOrder = assignedToId !== user?.id || width < 900;

  if (services.length === 0) {
    return (
      <div className="flex w-full justify-center">
        <span>No services found for this weekday</span>
      </div>
    );
  }

  return (
    <>
      {services.map((service) => (
        <div className="flex" key={service.id}>
          <ServiceItem
            service={service}
            id={service.id}
            key={service.id}
            shouldPermitChangeOrder={shouldPermitChangeOrder}
          />
        </div>
      ))}
    </>
  );
}

type ServiceItemProps = {
  id: string;
  service: Service;
  shouldPermitChangeOrder: boolean;
};

export function ServiceItem({ id, service, shouldPermitChangeOrder }: ServiceItemProps) {
  const { width = 0 } = useWindowDimensions();
  const name = `${service?.clientOwner?.firstName} ${service?.clientOwner?.lastName}`;
  const address = `${service?.clientOwner?.address}, ${service?.clientOwner?.city}, ${service?.clientOwner?.state}, ${service?.clientOwner?.zip}`;
  
  const mdScreen = width < 900;

  return (
    <div className={`inline-flex w-full items-center justify-between self-stretch border-b border-gray-100 bg-gray-50 px-1 ${mdScreen ? 'py-3' : ''}`}>
      <div className="flex h-[60px] items-center justify-start gap-2 py-2">
        <div className="flex items-center justify-start gap-2">
          {!shouldPermitChangeOrder && (
            <div className="min-w-4">
              <MdDragIndicator size={16} />
            </div>
          )}
          {!mdScreen && (
            <Avatar className="cursor-pointer text-sm">
              <AvatarImage src={''} />
              <AvatarFallback>{getInitials(name!)}</AvatarFallback>
            </Avatar>
          )}
          <div className="inline-flex flex-col items-start justify-center gap-1 text-pretty">
            <div className="flex flex-wrap items-center gap-x-1 text-pretty text-sm font-medium">
              <span>{name}</span>
              <ServiceTypeLabel name={service.serviceType?.name} />
            </div>
            <div className="overflow-hidden text-xs text-gray-500">{address}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-8 min-w-16 items-center justify-center rounded-lg border border-gray-100 px-2">
          <div className="text-center text-sm font-semibold text-gray-800">{service.status}</div>
        </div>
        <ServiceActions service={service} />
      </div>
    </div>
  );
}

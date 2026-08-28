import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInWeeks, getDay, isAfter, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Cookies from 'js-cookie';
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';

import { useMembersStore } from '@/store/members';
import { useWeekdayStore } from '@/store/weekday';
import { Frequency } from '@/ts/enums/enums';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { clientAxios } from '../lib/clientAxios';
import { Service } from '@/ts/interfaces/Service';
import { useAssignmentsContext } from './assignments';

function filterServicesByDay(services: Service[], selectedDay: string): Service[] {
  return services.filter((service) => {
    if (isSameDay(new Date(service.scheduledTo), new Date(selectedDay))) {
      return true;
    }
  });
}

type ServicesContextType = {
  services: Service[];
  allServices: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;
};

const ServicesContext = createContext<ServicesContextType>({
  services: [],
  allServices: [],
  setServices: () => {}
});

export const ServicesProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const assignedToId = useMembersStore((state) => state.assignedToId);
  const selectedDay = useWeekdayStore((state) => state.selectedDay);
  const { allAssignments } = useAssignmentsContext();

  const userId = Cookies.get('userId');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['schedule', userId],
    queryFn: async () => {
      if (!userId) {
        queryClient.cancelQueries({ queryKey: ['schedule'] });
        return [];
      }
      const response = await clientAxios.get('/services/scheduled');
      return response.data;
    },
    staleTime: 1000 * 60 * 60
  });

  const [services, setServices] = useState([] as Service[]);
  const allServices: Service[] = useMemo(() => data?.services ?? [], [data]);

  useEffect(() => {
    if (!userId) return;
    if (isError || isLoading) return;

    const filteredServices = allServices.filter((service: Service) => service.assignedTo.id === assignedToId);

    const filteredServicesByDay = filterServicesByDay(filteredServices, selectedDay);
    // Order services by assignment order
    const orderedServices = filteredServicesByDay.sort((a, b) => {
      const aAssignment = allAssignments.find((assignment) => assignment.id === a.assignmentId);
      const bAssignment = allAssignments.find((assignment) => assignment.id === b.assignmentId);
      return (aAssignment?.order ?? 0) - (bAssignment?.order ?? 0);
    });

    setServices(orderedServices);
  }, [allServices, isError, isLoading, assignedToId, userId, selectedDay, allAssignments]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <ServicesContext.Provider
      value={{
        services,
        allServices,
        setServices
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

export const useServicesContext = () => useContext(ServicesContext);

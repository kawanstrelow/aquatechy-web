import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

import { Service } from '@/ts/interfaces/Service';

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
  const [services, setServices] = useState([] as Service[]);

  return (
    <ServicesContext.Provider
      value={{
        services,
        allServices: [],
        setServices
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

export const useServicesContext = () => useContext(ServicesContext);

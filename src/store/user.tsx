'use client';

import { createContext, useContext, useMemo } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { Dashboard } from '../ts/interfaces/Dashboard';
import { User } from '../ts/interfaces/User';

type Store = {
  user: User;
  dashboard: Dashboard;
  isFreePlan: boolean;
  reachedPoolLimit: boolean;
  shouldDisableNewPools: boolean;
};

type Actions = {
  setUser: (user: User) => void;
  setDashboard: (dashboard: Dashboard) => void;
  resetUser: () => void;
};

type UserState = Store & Actions;

type UserBootstrapData = {
  user: User;
  dashboard: Dashboard;
};

const useUserStoreBase = create<UserState>()(
  devtools((set) => ({
    user: {} as User,
    setUser: (user: User) => {
      // The API allows or denies paid actions from the company owner's plan.
      set({
        user,
        isFreePlan: false,
        reachedPoolLimit: false,
        shouldDisableNewPools: false
      });
    },
    dashboard: {} as Dashboard,
    setDashboard: (dashboard: Dashboard) => {
      set({ dashboard });
    },
    resetUser: () => {
      set({
        user: {} as User,
        dashboard: {} as Dashboard,
        isFreePlan: false,
        reachedPoolLimit: false,
        shouldDisableNewPools: false
      });
    },
    isFreePlan: false,
    reachedPoolLimit: false,
    shouldDisableNewPools: false
  }))
);

const UserBootstrapContext = createContext<UserState | null>(null);

export function UserBootstrapProvider({
  initialData,
  children
}: {
  initialData?: UserBootstrapData | null;
  children: React.ReactNode;
}) {
  const fallback = useMemo(() => {
    if (!initialData?.user?.id) return null;
    return {
      ...useUserStoreBase.getInitialState(),
      user: initialData.user,
      dashboard: initialData.dashboard
    };
  }, [initialData]);

  return <UserBootstrapContext.Provider value={fallback}>{children}</UserBootstrapContext.Provider>;
}

function useUserStoreHook<T>(selector: (state: UserState) => T = (state) => state as T): T {
  const fallback = useContext(UserBootstrapContext);
  const live = useUserStoreBase(selector);
  const hasLiveUser = useUserStoreBase((state) => Boolean(state.user?.id));
  // Hydration reads the empty initial snapshot even after the store is filled.
  // Stay on that snapshot's fallback until the store object itself changes, so logout
  // (a later empty state) does not snap back to the server payload.
  const isInitialSnapshot = useUserStoreBase((state) => state === useUserStoreBase.getInitialState());

  if (!fallback || hasLiveUser || !isInitialSnapshot) return live;
  return selector(fallback);
}

export const useUserStore = Object.assign(useUserStoreHook, useUserStoreBase) as typeof useUserStoreBase;

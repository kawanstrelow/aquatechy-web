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

const UserBootstrapContext = createContext<{ fallback: UserState | null; revision: number }>({
  fallback: null,
  revision: 0
});

export function UserBootstrapProvider({
  initialData,
  revision,
  children
}: {
  initialData?: UserBootstrapData | null;
  revision: number;
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

  const value = useMemo(() => ({ fallback, revision }), [fallback, revision]);

  return <UserBootstrapContext.Provider value={value}>{children}</UserBootstrapContext.Provider>;
}

function useUserStoreHook<T>(selector: (state: UserState) => T = (state) => state as T): T {
  const { fallback, revision } = useContext(UserBootstrapContext);
  // `revision` is bumped from a layout effect after the store is filled. Reading it here
  // re-renders the page (a child of the shell) before paint. A Zustand subscription alone
  // is patched in a passive effect, which can sit unflushed after login until a click.
  void revision;
  const live = useUserStoreBase.getState();
  // The untouched startup snapshot is what hydration renders. Keep the server payload until
  // the store object itself changes, so logout (a later empty state) does not snap back to it.
  const source = fallback && live === useUserStoreBase.getInitialState() ? fallback : live;
  return selector(source);
}

export const useUserStore = Object.assign(useUserStoreHook, useUserStoreBase) as typeof useUserStoreBase;

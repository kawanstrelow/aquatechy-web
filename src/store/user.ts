import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { User } from '../ts/interfaces/User';
import { Dashboard } from '../ts/interfaces/Dashboard';

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

export const useUserStore = create<Store & Actions>()(
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

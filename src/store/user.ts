import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { UserSubscription } from '@/ts/enums/enums';
import { isAtPoolLimit } from '@/utils/planAccess';

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
      const atPoolLimit = isAtPoolLimit(user.subscription, user.poolsCount);
      set({
        user,
        isFreePlan: user.subscription === UserSubscription.FREE,
        reachedPoolLimit: atPoolLimit,
        shouldDisableNewPools: atPoolLimit
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

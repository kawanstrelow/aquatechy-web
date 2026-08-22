import Cookies from 'js-cookie';
import { useSyncExternalStore } from 'react';

import { clientAxios } from '@/lib/clientAxios';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { Dashboard } from '@/ts/interfaces/Dashboard';
import { User } from '@/ts/interfaces/User';

type UserQueryData = {
  user: User;
  dashboard: Dashboard;
};

type Snapshot = {
  userId?: string;
  status: 'idle' | 'success' | 'error';
  data?: UserQueryData;
};

const listeners = new Set<() => void>();
const started = new Set<string>();
let snapshot: Snapshot = { status: 'idle' };
const serverSnapshot: Snapshot = { status: 'idle' };

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function applyUserData(data: UserQueryData) {
  useUserStore.getState().setUser(data.user);
  useUserStore.getState().setDashboard(data.dashboard);
  useMembersStore.getState().setAssignmentToId(data.user.id);
  useMembersStore.getState().setAssignedToid(data.user.id);
}

function startUserLoad(userId: string) {
  if (started.has(userId)) return;
  started.add(userId);

  clientAxios
    .get(`/users/${userId}/v2`)
    .then((axiosResponse) => {
      const body = axiosResponse.data;
      const data: UserQueryData = {
        user: body.data.user as User,
        dashboard: body.data.dashboard
      };
      applyUserData(data);
      snapshot = { userId, status: 'success', data };
      emit();
    })
    .catch(() => {
      started.delete(userId);
      snapshot = { userId, status: 'error' };
      emit();
    });
}

export function resetUserBootstrap() {
  started.clear();
  snapshot = { status: 'idle' };
  emit();
}

export default function useGetUser() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (typeof window !== 'undefined') {
    const userId = Cookies.get('userId');
    if (userId) startUserLoad(userId);
  }

  return {
    data: snap.data,
    isLoading: snap.status !== 'success',
    isPending: snap.status !== 'success',
    isSuccess: snap.status === 'success'
  };
}

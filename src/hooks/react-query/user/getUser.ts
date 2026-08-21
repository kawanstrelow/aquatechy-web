import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { clientAxios } from '@/lib/clientAxios';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { Dashboard } from '@/ts/interfaces/Dashboard';
import { User } from '@/ts/interfaces/User';

type Props = {
  userId?: string;
};

type UserQueryData = {
  user: User;
  dashboard: Dashboard;
};

export default function useGetUser({ userId }: Props) {
  const setUser = useUserStore((state) => state.setUser);
  const setDashboard = useUserStore((state) => state.setDashboard);
  const { setAssignmentToId, setAssignedToId } = useMembersStore(
    useShallow((state) => ({
      setAssignmentToId: state.setAssignmentToId,
      setAssignedToId: state.setAssignedToid
    }))
  );

  const { data, isLoading, isPending, isSuccess } = useQuery({
    queryKey: ['user', userId],
    enabled: !!userId,
    // Dashboard payload (lastServices, snapshots) is large; structural sharing diffs it on the main thread.
    structuralSharing: false,
    queryFn: async (): Promise<UserQueryData> => {
      const response = (await clientAxios.get(`/users/${userId}/v2`)).data;
      return {
        user: response.data.user as User,
        dashboard: response.data.dashboard
      };
    }
  });

  useEffect(() => {
    if (!data) return;
    setUser(data.user);
    setDashboard(data.dashboard);
    setAssignmentToId(data.user.id);
    setAssignedToId(data.user.id);
  }, [data, setUser, setDashboard, setAssignmentToId, setAssignedToId]);

  return { data, isLoading, isPending, isSuccess };
}

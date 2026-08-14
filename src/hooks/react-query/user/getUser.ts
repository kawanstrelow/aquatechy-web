import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';

import { clientAxios } from '@/lib/clientAxios';
import { useUserStore } from '@/store/user';
import { User } from '@/ts/interfaces/User';
import { useMembersStore } from '@/store/members';

type Props = {
  userId?: string;
};

export default function useGetUser({ userId }: Props) {
  const setUser = useUserStore((state) => state.setUser);
  const setDashboard = useUserStore((state) => state.setDashboard);
  const { setAssignmentToId, setAssignedToId } = useMembersStore(
    useShallow((state) => ({
      setMembers: state.setMembers,
      setAssignmentToId: state.setAssignmentToId,
      setAssignedToId: state.setAssignedToid
    }))
  );

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['user', userId],
    enabled: !!userId,
    // Dashboard payload (lastServices, snapshots) is large; structural sharing diffs it on the main thread.
    structuralSharing: false,
    queryFn: async () => {
      const response = (await clientAxios.get(`/users/${userId}/v2`)).data;
      const user = response.data.user as User;
      delete response.data.user;

      const dashboard = response.data.dashboard;

      setUser(user);
      setDashboard(dashboard);
      setAssignmentToId(user.id);
      setAssignedToId(user.id);

      return user;
    }
  });

  return { data, isLoading, isSuccess };
}

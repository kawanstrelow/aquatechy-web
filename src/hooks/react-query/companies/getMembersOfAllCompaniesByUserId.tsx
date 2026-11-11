import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { CompanyMember } from '@/ts/interfaces/Company';
import { useMembersStore } from '@/store/members';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '@/store/user';

export default function useGetMembersOfAllCompaniesByUserId(userId: string) {
  const { setMembers } = useMembersStore(
    useShallow((state) => ({
      setMembers: state.setMembers,
      setAssignmentToId: state.setAssignmentToId
    }))
  );

  const user = useUserStore((state) => state.user);

  const {
    data = [],
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['companyMembers', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await clientAxios.get(`/companies/members/${userId}`);

      const members: CompanyMember[] = response.data.members ? response.data.members : [];

      setMembers(members);

      return members;
    }
  });
  return { data, isLoading, isSuccess };
}

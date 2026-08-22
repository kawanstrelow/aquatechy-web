import Cookies from 'js-cookie';
import { QueryClient } from '@tanstack/react-query';

import { resetUserBootstrap } from '@/hooks/react-query/user/getUser';
import { useUserStore } from '@/store/user';
import { useMembersStore } from '@/store/members';
import { useWeekdayStore } from '@/store/weekday';

/**
 * Comprehensive logout function that:
 * 1. Removes authentication cookies
 * 2. Clears React Query cache
 * 3. Clears user-related localStorage
 * 4. Resets all application stores
 * 5. Redirects to login page
 */
export const performLogout = (queryClient: QueryClient, router: { push: (path: string) => void }) => {
  // Remove authentication cookies (path: '/' must match how they were set)
  Cookies.remove('accessToken', { path: '/' });
  Cookies.remove('userId', { path: '/' });
  resetUserBootstrap();
  
  // Clear React Query cache
  queryClient.resetQueries();
  queryClient.clear();
  queryClient.removeQueries();
  
  
  
  // Reset all stores
  const { resetUser } = useUserStore.getState();
  const { resetMembers } = useMembersStore.getState();
  const { resetWeekday } = useWeekdayStore.getState();
  
  resetUser();
  resetMembers();
  resetWeekday();
  
  // Navigate to login
  router.push('/login');
};

/**
 * Hook-based logout function for components
 */
export const useLogout = () => {
  const resetUser = useUserStore((state) => state.resetUser);
  const resetMembers = useMembersStore((state) => state.resetMembers);
  const resetWeekday = useWeekdayStore((state) => state.resetWeekday);

  return (queryClient: QueryClient, router: { push: (path: string) => void }) => {
    // Remove authentication cookies (path: '/' must match how they were set)
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('userId', { path: '/' });
    resetUserBootstrap();
    
    // Clear React Query cache
    queryClient.resetQueries();
    queryClient.clear();
    queryClient.removeQueries();
    
   
    
    // Reset all stores
    resetUser();
    resetMembers();
    resetWeekday();
    
    // Navigate to login
    router.push('/login');
  };
};

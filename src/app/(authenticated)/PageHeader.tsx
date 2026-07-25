'use client';

import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { AccountDropdownMenu } from './AccountDropdownMenu';
import { PageTitle } from './PageTitle';
import { MobileSideMenu } from './SideMenuNav';
import { useLogout } from '@/utils/logout';

export default function PageHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogout();

  const handleLogout = () => {
    logout(queryClient, router);
  };

  return (
    <div className="inline-flex max-h-20 w-full items-center bg-gray-800 px-4 py-2 shadow-inner lg:bg-gray-50 lg:py-4">
      <div className="lg:hidden">
        <MobileSideMenu />
      </div>
      <div className="hidden justify-start lg:inline">
        <PageTitle />
      </div>
      <div className="ml-auto flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="lg"
          asChild
          className="border-white/30 bg-transparent text-gray-50 shadow-none hover:bg-gray-700 hover:text-white lg:border-slate-200 lg:bg-gray-50 lg:text-slate-900 lg:shadow-sm lg:hover:bg-slate-100 lg:hover:text-slate-900"
        >
          <a href="https://www.aquatechyapp.com/tutorials" target="_blank" rel="noopener noreferrer">
            Tutorials
          </a>
        </Button>
        <AccountDropdownMenu handleLogout={handleLogout} />
      </div>
    </div>
  );
}

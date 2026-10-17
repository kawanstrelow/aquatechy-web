'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useLogout } from '@/utils/logout';

import { AccountDropdownMenu } from './AccountDropdownMenu';
import { PageTitle } from './PageTitle';
import { MobileSideMenu } from './SideMenuNav';

export default function PageHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogout();

  const handleLogout = () => {
    logout(queryClient, router);
  };

  return (
    <div className="sticky top-0 z-20 flex w-full items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
      <div className="lg:hidden">
        <MobileSideMenu />
      </div>
      <div className="hidden min-w-0 lg:block">
        <PageTitle />
      </div>
      <div className="ml-auto flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-line bg-surface text-ink shadow-none hover:bg-canvas hover:text-ink"
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

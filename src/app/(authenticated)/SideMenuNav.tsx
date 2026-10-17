'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RiMenu2Fill } from 'react-icons/ri';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { routes } from '@/constants';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { canAccessAiChat } from '@/utils/aiChatAccess';

import SideMenuNavLink from './SideMenuNavLink';

function useVisibleRoutes() {
  const { data: companies, isLoading } = useGetCompanies();

  return useMemo(() => {
    if (isLoading || !canAccessAiChat(companies)) {
      return routes.filter((route) => route.href !== '/chat');
    }
    return routes;
  }, [companies, isLoading]);
}

function SideMenuPanel() {
  const visibleRoutes = useVisibleRoutes();

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="px-5 pb-3 pt-12">
        <Image
          width="0"
          height="0"
          sizes="100vw"
          className="h-auto w-full"
          src="/images/logoHor.png"
          alt="Aquatechy Logo"
          priority
        />
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-6">
        {visibleRoutes.map((route) => (
          <SideMenuNavLink key={route.href + route.text + route.submenu} route={route} />
        ))}
      </nav>
    </div>
  );
}

export function MobileSideMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex text-ink" aria-label="Open menu">
        <RiMenu2Fill size={28} />
      </button>
      <SheetContent side="left" className="w-[248px] border-r border-line bg-surface p-0 [&>button]:text-ink">
        <SideMenuPanel />
      </SheetContent>
    </Sheet>
  );
}

export function SideMenu() {
  return (
    <aside className="flex h-screen w-[248px] flex-col border-r border-line bg-surface">
      <SideMenuPanel />
    </aside>
  );
}

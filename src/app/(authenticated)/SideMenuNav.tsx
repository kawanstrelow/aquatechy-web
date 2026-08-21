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
  const { data: companies } = useGetCompanies();

  return useMemo(() => {
    if (canAccessAiChat(companies)) {
      return routes;
    }
    return routes.filter((route) => route.href !== '/chat');
  }, [companies]);
}

// Documentation: https://ui.shadcn.com/docs/components/sheet
export function MobileSideMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visibleRoutes = useVisibleRoutes();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <RiMenu2Fill onClick={() => setOpen(true)} size={32} className="cursor-pointer text-gray-50" />
      <SheetContent side="left" className="w-[253px] bg-gray-900 p-0">
        <aside className="col-span-1 h-full bg-gray-900">
          <div className="inline-flex h-[100%] w-full flex-col items-start justify-start gap-4 overflow-y-auto bg-gray-900 shadow-inner">
            <div className="mt-10 self-center">
              <Image
                width="0"
                height="0"
                sizes="100vw"
                className="h-auto w-52"
                src="/images/logoHor.png"
                alt="Aquatechy Logo"
                priority
              />
            </div>
            <div className="flex shrink grow basis-0 flex-col items-start justify-start gap-2 self-stretch">
              {visibleRoutes.map((route) => {
                return (
                  <div key={route.href + route.submenu} className="w-full">
                    <SideMenuNavLink key={route.href + route.text + route.submenu} route={route} />
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </SheetContent>
    </Sheet>
  );
}

export function SideMenu() {
  const visibleRoutes = useVisibleRoutes();

  return (
    <aside className="col-span-1 h-full bg-gray-900">
      <div className="inline-flex h-[100%] w-full flex-col items-start justify-start gap-4 bg-gray-900 shadow-inner">
        <div className="mx-4 mt-6 h-auto self-center">
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
        <div className="flex shrink grow basis-0 flex-col items-start justify-start gap-2 self-stretch">
          {visibleRoutes.map((route) => {
            return <SideMenuNavLink key={route.href + route.text + route.submenu} route={route} />;
          })}
        </div>
      </div>
    </aside>
  );
}

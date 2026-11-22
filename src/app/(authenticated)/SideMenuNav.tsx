'use client';

import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { RiMenu2Fill } from 'react-icons/ri';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { routes } from '@/constants';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import type { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { canAccessAiChat } from '@/utils/aiChatAccess';

import SideMenuNavLink from './SideMenuNavLink';

function SideMenuPanel() {
  const queryClient = useQueryClient();
  const { data: liveCompanies = [], isSuccess } = useGetCompanies();
  const [companies, setCompanies] = useState<CompanyWithMyRole[] | null>(
    () => queryClient.getQueryData<CompanyWithMyRole[]>(['companies']) ?? null
  );
  const [navKey, setNavKey] = useState(0);

  useLayoutEffect(() => {
    setNavKey(1);
    const sync = () => {
      const cached = queryClient.getQueryData<CompanyWithMyRole[]>(['companies']);
      if (cached != null) setCompanies(cached);
    };
    sync();
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === 'companies') sync();
    });
  }, [queryClient]);

  const resolved = companies ?? (isSuccess ? liveCompanies : null);
  const visibleRoutes = useMemo(() => {
    if (!resolved || !canAccessAiChat(resolved)) {
      return routes.filter((route) => route.href !== '/chat');
    }
    return routes;
  }, [resolved]);

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
      <nav key={navKey} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-6">
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
  const t = useTranslations('common');

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex text-ink" aria-label={t('openMenu')}>
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

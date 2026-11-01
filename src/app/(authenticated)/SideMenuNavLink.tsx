import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

type NavItem = {
  i18nKey: string;
  text: string;
  href: string;
};

type Props = {
  route: NavItem & {
    icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>;
    submenu?: {
      [key: string]: NavItem;
    };
  };
};

function useNavText(i18nKey: string, fallback: string) {
  const t = useTranslations('nav');
  const key = `${i18nKey}.text`;
  return t.has(key) ? t(key) : fallback;
}

export default function SideMenuNavLink({ route }: Props) {
  const { icon: Icon, text, href, submenu, i18nKey } = route;
  const label = useNavText(i18nKey, text);
  const pathname = usePathname();
  const pathResource = `/${pathname.split('/')[1]}`;
  const isActive = href === pathResource;

  const rowClass = cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas hover:no-underline',
    isActive && 'bg-accent-soft text-accent hover:bg-accent-soft'
  );

  if (!submenu) {
    return (
      <Link href={href} className={rowClass}>
        <Icon className="h-5 w-5 shrink-0" height={20} width={20} size={20} />
        <span className="leading-none">{label}</span>
      </Link>
    );
  }

  return (
    <Accordion collapsible type="single" className="w-full">
        <AccordionItem value={href} className="border-b-0">
        <AccordionTrigger className={cn(rowClass, 'hover:no-underline')}>
          <span className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" height={20} width={20} size={20} />
            <span className="leading-none">{label}</span>
          </span>
        </AccordionTrigger>
        {Object.entries(submenu).map(([key, subItem]) => {
          return <SideMenuSubLink key={key + subItem.href + subItem.text} subItem={subItem} pathname={pathname} />;
        })}
      </AccordionItem>
    </Accordion>
  );
}

function SideMenuSubLink({ subItem, pathname }: { subItem: NavItem; pathname: string }) {
  const label = useNavText(subItem.i18nKey, subItem.text);
  const subActive = pathname === subItem.href;

  return (
    <Link href={subItem.href}>
      <AccordionContent
        className={cn(
          'pb-0 pt-0 text-sm font-medium leading-none text-ink-muted hover:text-accent',
          subActive && 'font-semibold text-accent'
        )}
      >
        <div className="ml-9 py-2">{label}</div>
      </AccordionContent>
    </Link>
  );
}

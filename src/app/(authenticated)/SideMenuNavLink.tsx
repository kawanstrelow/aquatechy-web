import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

type Props = {
  route: {
    icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>;
    text: string;
    href: string;
    submenu?: {
      [key: string]: {
        text: string;
        href: string;
      };
    };
  };
};

export default function SideMenuNavLink({ route }: Props) {
  const { icon: Icon, text, href, submenu } = route;
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
        <span className="leading-none">{text}</span>
      </Link>
    );
  }

  return (
    <Accordion collapsible type="single" className="w-full">
        <AccordionItem value={href} className="border-b-0">
        <AccordionTrigger className={cn(rowClass, 'hover:no-underline')}>
          <span className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" height={20} width={20} size={20} />
            <span className="leading-none">{text}</span>
          </span>
        </AccordionTrigger>
        {Object.entries(submenu).map(([key, subItem]) => {
          const subActive = pathname === subItem.href;
          return (
            <Link href={subItem.href} key={key + subItem.href + subItem.text}>
              <AccordionContent
                className={cn(
                  'pb-0 pt-0 text-sm font-medium leading-none text-ink-muted hover:text-accent',
                  subActive && 'font-semibold text-accent'
                )}
              >
                <div className="ml-9 py-2">{subItem.text}</div>
              </AccordionContent>
            </Link>
          );
        })}
      </AccordionItem>
    </Accordion>
  );
}

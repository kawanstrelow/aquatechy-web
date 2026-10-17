import Image from 'next/image';

import { cn } from '@/lib/utils';
import logo from '/public/images/logoHor.png';

export const authButtonClassName =
  'h-11 w-full rounded-lg bg-accent text-sm font-semibold text-white shadow-none hover:bg-accent/90 focus-visible:ring-accent';

type AuthPanelProps = {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AuthPanel({ title, description, children, className }: AuthPanelProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[480px] rounded-xl border border-line bg-surface px-8 py-10 shadow-lift',
        className
      )}
    >
      <Image priority src={logo} alt="Aquatechy" className="mx-auto mb-8 block h-auto w-44" />
      {title ? <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1> : null}
      {description ? <div className="mt-2 text-sm leading-6 text-ink-muted">{description}</div> : null}
      <div
        className={cn(
          '[&_input]:h-11 [&_input]:rounded-lg [&_input]:border-line [&_input]:bg-surface [&_input]:text-ink [&_input]:shadow-none [&_input]:placeholder:text-ink-muted [&_input]:focus-visible:ring-accent',
          title || description ? 'mt-8' : undefined
        )}
      >
        {children}
      </div>
    </div>
  );
}

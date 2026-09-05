interface PoolFilterIconProps {
  className?: string;
}

export function PoolFilterIcon({ className = 'h-16 w-16' }: PoolFilterIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M18 22c0-7.732 6.268-14 14-14s14 6.268 14 14v22c0 4.418-3.582 8-8 8H26c-4.418 0-8-3.582-8-8V22Z"
        className="fill-sky-50 stroke-sky-600"
        strokeWidth="2"
      />
      <path d="M22 24h20" className="stroke-sky-500" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 32h16M24 38h16M24 44h10" className="stroke-sky-300" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="12" r="3" className="fill-sky-600" />
      <path d="M32 9V6" className="stroke-sky-600" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 28h6v8h-6" className="stroke-sky-600" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 40H12v6h6" className="stroke-sky-600" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

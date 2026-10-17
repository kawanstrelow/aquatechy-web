import Image from 'next/image';

import heroBackground from '@/assets/images/background-2.jpg';
import mobileBackground from '@/assets/images/background-mobile-3.jpg';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-canvas">
      <div className="absolute inset-0 lg:hidden">
        <Image
          fill
          priority
          src={mobileBackground}
          alt=""
          className="object-cover"
          sizes="100vw"
          quality={90}
        />
      </div>
      <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
        <Image
          fill
          priority
          src={heroBackground}
          alt="Aquatechy office app beside a pool service photo"
          className="object-cover"
          sizes="50vw"
          quality={90}
        />
      </div>
      <main className="relative z-10 flex min-h-screen w-full flex-col lg:w-1/2 lg:bg-canvas">
        <div className="m-auto w-full max-w-[560px] px-6 py-12 sm:px-10">{children}</div>
        <p className="pb-5 text-center text-[11px] tracking-wide text-white/45 lg:text-ink-muted/35">
          © 2026 Aquatechy. All rights reserved.
        </p>
      </main>
    </div>
  );
}

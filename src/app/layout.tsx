import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { ReactQueryProviderComponent } from '@/providers/ReactQueryProviderComponent';

import { Toaster } from '../components/ui/toaster';
import Script from 'next/script';

const poppins = localFont({
  src: [
    {
      path: '../../public/fonts/Poppins-Bold.ttf',
      weight: '700'
    },
    {
      path: '../../public/fonts/Poppins-SemiBold.ttf',
      weight: '600'
    },
    {
      path: '../../public/fonts/Poppins-Regular.ttf',
      weight: '300'
    }
  ]
});

export const metadata: Metadata = {
  title: 'Aquatechy',
  description:
    'Professional pool service management platform. Streamline your pool maintenance operations, track chemical readings, manage routes, and organize service schedules efficiently.',
  icons: [
    {
      href: '/images/favicon.png',
      sizes: 'any',
      url: '/images/favicon.png'
    }
  ]
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <body className={poppins.className}>
        <Analytics />
        <ReactQueryProviderComponent>{children}</ReactQueryProviderComponent>
        <Toaster />
      </body>
    </html>
  );
}

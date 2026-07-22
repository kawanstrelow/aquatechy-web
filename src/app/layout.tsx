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
      {process.env.NEXT_PUBLIC_FB_PIXEL_ID ? (
        <>
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}
      <body className={poppins.className}>
        <Analytics />
        <ReactQueryProviderComponent>{children}</ReactQueryProviderComponent>
        <Toaster />
      </body>
    </html>
  );
}

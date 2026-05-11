'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-white to-blue-50">
      <div className="border-b bg-white px-4 py-2 shadow-sm flex justify-center">
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
      <div className="flex h-full flex-col items-center justify-center p-4 pb-40">
        <div className="relative">
          <div className="absolute -right-3 -top-3">
            
          </div>
        </div>
        <h1 className="mt-8 text-xl font-bold text-zinc-700">Page not found</h1>
        <p className="mb-6 mt-3 text-center text-lg text-zinc-600">
          Looks like you've sailed into uncharted waters!
          <br />
          This page doesn't exist.
        </p>
        <Button asChild variant="default" className="bg-blue-500 hover:bg-blue-600">
          <Link href={'/dashboard'} replace>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Aquatechy
          </Link>
        </Button>
      </div>
    </div>
  );
}

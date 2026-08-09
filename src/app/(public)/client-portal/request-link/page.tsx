'use client';

import { FormEvent, Suspense, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CLIENT_PORTAL_GRADIENT_BLUE_STYLE,
  clientPortalMutedSurfaceClassName,
  clientPortalOutlineAccentButtonClassName,
  clientPortalPrimaryButtonClassName
} from '@/constants/clientPortal';
import { Loader2 } from 'lucide-react';

function apiOrigin(): string {
  const raw = process.env.API_URL ?? '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function ClientPortalRequestLinkPage() {
  const searchParams = useSearchParams();
  const estimateId = searchParams.get('estimateId')?.trim() || undefined;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const base = apiOrigin();
      await axios.post(
        `${base}/api/v1/client-portal/request-link`,
        { email: email.trim(), ...(estimateId ? { estimateId } : {}) },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25_000
        }
      );
      setSubmitted(true);
    } catch {
      // Always show neutral success pattern for anti-enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Client invoice portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email to receive a one-time magic link from your pool service company.
        </p>
      </div>

      {submitted ? (
        <div className={`space-y-4 rounded-lg p-6 shadow-sm ${clientPortalMutedSurfaceClassName} border`}>
          <p className="text-sm text-slate-700">
            If we found an account matching that email, check your inbox for a secure login link shortly.
          </p>
          <Button
            type="button"
            variant="outline"
            className={clientPortalOutlineAccentButtonClassName}
            onClick={() => setSubmitted(false)}
          >
            Request another link
          </Button>
          <p className="text-xs text-slate-500">
            For security reasons we cannot confirm whether a specific address receives mail.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="portal-email">Email</Label>
            <Input
              id="portal-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button
            type="submit"
            className={`w-full ${clientPortalPrimaryButtonClassName}`}
            style={CLIENT_PORTAL_GRADIENT_BLUE_STYLE}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Email me the link
          </Button>
        </form>
      )}

    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md items-center justify-center py-16 text-sm text-slate-500">Loading...</div>
      }
    >
      <ClientPortalRequestLinkPage />
    </Suspense>
  );
}

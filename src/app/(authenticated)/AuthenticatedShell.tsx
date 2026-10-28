'use client';

import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';

import { VideoModal } from '@/components/VideoModal';
import useGetUser, { ensureClientUserLoad, hydrateUserBootstrap } from '@/hooks/react-query/user/getUser';
import type { UserQueryData } from '@/hooks/react-query/user/getUser';
import { hasPlanAccess, isAtPoolLimit, isPoolCreatePath, requiredPlanForPath } from '@/utils/planAccess';

import { HelpButton } from './HelpButton';
import PageHeader from './PageHeader';
import { PlanUpgradePrompt } from './PlanUpgradePrompt';
import { SideMenu } from './SideMenuNav';

function needsOnboarding(user?: { id?: string; firstName?: string | null; lastName?: string | null }) {
  if (!user?.id) return false;
  return !user.firstName?.trim() && !user.lastName?.trim();
}

type Props = {
  children: React.ReactNode;
  initialData?: UserQueryData | null;
};

export default function AuthenticatedShell({ children, initialData }: Props) {
  useState(() => {
    if (initialData) hydrateUserBootstrap(initialData);
    return true;
  });

  const router = useRouter();
  const pathname = usePathname();
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  // Zustand's server snapshot is the empty store, so the first paint has no dashboard.
  // A layout-effect render reads the client store before the browser paints. Without it,
  // that correction waits on a passive effect that can sit unflushed after login until a click.
  const [storeReady, setStoreReady] = useState(false);
  const { data } = useGetUser();
  const user = data?.user ?? initialData?.user;
  const userId = user?.id;
  const profileIncomplete = needsOnboarding(user);
  const isRedirectingToOnboarding = profileIncomplete && pathname !== '/onboarding';
  const isUserLoading = (!data && !initialData) || isRedirectingToOnboarding;

  useLayoutEffect(() => {
    if (initialData) hydrateUserBootstrap(initialData);
    else ensureClientUserLoad();
    setStoreReady(true);
  }, [initialData]);

  useLayoutEffect(() => {
    if (!Cookies.get('userId')) {
      router.replace('/login');
      return;
    }
    if (isRedirectingToOnboarding) {
      window.location.replace('/onboarding');
    }
  }, [isRedirectingToOnboarding, router]);

  useLayoutEffect(() => {
    if (isUserLoading || !userId) return;
    if (localStorage.getItem(`welcome-video-${userId}`)) return;
    setShowWelcomeVideo(true);
  }, [isUserLoading, userId]);

  const handleCloseWelcomeVideo = () => {
    if (userId) {
      localStorage.setItem(`welcome-video-${userId}`, 'true');
    }
    setShowWelcomeVideo(false);
  };

  const requiredPlan = requiredPlanForPath(pathname);
  const blockedByPlan = Boolean(user && requiredPlan && !hasPlanAccess(user.subscription, requiredPlan));
  const blockedByPools = Boolean(
    user && isPoolCreatePath(pathname) && isAtPoolLimit(user.subscription, user.poolsCount)
  );

  return (
    <>
      {!isUserLoading && showWelcomeVideo && (
        <VideoModal
          isOpen={showWelcomeVideo}
          onClose={handleCloseWelcomeVideo}
          videoUrl="https://vimeo.com/1237020080?title=0&byline=0&portrait=0"
          title="Welcome to Aquatechy!"
        />
      )}
      <div className="min-h-screen bg-canvas lg:flex">
        <div className="sticky top-0 z-30 hidden h-screen shrink-0 lg:block">
          <SideMenu />
        </div>
        <div className="min-w-0 flex-1">
          <PageHeader />
          <main data-store-ready={storeReady ? 'true' : 'false'}>
            <div className="px-4 py-5 lg:px-8 lg:py-6">
              {isUserLoading ? (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-8 border-line border-t-accent" />
                </div>
              ) : blockedByPlan && requiredPlan ? (
                <PlanUpgradePrompt reason="feature" requiredPlan={requiredPlan} />
              ) : blockedByPools ? (
                <PlanUpgradePrompt reason="pools" />
              ) : (
                children
              )}
            </div>
          </main>
          <HelpButton />
        </div>
      </div>
    </>
  );
}

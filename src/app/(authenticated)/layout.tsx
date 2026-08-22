'use client';

import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { VideoModal } from '@/components/VideoModal';
import useGetUser from '@/hooks/react-query/user/getUser';
import { HelpButton } from './HelpButton';
import PageHeader from './PageHeader';
import { SideMenu } from './SideMenuNav';

function needsOnboarding(user?: { id?: string; firstName?: string | null; lastName?: string | null }) {
  if (!user?.id) return false;
  return !user.firstName?.trim() && !user.lastName?.trim();
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const { isPending, data } = useGetUser();
  const userId = data?.user?.id;
  const profileIncomplete = needsOnboarding(data?.user);
  const isRedirectingToOnboarding = profileIncomplete && pathname !== '/onboarding';
  const isUserLoading = isPending || !data || isRedirectingToOnboarding;

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

  return (
    <>
      {!isUserLoading && showWelcomeVideo && (
        <VideoModal
          isOpen={showWelcomeVideo}
          onClose={handleCloseWelcomeVideo}
          videoUrl="https://vimeo.com/1062213838?title=0&byline=0&portrait=0"
          title="Welcome to Aquatechy!"
        />
      )}
      <div className="h-screen w-full lg:grid lg:grid-cols-6">
        <div className="hidden h-full lg:inline">
          <SideMenu />
        </div>
        <div className="col-span-5 bg-gray-50">
          <PageHeader />
          <main>
            <div className="mx-2 mt-2 rounded-md border border-gray-200 p-2 shadow-inner lg:mt-0">
              {isUserLoading ? (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-8 border-gray-300 border-t-blue-500" />
                </div>
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

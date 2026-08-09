'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { Suspense, useEffect, useState } from 'react';
import { Colors } from '@/constants/colors';
import { AssignmentsProvider } from '@/context/assignments';
import useGetUser from '@/hooks/react-query/user/getUser';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import PageHeader from './PageHeader';
import { SideMenu } from './SideMenuNav';
import { ServicesProvider } from '@/context/services';
import { VideoModal } from '@/components/VideoModal';
import { useUserStore } from '@/store/user';
import { HelpButton } from './HelpButton';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const userId = Cookies.get('userId') as string;
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);

  useEffect(() => {
    if (!userId) {
      return router.push('/login');
    }

    // Check if it's the first visit
    const hasSeenWelcomeVideo = localStorage.getItem(`welcome-video-${userId}`);
    if (!hasSeenWelcomeVideo && user.id) {
      setShowWelcomeVideo(true);
    }
  }, [userId, user.id]);

  const handleCloseWelcomeVideo = () => {
    localStorage.setItem(`welcome-video-${userId}`, 'true');
    setShowWelcomeVideo(false);
  };

  const { isLoading } = useGetUser({ userId });

  return (
    <>
      {showWelcomeVideo && (
        <VideoModal
          isOpen={showWelcomeVideo}
          onClose={handleCloseWelcomeVideo}
          // hide title, channel and avatar photo from video player
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
            <Suspense fallback={<LoadingSpinner />}>
              <div className="mx-2 mt-2 rounded-md border border-gray-200 p-2 shadow-inner lg:mt-0">
                {/* <AssignmentsProvider>
                  <ServicesProvider>{isLoading ? <LoadingSpinner /> : children}</ServicesProvider>
                </AssignmentsProvider> */}
                
                {isLoading ? <LoadingSpinner /> : children}
              </div>
            </Suspense>
            <Suspense fallback={null}>
              <ProgressBar height="6px" color={Colors.blue[500]} options={{ showSpinner: false }} shallowRouting />
            </Suspense>
          </main>
          <HelpButton />
        </div>
      </div>
    </>
  );
}

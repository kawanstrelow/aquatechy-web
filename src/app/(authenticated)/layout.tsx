'use client';

import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VideoModal } from '@/components/VideoModal';
import { Colors } from '@/constants/colors';
import useGetUser from '@/hooks/react-query/user/getUser';
import { useUserStore } from '@/store/user';
import PageHeader from './PageHeader';
import { SideMenu } from './SideMenuNav';
import { HelpButton } from './HelpButton';

const ProgressBar = dynamic(() => import('next-nprogress-bar').then((mod) => mod.AppProgressBar), { ssr: false });

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

  const { isPending, data } = useGetUser({ userId });
  const isUserLoading = !userId || isPending || !data;

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
            <div className="mx-2 mt-2 rounded-md border border-gray-200 p-2 shadow-inner lg:mt-0">
              {isUserLoading ? (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-8 border-gray-300 border-t-blue-500" />
                </div>
              ) : (
                children
              )}
            </div>
            <ProgressBar height="6px" color={Colors.blue[500]} options={{ showSpinner: false }} shallowRouting />
          </main>
          <HelpButton />
        </div>
      </div>
    </>
  );
}

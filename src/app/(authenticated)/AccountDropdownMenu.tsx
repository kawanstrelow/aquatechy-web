import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { isProductTourAudience } from '@/product-tour/steps';
import { replayProductTour } from '@/product-tour/storage';
import { useUserStore } from '@/store/user';
import { getInitials } from '@/utils/others';

import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';

type Props = {
  handleLogout: () => void;
};

export function AccountDropdownMenu({ handleLogout }: Props) {
  const { user } = useUserStore();
  const router = useRouter();
  const t = useTranslations('common');
  const tour = useTranslations('productTour');
  const { data: companies = [] } = useGetCompanies();
  const isLoaded = Boolean(user.firstName && user.lastName);
  const canReplayTour = isProductTourAudience(companies);

  const handleReplayTour = () => {
    if (!user.id) return;
    replayProductTour(user.id);
    router.push('/dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isLoaded ? (
          <Avatar className="cursor-pointer border">
            <AvatarImage src={''} />
            <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={() => router.push('/quickstart')}>{t('quickStart')}</DropdownMenuItem>
        {canReplayTour ? <DropdownMenuItem onClick={handleReplayTour}>{tour('showMeAround')}</DropdownMenuItem> : null}
        <DropdownMenuItem onSelect={() => router.push('/settings/profile')}>{t('profile')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <span className="text-red-500">{t('logOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

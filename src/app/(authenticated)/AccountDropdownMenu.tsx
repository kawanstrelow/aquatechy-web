import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
  const isLoaded = Boolean(user.firstName && user.lastName);

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
        <DropdownMenuItem onSelect={() => router.push('/settings/profile')}>{t('profile')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <span className="text-red-500">{t('logOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

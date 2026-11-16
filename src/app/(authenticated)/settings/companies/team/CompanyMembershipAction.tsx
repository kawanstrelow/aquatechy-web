'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAcceptCompanyInvitation } from '@/hooks/react-query/companies/acceptCompanyInvitation';
import { useDeleteCompanyMember } from '@/hooks/react-query/companies/deleteCompanyMember';
import { useUserStore } from '@/store/user';

const QUIT_CONFIRMATION = 'QUIT';

type Props = {
  companyId: string;
  companyName: string;
  membershipStatus: 'Active' | 'Inactive';
  role?: string;
  userCompanyId?: string;
};

export function CompanyMembershipAction({ companyId, companyName, membershipStatus, role, userCompanyId }: Props) {
  const t = useTranslations('settings');
  const common = useTranslations('common');
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  const [open, setOpen] = useState(false);
  const [quitConfirmText, setQuitConfirmText] = useState('');

  const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptCompanyInvitation();
  const { mutate: removeMember, isPending: isQuitting } = useDeleteCompanyMember();

  const isActive = membershipStatus === 'Active';
  const hideQuit = role === 'Owner' || role === 'Admin';
  const isBusy = isAccepting || isQuitting;

  if (isActive && hideQuit) return null;
  if (!isActive && !userCompanyId) return null;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuitConfirmText('');
  };

  const handleQuit = () => {
    removeMember(
      { companyId, memberId: user.id },
      {
        onSuccess: () => {
          queryClient.removeQueries({ queryKey: ['companies', companyId] });
          handleOpenChange(false);
          router.replace('/settings/companies');
        }
      }
    );
  };

  const handleAccept = () => {
    if (!userCompanyId) return;
    acceptInvitation({ userCompanyId, status: 'Active' }, { onSuccess: () => handleOpenChange(false) });
  };

  const roleLabel = role && t.has(`roles.${role}`) ? t(`roles.${role}`) : role ?? '';

  const stopCardNavigation = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <div className="flex w-full justify-center" onClick={stopCardNavigation} onPointerDown={stopCardNavigation}>
        <Button
          type="button"
          variant={isActive ? 'outline' : 'default'}
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          {isActive ? t('companies.quitCompany') : t('companies.acceptInvitation')}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isActive ? t('companies.leaveCompanyTitle') : t('companies.acceptInvitation')}</DialogTitle>
            <DialogDescription>
              {isActive
                ? t('companies.leaveCompanyDescription', { companyName })
                : t('companies.joinCompanyDescription', {
                    companyName,
                    role: roleLabel
                  })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isActive ? (
              <>
                <p className="text-muted-foreground text-sm">
                  {t.rich('companies.typeQuitToConfirm', {
                    token: (chunks) => <span className="font-semibold">{chunks}</span>
                  })}
                </p>
                <Input
                  value={quitConfirmText}
                  onChange={(e) => setQuitConfirmText(e.target.value)}
                  placeholder={QUIT_CONFIRMATION}
                  autoComplete="off"
                  aria-label={t('companies.typeQuitAria')}
                />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t('companies.acceptMembershipHint')}</p>
            )}
          </div>

          <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isBusy}>
              {common('cancel')}
            </Button>
            {isActive ? (
              <Button
                type="button"
                variant="destructive"
                disabled={quitConfirmText !== QUIT_CONFIRMATION || isBusy}
                onClick={handleQuit}
              >
                {isQuitting ? t('companies.leaving') : t('companies.leaveCompany')}
              </Button>
            ) : (
              <Button type="button" disabled={isBusy} onClick={handleAccept}>
                {isAccepting ? t('companies.accepting') : t('companies.acceptInvitation')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

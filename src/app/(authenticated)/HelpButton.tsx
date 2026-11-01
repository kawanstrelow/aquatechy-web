'use client';

import { HelpCircle, Calendar, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('common');

  const handleScheduleOnboarding = () => {
    window.open('https://calendly.com/aquatechy/onboarding', '_blank');
    setIsOpen(false);
  };

  const handleTextCompany = () => {
    window.open('sms:+15615714474', '_blank');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lift transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 md:flex"
        aria-label={t('getHelp')}
      >
        <HelpCircle className="h-7 w-7" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('helpTitle')}</DialogTitle>
            <DialogDescription>{t('helpDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleScheduleOnboarding}
              className="h-auto w-full justify-start gap-3 py-4"
              variant="outline"
            >
              <Calendar className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">{t('scheduleOnboarding')}</span>
                <span className="text-xs text-gray-500">{t('scheduleOnboardingHint')}</span>
              </div>
            </Button>
            <Button onClick={handleTextCompany} className="h-auto w-full justify-start gap-3 py-4" variant="outline">
              <MessageCircle className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">{t('textUs')}</span>
                <span className="text-xs text-gray-500">{t('textUsHint')}</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

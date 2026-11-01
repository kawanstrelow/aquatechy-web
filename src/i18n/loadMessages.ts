import type { AbstractIntlMessages } from 'next-intl';

import type { AppLocale } from '@/i18n/locale';

export async function loadMessages(locale: AppLocale): Promise<AbstractIntlMessages> {
  switch (locale) {
    case 'pt-BR':
      return (await import('@/messages/pt-BR')).default;
    case 'es':
      return (await import('@/messages/es')).default;
    default:
      return (await import('@/messages/en')).default;
  }
}

export const locales = ['en', 'pt-BR', 'es'] as const;

export type AppLocale = (typeof locales)[number];

export type AccountLanguage = 'English' | 'Portuguese' | 'Spanish';

const accountLanguageToLocale: Record<AccountLanguage, AppLocale> = {
  English: 'en',
  Portuguese: 'pt-BR',
  Spanish: 'es'
};

export function isAccountLanguage(value: unknown): value is AccountLanguage {
  return value === 'English' || value === 'Portuguese' || value === 'Spanish';
}

export function accountLanguageFromLocale(locale: AppLocale): AccountLanguage {
  if (locale === 'pt-BR') return 'Portuguese';
  if (locale === 'es') return 'Spanish';
  return 'English';
}

/** Saved account language wins. Otherwise use the browser language, then English. */
export function resolveLocale(language: unknown, acceptLanguage?: string | null): AppLocale {
  if (isAccountLanguage(language)) return accountLanguageToLocale[language];
  return localeFromAcceptLanguage(acceptLanguage);
}

export const languageSelectOptions: { key: string; value: AccountLanguage; name: string }[] = [
  { key: 'English', value: 'English', name: 'English' },
  { key: 'Portuguese', value: 'Portuguese', name: 'Português (Brasil)' },
  { key: 'Spanish', value: 'Spanish', name: 'Español' }
];

export function languageForForm(language: unknown, locale: AppLocale): AccountLanguage {
  if (isAccountLanguage(language)) return language;
  return accountLanguageFromLocale(locale);
}

export function localeFromAcceptLanguage(header?: string | null): AppLocale {
  if (!header) return 'en';

  const tags = header
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of tags) {
    if (tag.startsWith('pt')) return 'pt-BR';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('en')) return 'en';
  }

  return 'en';
}

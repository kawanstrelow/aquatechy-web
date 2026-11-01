import type { AbstractIntlMessages } from 'next-intl';

import enMessages from '@/messages/en';

let activeMessages: AbstractIntlMessages | null = null;

export function setActiveMessages(messages: AbstractIntlMessages | null) {
  activeMessages = messages;
}

function lookup(messages: AbstractIntlMessages | null | undefined, path: string): string | undefined {
  if (!messages) return undefined;

  let current: unknown = messages;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object' || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

/** Translate a message key such as `validation.email.required`. Other strings are returned unchanged. */
export function translateIfKeyed(message: string): string {
  if (!message.includes('.')) return message;

  return lookup(activeMessages, message) ?? lookup(enMessages, message) ?? message;
}

export function translateMessage(path: string, fallback: string): string {
  return lookup(activeMessages, path) ?? lookup(enMessages, path) ?? fallback;
}

export function translateOptionLabel(option: { key: string; name: string }): string {
  const fromOption = lookup(activeMessages, `options.${option.key}`) ?? lookup(enMessages, `options.${option.key}`);
  if (fromOption) return fromOption;

  const fromCategory =
    lookup(activeMessages, `options.categories.${option.key}`) ??
    lookup(enMessages, `options.categories.${option.key}`);
  return fromCategory ?? option.name;
}

import { Locale } from '../i18n';

type Messages = Record<string, unknown>;

export async function getTranslations(locale: Locale): Promise<Messages> {
  try {
    const messages = await import(`../../messages/${locale}.json`);
    return messages.default;
  } catch {
    // Fallback to English if locale not found
    console.warn(`Translation file for locale '${locale}' not found, falling back to 'en'`);
    const messages = await import(`../../messages/en.json`);
    return messages.default;
  }
}

export function getNestedValue(obj: Messages, path: string): string {
  return path.split('.').reduce((current: unknown, key: string) => 
    current && typeof current === 'object' && current !== null 
      ? (current as Record<string, unknown>)[key] 
      : undefined, obj) as string || path;
}

export class TranslationHelper {
  private messages: Messages;

  constructor(messages: Messages) {
    this.messages = messages;
  }

  t(key: string): string {
    return getNestedValue(this.messages, key);
  }
}

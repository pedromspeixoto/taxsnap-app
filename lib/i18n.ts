export const locales = ['en', 'pt'] as const;
export const defaultLocale = 'pt';
export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português'
};

export const localeFlags: Record<Locale, string> = {
  en: 'gb', // Great Britain flag for English
  pt: 'pt'  // Portugal flag for Portuguese
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

"use client"

import { usePathname } from "next/navigation"
import { isValidLocale, defaultLocale } from "../i18n"
import type { Locale } from "../i18n"

// Hook to get current locale from pathname
export function useCurrentLocale(): Locale {
  const pathname = usePathname()
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  return isValidLocale(potentialLocale) ? potentialLocale : defaultLocale
}

// Helper to create locale-aware URLs
export function createLocalizedPath(path: string, locale?: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  
  // If no locale provided, use default
  const targetLocale = locale || defaultLocale
  
  // Return localized path
  return `/${targetLocale}/${cleanPath}`.replace(/\/+/g, '/').replace(/\/$/, '') || `/${targetLocale}`
}

// Hook to create locale-aware navigation functions
export function useLocalizedNavigation() {
  const currentLocale = useCurrentLocale()
  
  return {
    currentLocale,
    createPath: (path: string) => createLocalizedPath(path, currentLocale),
    getLocalizedHref: (path: string, locale?: Locale) => createLocalizedPath(path, locale || currentLocale)
  }
}

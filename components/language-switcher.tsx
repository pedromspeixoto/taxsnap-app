"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { locales, localeNames, localeFlags } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

interface LanguageSwitcherProps {
  currentLocale: Locale
  className?: string
}

export function LanguageSwitcher({ currentLocale, className = "" }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    startTransition(() => {
      // Remove current locale from pathname and add new locale
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
      const newPath = `/${newLocale}${pathWithoutLocale}`
      
      // Set cookie for locale preference
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 year
      
      router.push(newPath)
    })
    
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[100px]"
        disabled={isPending}
      >
        <img
          src={`https://flagcdn.com/w20/${localeFlags[currentLocale]}.png`}
          alt={`${localeNames[currentLocale]} flag`}
          className="w-4 h-3 object-cover"
        />
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
        <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-1 bg-background border rounded-md shadow-lg z-20 min-w-[140px]">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 first:rounded-t-md last:rounded-b-md ${
                  locale === currentLocale ? 'bg-muted font-medium' : ''
                }`}
                disabled={isPending}
              >
                <img
                  src={`https://flagcdn.com/w20/${localeFlags[locale]}.png`}
                  alt={`${localeNames[locale]} flag`}
                  className="w-4 h-3 object-cover"
                />
                <span>{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

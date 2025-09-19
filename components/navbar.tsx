"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/lib/contexts/auth-context"
import { AuthDialog } from "@/components/auth-dialog"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { useState, useEffect } from "react"

interface NavbarProps {
  title?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  className?: string
  useLocalizedHref?: boolean  // Flag to enable automatic localization of backButtonHref
}

export function Navbar({ 
  title,
  showBackButton = false,
  backButtonText,
  backButtonHref = "/dashboard",
  className = "",
  useLocalizedHref = true
}: NavbarProps) {
  const { user, isAuthenticated, clearAuth } = useAuth()
  const { currentLocale, createPath } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])
  
  // Create the appropriate href for the back button
  const getBackButtonHref = () => {
    if (useLocalizedHref) {
      // Remove leading slash and create localized path
      const path = backButtonHref.startsWith('/') ? backButtonHref.substring(1) : backButtonHref
      return createPath(path)
    }
    return backButtonHref
  }

  const handleLogout = async () => {
    try {
      clearAuth()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className={`border-b ${className}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Logo />
          {showBackButton && (
            <Link href={getBackButtonHref()}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backButtonText || (t ? t.t('nav.backToDashboard') : 'Voltar ao Painel')}
              </Button>
            </Link>
          )}
          {title && (
            <span className="text-lg font-semibold">{title}</span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <LanguageSwitcher currentLocale={currentLocale} />
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
              <Link href={createPath('dashboard/profile')}>
                <Button variant="ghost" size="sm">
                  <span className="hidden sm:inline">{t?.t('nav.profile') || 'Profile'}</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t?.t('nav.logout') || 'Logout'}</span>
              </Button>
            </>
          ) : (
            <>
              <AuthDialog mode="login" t={t} />
              <AuthDialog mode="register" t={t} />
            </>
          )}
        </div>
      </div>
    </header>
  )
} 
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, TrendingUp, Shield, Clock, Users, FileText, Check, Crown } from "lucide-react"
import { AuthDialog } from "@/components/auth-dialog"
import { useAuth } from "@/lib/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Logo } from "@/components/ui/logo"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

interface LandingPageProps {
  params: Promise<{ locale: string }>
}

export default function LandingPage({ params }: LandingPageProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, isHydrated } = useAuth()
  const [t, setT] = useState<TranslationHelper | null>(null)
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  // Resolve params and set locale
  useEffect(() => {
    params.then(resolvedParams => {
      const validLocale = isValidLocale(resolvedParams.locale) ? resolvedParams.locale : defaultLocale
      setLocale(validLocale)
    })
  }, [params])

  // Load translations
  useEffect(() => {
    getTranslations(locale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [locale])

  useEffect(() => {
    // Only redirect if hydrated, not loading, and user is authenticated
    if (isHydrated && !isLoading && isAuthenticated && user) {
      // Add a longer delay to allow other components (like auth dialog) to handle redirects first
      const timer = setTimeout(() => {
        const targetPath = user.verified ? `/${locale}/dashboard` : `/${locale}/verify-account`
        
        // Only redirect if we're not already on the target path
        if (window.location.pathname !== targetPath) {
          try {
            router.push(targetPath)
          } catch (error) {
            console.error('Router push failed:', error)
            // Fallback to window.location as last resort
            window.location.href = targetPath
          }
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [isHydrated, isAuthenticated, user, isLoading, router, locale])

  // Show loading state while checking authentication, during hydration, or loading translations
  if (isLoading || !isHydrated || !t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" showText={false} className="justify-center" />
          <p className="text-muted-foreground">{t?.t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  // Show loading state if user is authenticated (redirect is happening)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" showText={false} className="justify-center" />
          <p className="text-muted-foreground">{t.t('common.redirecting')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            {t.t('hero.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t.t('hero.title').split(' ').slice(0, 2).join(' ')} <span className="text-primary">{t.t('hero.title').split(' ').slice(2).join(' ')}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthDialog mode="register" t={t}>
              <Button size="lg" className="px-8">
                {t.t('hero.cta')}
              </Button>
            </AuthDialog>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.t('advantages.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{t.t('advantages.multiPlatform.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t.t('advantages.multiPlatform.description')}
                </p>
              </CardContent>
            </Card>
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{t.t('advantages.secure.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t.t('advantages.secure.description')}
                </p>
              </CardContent>
            </Card>
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <Clock className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{t.t('advantages.saveTime.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t.t('advantages.saveTime.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t.t('offer.title')}</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{t.t('offer.autoProcessing.title')}</h3>
                    <p className="text-muted-foreground">
                      {t.t('offer.autoProcessing.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{t.t('offer.transactionManagement.title')}</h3>
                    <p className="text-muted-foreground">{t.t('offer.transactionManagement.description')}</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{t.t('offer.taxReports.title')}</h3>
                    <p className="text-muted-foreground">{t.t('offer.taxReports.description')}</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{t.t('offer.historicalTracking.title')}</h3>
                    <p className="text-muted-foreground">{t.t('offer.historicalTracking.description')}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">{t.t('offer.supportedPlatforms')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-3 rounded text-center">Interactive Brokers</div>
                <div className="bg-background p-3 rounded text-center">Trading 212</div>
                <div className="bg-background p-3 rounded text-center">Revolut</div>
                <div className="bg-background p-3 rounded text-center">DEGIRO</div>
                <div className="bg-background p-3 rounded text-center">TradeRepublic</div>
                <div className="bg-background p-3 rounded text-center">And More...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.t('pricing.title')}</h2>
            <p className="text-xl text-muted-foreground">{t.t('pricing.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Starter Pack */}
            <Card className="taxsnap-card-hover relative">
              <CardHeader>
                <CardTitle className="text-lg">{t.t('pricing.freeStarter.name')}</CardTitle>
                <p className="text-muted-foreground text-sm">{t.t('pricing.freeStarter.description')}</p>
                <div className="text-2xl font-bold text-primary">{t.t('pricing.freeStarter.price')}</div>
                <p className="text-sm text-muted-foreground">{t.t('pricing.freeStarter.submissions')}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {(t.t('pricing.freeStarter.features') as unknown as string[]).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthDialog mode="register" t={t}>
                  <Button className="w-full">{t.t('pricing.freeStarter.cta')}</Button>
                </AuthDialog>
              </CardContent>
            </Card>

            {/* Small Pack */}
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <CardTitle className="text-lg">{t.t('pricing.small.name')}</CardTitle>
                <p className="text-muted-foreground text-sm">{t.t('pricing.small.description')}</p>
                <div className="text-2xl font-bold text-primary">{t.t('pricing.small.price')}</div>
                <p className="text-sm text-muted-foreground">
                  {t.t('pricing.small.submissions')} • {t.t('pricing.small.pricePerSubmission')}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {(t.t('pricing.small.features') as unknown as string[]).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthDialog mode="register" t={t}>
                  <Button variant="outline" className="w-full">{t.t('pricing.small.cta')}</Button>
                </AuthDialog>
              </CardContent>
            </Card>

            {/* Large Pack */}
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <CardTitle className="text-lg">{t.t('pricing.large.name')}</CardTitle>
                <p className="text-muted-foreground text-sm">{t.t('pricing.large.description')}</p>
                <div className="text-2xl font-bold text-primary">{t.t('pricing.large.price')}</div>
                <p className="text-sm text-muted-foreground">
                  {t.t('pricing.large.submissions')} • {t.t('pricing.large.pricePerSubmission')}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {(t.t('pricing.large.features') as unknown as string[]).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthDialog mode="register" t={t}>
                  <Button variant="outline" className="w-full">{t.t('pricing.large.cta')}</Button>
                </AuthDialog>
              </CardContent>
            </Card>

            {/* Premium Package */}
            <Card className="taxsnap-card-hover relative border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  {t.t('pricing.premium.highlight')}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{t.t('pricing.premium.name')}</CardTitle>
                <p className="text-muted-foreground text-sm">{t.t('pricing.premium.description')}</p>
                <div className="text-2xl font-bold text-primary">{t.t('pricing.premium.price')}</div>
                <p className="text-sm text-muted-foreground">{t.t('pricing.premium.submissions')}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {(t.t('pricing.premium.features') as unknown as string[]).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <AuthDialog mode="register" t={t}>
                  <Button className="w-full">{t.t('pricing.premium.cta')}</Button>
                </AuthDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">{t.t('about.title')}</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8">
              {t.t('about.description')}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">10,000+</h3>
                <p className="text-muted-foreground">{t.t('about.activeUsers')}</p>
              </div>
              <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">50,000+</h3>
                <p className="text-muted-foreground">{t.t('about.processedSubmissions')}</p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">99.9%</h3>
                <p className="text-muted-foreground">{t.t('about.uptimeGuarantee')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {t.t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}
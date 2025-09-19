"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { User, Package, Crown, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/contexts/auth-context"
import { getUserPaymentSummaryAction, getUserPaymentHistoryAction } from "@/app/actions/payment-actions"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import { toast } from "@/lib/hooks/use-toast"
import type { Locale } from "@/lib/i18n"
import type { UserPaymentSummary } from "@/lib/types/payment"

interface ProfilePageProps {
  params: Promise<{ locale: string }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const { user, getValidAccessToken, isAuthenticated, isLoading } = useAuth()
  const [t, setT] = useState<TranslationHelper | null>(null)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [paymentSummary, setPaymentSummary] = useState<UserPaymentSummary | null>(null)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active')

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}`)
    }
  }, [isAuthenticated, isLoading, router, locale])

  const loadPaymentSummary = useCallback(async () => {
    try {
      setIsLoadingPayments(true)
      setPaymentSummary(null) // Reset state
      
      const accessToken = await getValidAccessToken()
      const result = viewMode === 'active' 
        ? await getUserPaymentSummaryAction(accessToken)
        : await getUserPaymentHistoryAction(accessToken)

      if (result.error) {
        console.error('Error loading payment summary:', result.error)
        toast.error(t?.t('errors.errorLoadingPayments') || "Error loading payment summary", result.error)
        setPaymentSummary(null)
        return
      }

      setPaymentSummary(result.paymentSummary || null)
    } catch (error) {
      console.error('Error loading payment summary:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment summary'
      toast.error(t?.t('errors.errorLoadingPayments') || "Error loading payment summary", errorMessage)
      setPaymentSummary(null)
    } finally {
      setIsLoadingPayments(false)
    }
  }, [getValidAccessToken, viewMode, t])

  // Load payment summary - only when auth state or viewMode changes
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadPaymentSummary()
    }
  }, [isLoading, isAuthenticated, viewMode, loadPaymentSummary]) // Use stable callback

  const handlePurchasePack = () => {
    router.push(`/${locale}/dashboard/purchase`)
  }

  if (isLoading || !t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t?.t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        showBackButton 
        backButtonHref="/dashboard" 
        backButtonText={t.t('nav.backToDashboard')} 
      />
      
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t.t('profile.title')}</h1>
            <p className="text-muted-foreground text-lg">{t.t('profile.subtitle')}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* User Information */}
            <div className="lg:col-span-1">
              <Card className="h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span>{t.t('profile.userInfo.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t.t('profile.userInfo.email')}
                    </label>
                    <p className="font-medium break-all">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t.t('profile.userInfo.memberSince')}
                    </label>
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t.t('profile.userInfo.accountStatus')}
                    </label>
                    <div>
                      <Badge variant={user.verified ? "default" : "secondary"}>
                        {user.verified ? t.t('profile.userInfo.verified') : t.t('profile.userInfo.unverified')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <span>{t.t('profile.paymentSummary.title')}</span>
                    </div>
                    <Button onClick={handlePurchasePack} className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.t('profile.paymentSummary.purchasePack')}</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{t.t('common.loading')}</p>
                    </div>
                  ) : paymentSummary ? (
                    <div className="space-y-6">
                      {/* Subscription View Mode Selector */}
                      <div className="mb-6 flex items-center justify-between">
                        <Select value={viewMode} onValueChange={(value: 'active' | 'all') => setViewMode(value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active Subscriptions</SelectItem>
                            <SelectItem value="all">All Subscriptions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subscriptions List */}
                      {paymentSummary.activeSubscriptions.length > 0 ? (
                        <div>
                          <div className="grid gap-4">
                            {paymentSummary.activeSubscriptions.map((subscription) => (
                              <Card key={subscription.id} className={`hover:shadow-md transition-shadow ${
                                viewMode === 'all' && !subscription.isActive ? 'opacity-60 border-dashed' : ''
                              }`}>
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className={`w-4 h-4 rounded-full ${
                                        subscription.isPremium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                                      }`} />
                                      <div>
                                        <div className="font-semibold flex items-center space-x-2 text-lg">
                                          <span>{subscription.pack?.name || 'Unknown Pack'}</span>
                                          {subscription.isPremium && (
                                            <Crown className="w-5 h-5 text-yellow-500" />
                                          )}
                                          {viewMode === 'all' && !subscription.isActive && (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                              Used
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-muted-foreground mt-1">
                                          {subscription.pack?.description || 'No description available'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-primary">
                                        {subscription.submissionsRemaining}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {t.t('profile.paymentSummary.remaining')}
                                      </div>
                                      {viewMode === 'all' && subscription.submissionsUsed !== undefined && (
                                        <div className="text-xs text-muted-foreground">
                                          {subscription.submissionsUsed} used
                                        </div>
                                      )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                        €{subscription.pack?.price.toFixed(2) || '0.00'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Card className="border-dashed border-2 border-muted-foreground/25">
                          <CardContent className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full mb-4">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold mb-2">{t.t('profile.paymentSummary.noActiveSubscriptions')}</h4>
                            <p className="text-muted-foreground mb-4">
                              Get started by purchasing your first submission pack
                            </p>
                            <Button onClick={handlePurchasePack} size="lg">
                              <CreditCard className="w-4 h-4 mr-2" />
                              {t.t('profile.paymentSummary.purchaseFirstPack')}
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="border-destructive/50">
                      <CardContent className="text-center py-12">
                        <p className="text-muted-foreground mb-4">
                          {t.t('profile.paymentSummary.errorLoading')}
                        </p>
                        <Button variant="outline" onClick={loadPaymentSummary}>
                          {t.t('common.retry')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


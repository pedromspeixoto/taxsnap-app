"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Crown, ArrowRight, Package } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getPaymentAction } from "@/app/actions/payment-actions"
import { toast } from "@/lib/hooks/use-toast"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import type { PaymentResponse } from "@/lib/types/payment"

interface SuccessPageProps {
  params: Promise<{ locale: string }>
}

export default function SuccessPage({ params }: SuccessPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, getValidAccessToken, isAuthenticated, isLoading } = useAuth()
  const [t, setT] = useState<TranslationHelper | null>(null)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [isLoadingPayment, setIsLoadingPayment] = useState(true)
  const [redirectCountdown, setRedirectCountdown] = useState(10)

  // Get payment ID from URL
  const paymentId = searchParams.get('paymentId')

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

  // Redirect if not authenticated or no payment ID
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !paymentId)) {
      router.push(`/${locale}/dashboard`)
    }
  }, [isAuthenticated, isLoading, paymentId, router, locale])

  const loadPayment = useCallback(async (paymentId: string) => {
    try {
      setIsLoadingPayment(true)
      const accessToken = await getValidAccessToken()
      const result = await getPaymentAction(paymentId, accessToken)

      if (result.error || !result.payment) {
        console.error('Error loading payment:', result.error)
        toast.error(t?.t('errors.errorLoadingPayment') || "Error loading payment", result.error || 'Payment not found')
        router.push(`/${locale}/dashboard`)
        return
      }

      setPayment(result.payment)
    } catch (error) {
      console.error('Error loading payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment'
      toast.error(t?.t('errors.errorLoadingPayment') || "Error loading payment", errorMessage)
      router.push(`/${locale}/dashboard`)
    } finally {
      setIsLoadingPayment(false)
    }
  }, [getValidAccessToken, t, locale, router])

  // Load payment details
  useEffect(() => {
    if (paymentId && isAuthenticated) {
      loadPayment(paymentId)
    }
  }, [paymentId, isAuthenticated, loadPayment])

  // Countdown timer for auto redirect
  useEffect(() => {
    if (payment && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (redirectCountdown === 0) {
      router.push(`/${locale}/dashboard`)
    }
  }, [redirectCountdown, payment, router, locale])

  const handleGoToDashboard = () => {
    router.push(`/${locale}/dashboard`)
  }

  const handleGoToProfile = () => {
    router.push(`/${locale}/dashboard/profile`)
  }

  if (isLoading || isLoadingPayment || !t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t?.t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !payment) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-green-600 mb-4">
              {t.t('success.title')}
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              {t.t('success.subtitle')}
            </p>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>{t.t('success.paymentDetails')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payment.pack && (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${
                          payment.pack.isPremium ? 'bg-yellow-500' : 'bg-primary'
                        }`} />
                        <div>
                          <div className="font-semibold flex items-center space-x-2">
                            <span>{payment.pack.name}</span>
                            {payment.pack.isPremium && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.pack.submissions} {t.t('purchase.submissions')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">€{payment.amount.toFixed(2)}</div>
                        <Badge variant="default" className="text-xs">
                          {t.t('success.paid')}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {t.t('success.paymentId')}
                      </div>
                      <div className="font-mono text-sm">
                        {payment.id.slice(0, 8)}...{payment.id.slice(-8)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {t.t('success.paymentDate')}
                      </div>
                      <div className="text-sm">
                        {new Date(payment.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="font-semibold text-green-800">
                    {t.t('success.congratulations')}
                  </h3>
                  <p className="text-green-700">
                    {t.t('success.submissionsAdded').replace(
                      '{{count}}', 
                      payment.pack?.submissions.toString() || '0'
                    )}
                  </p>
                  {payment.pack?.isPremium && (
                    <div className="flex items-center justify-center space-x-2 text-yellow-700">
                      <Crown className="w-5 h-5" />
                      <span className="font-medium">
                        {t.t('success.premiumActivated')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGoToDashboard}
                size="lg"
                className="flex items-center space-x-2"
              >
                <span>{t.t('success.goToDashboard')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={handleGoToProfile}
                size="lg"
              >
                {t.t('success.viewProfile')}
              </Button>
            </div>

            {/* Auto redirect notice */}
            <div className="text-center text-sm text-muted-foreground">
              {t.t('success.autoRedirect').replace('{{seconds}}', redirectCountdown.toString())}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
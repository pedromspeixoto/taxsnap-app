"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Crown, Lock, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getPacksAction, createPaymentAction, processPaymentAction } from "@/app/actions/payment-actions"
import { toast } from "@/lib/hooks/use-toast"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import type { Pack } from "@/lib/types/payment"
import { TEST_CARD } from "@/lib/types/payment"

interface CheckoutPageProps {
  params: Promise<{ locale: string }>
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, getValidAccessToken, isAuthenticated, isLoading } = useAuth()
  const [t, setT] = useState<TranslationHelper | null>(null)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [pack, setPack] = useState<Pack | null>(null)
  const [isLoadingPack, setIsLoadingPack] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolderName: ''
  })

  // Get pack ID from URL
  const packId = searchParams.get('packId')

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

  // Redirect if not authenticated or no pack ID
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !packId)) {
      router.push(`/${locale}/dashboard/purchase`)
    }
  }, [isAuthenticated, isLoading, packId, router, locale])

  const loadPack = useCallback(async (packId: string) => {
    try {
      setIsLoadingPack(true)
      const result = await getPacksAction(true)
      
      if (result.error) {
        console.error('Error loading packs:', result.error)
        toast.error(t?.t('errors.errorLoadingPacks') || "Error loading packs", result.error)
        router.push(`/${locale}/dashboard/purchase`)
        return
      }

      const selectedPack = result.packs?.find(p => p.id === packId)
      if (selectedPack) {
        setPack(selectedPack)
      } else {
        router.push(`/${locale}/dashboard/purchase`)
      }
    } catch (error) {
      console.error('Error loading pack:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pack'
      toast.error(t?.t('errors.errorLoadingPacks') || "Error loading packs", errorMessage)
      router.push(`/${locale}/dashboard/purchase`)
    } finally {
      setIsLoadingPack(false)
    }
  }, [t, locale, router])

  // Load pack details
  useEffect(() => {
    if (packId && isAuthenticated) {
      loadPack(packId)
    }
  }, [packId, isAuthenticated, loadPack])

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setPaymentError(null)
  }

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setFormData(prev => ({ ...prev, cardNumber: formatted }))
    setPaymentError(null)
  }

  const fillTestCardDetails = () => {
    setFormData({
      cardNumber: formatCardNumber(TEST_CARD.number),
      expiryMonth: TEST_CARD.expiryMonth,
      expiryYear: TEST_CARD.expiryYear,
      cvv: TEST_CARD.cvv,
      cardHolderName: TEST_CARD.holderName
    })
    setPaymentError(null)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pack) return

    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      const accessToken = await getValidAccessToken()

      // Create payment
      const createResult = await createPaymentAction({
        packId: pack.id,
        paymentMethod: 'test_card'
      }, accessToken)

      if (createResult.error || !createResult.payment) {
        setPaymentError(createResult.error || t!.t('checkout.paymentFailed'))
        return
      }

      // Process payment
      const processResult = await processPaymentAction(
        createResult.payment.id,
        {
          paymentId: createResult.payment.id,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear,
          cvv: formData.cvv,
          cardHolderName: formData.cardHolderName
        },
        accessToken
      )

      if (processResult.error || !processResult.payment) {
        setPaymentError(processResult.error || t!.t('checkout.paymentFailed'))
        return
      }

      if (processResult.payment.status === 'COMPLETED') {
        // Success - redirect to success page
        toast.success(t!.t('checkout.paymentSuccessful') || "Payment successful!")
        router.push(`/${locale}/dashboard/purchase/success?paymentId=${processResult.payment.id}`)
      } else {
        setPaymentError(t!.t('checkout.paymentFailed'))
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : t!.t('checkout.paymentError')
      setPaymentError(errorMessage)
      toast.error(t!.t('checkout.paymentError') || "Payment failed", errorMessage)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading || isLoadingPack || !t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t?.t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !pack) {
    return null // Will redirect
  }

  const isFormValid = 
    formData.cardNumber.replace(/\s/g, '').length >= 15 &&
    formData.expiryMonth &&
    formData.expiryYear &&
    formData.cvv.length >= 3 &&
    formData.cardHolderName.trim()

  return (
    <div className="min-h-screen bg-background">
      <Navbar showBackButton backButtonHref="/dashboard/purchase" backButtonText={t?.t('common.back')} />
      
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t.t('checkout.title')}</h1>
            <p className="text-muted-foreground text-lg">{t.t('checkout.subtitle')}</p>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground mt-4">
              <Lock className="w-4 h-4" />
              <span className="text-sm">{t.t('checkout.secureCheckout')}</span>
            </div>
          </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>{t.t('checkout.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        pack.isPremium ? 'bg-yellow-500' : 'bg-primary'
                      }`} />
                      <div>
                        <div className="font-semibold flex items-center space-x-2">
                          <span>{pack.name}</span>
                          {pack.isPremium && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {pack.submissions} {t.t('purchase.submissions')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">€{pack.price.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t.t('checkout.total')}</span>
                      <span>€{pack.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.t('checkout.vatIncluded')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>{t.t('checkout.paymentDetails')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {/* Test Card Helper */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800">
                          {t.t('checkout.testMode')}
                        </h4>
                        <p className="text-sm text-blue-600 mt-1">
                          {t.t('checkout.testModeDescription')}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={fillTestCardDetails}
                        >
                          {t.t('checkout.fillTestCard')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div>
                    <Label htmlFor="cardNumber">{t.t('checkout.cardNumber')}</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      required
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="expiryMonth">{t.t('checkout.expiryMonth')}</Label>
                      <Input
                        id="expiryMonth"
                        type="text"
                        placeholder="12"
                        value={formData.expiryMonth}
                        onChange={handleInputChange('expiryMonth')}
                        maxLength={2}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryYear">{t.t('checkout.expiryYear')}</Label>
                      <Input
                        id="expiryYear"
                        type="text"
                        placeholder="2025"
                        value={formData.expiryYear}
                        onChange={handleInputChange('expiryYear')}
                        maxLength={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">{t.t('checkout.cvv')}</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleInputChange('cvv')}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <Label htmlFor="cardHolderName">{t.t('checkout.cardHolderName')}</Label>
                    <Input
                      id="cardHolderName"
                      type="text"
                      placeholder={t.t('checkout.cardHolderNamePlaceholder')}
                      value={formData.cardHolderName}
                      onChange={handleInputChange('cardHolderName')}
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-800">{paymentError}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!isFormValid || isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      t.t('checkout.processing')
                    ) : (
                      `${t.t('checkout.payNow')} €${pack.price.toFixed(2)}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, CreditCard } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getPacksAction } from "@/app/actions/payment-actions"
import { toast } from "@/lib/hooks/use-toast"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import type { Pack } from "@/lib/types/payment"

interface PurchasePageProps {
  params: Promise<{ locale: string }>
}

export default function PurchasePage({ params }: PurchasePageProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [t, setT] = useState<TranslationHelper | null>(null)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(true)
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)

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

  const loadPacks = useCallback(async () => {
    try {
      setIsLoadingPacks(true)
      const result = await getPacksAction(true) // purchase_only = true

      if (result.error) {
        console.error('Error loading packs:', result.error)
        toast.error(t?.t('errors.errorLoadingPacks') || "Error loading packs", result.error)
        setPacks([])
        return
      }

      setPacks(result.packs || [])
    } catch (error) {
      console.error('Error loading packs:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load packs'
      toast.error(t?.t('errors.errorLoadingPacks') || "Error loading packs", errorMessage)
      setPacks([])
    } finally {
      setIsLoadingPacks(false)
    }
  }, [t])

  // Load available packs
  useEffect(() => {
    loadPacks()
  }, [loadPacks])

  const handleSelectPack = (pack: Pack) => {
    setSelectedPack(pack)
  }

  const handleProceedToCheckout = () => {
    if (selectedPack) {
      router.push(`/${locale}/dashboard/purchase/checkout?packId=${selectedPack.id}`)
    }
  }

  const getPackFeatures = (pack: Pack) => {
    const baseFeatures = [
      t!.t('purchase.packFeatures.multiPlatform'),
      t!.t('purchase.packFeatures.autoCalculations'),
      t!.t('purchase.packFeatures.taxReports'),
      t!.t('purchase.packFeatures.emailSupport')
    ]

    if (pack.price >= 8) {
      baseFeatures.push(t!.t('purchase.packFeatures.bulkProcessing'))
    }

    if (pack.price >= 16) {
      baseFeatures.push(t!.t('purchase.packFeatures.prioritySupport'))
      baseFeatures.push(t!.t('purchase.packFeatures.extendedRetention'))
    }

    if (pack.isPremium) {
      baseFeatures.push(t!.t('purchase.packFeatures.manualReview'))
      baseFeatures.push(t!.t('purchase.packFeatures.consultationAccess'))
      baseFeatures.push(t!.t('purchase.packFeatures.customReporting'))
    }

    return baseFeatures
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
      <Navbar showBackButton backButtonHref="/dashboard/profile" backButtonText={t?.t('common.back')} />
      
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t.t('purchase.title')}</h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">{t.t('purchase.subtitle')}</p>
          </div>

          {isLoadingPacks ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <CreditCard className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground text-lg">{t.t('common.loading')}</p>
            </div>
          ) : packs.length > 0 ? (
            <div className="space-y-8">
              {/* Pack Selection */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map((pack) => (
                  <Card 
                    key={pack.id} 
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 relative ${
                      selectedPack?.id === pack.id 
                        ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105' 
                        : 'hover:border-primary/50'
                    } ${pack.isPremium ? 'border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-orange-50/50' : 'bg-gradient-to-br from-blue-50/30 to-purple-50/30'}`}
                    onClick={() => handleSelectPack(pack)}
                  >
                    {pack.isPremium && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl text-center">{pack.name}</CardTitle>
                      <p className="text-muted-foreground text-sm text-center">{pack.description}</p>
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-primary">€{pack.price.toFixed(2)}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pack.submissions} {t.t('purchase.submissions')}
                          {pack.submissions > 1 && (
                            <span className="block text-xs mt-1">€{(pack.price / pack.submissions).toFixed(2)} {t.t('purchase.perSubmission')}</span>
                          )}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-3 mb-6">
                        {getPackFeatures(pack).map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        variant={selectedPack?.id === pack.id ? "default" : "outline"}
                        size="lg" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectPack(pack)
                        }}
                      >
                        {selectedPack?.id === pack.id ? (
                          <div className="flex items-center space-x-2">
                            <Check className="w-4 h-4" />
                            <span>{t.t('purchase.selected')}</span>
                          </div>
                        ) : (
                          t.t('purchase.select')
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selection Summary & Checkout */}
              {selectedPack && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                        <span>{t.t('purchase.orderSummary')}</span>
                      </div>
                      <Button 
                        onClick={handleProceedToCheckout}
                        size="lg"
                        className="flex items-center space-x-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{t.t('purchase.proceedToPayment')}</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-6 h-6 rounded-full ${
                          selectedPack.isPremium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`} />
                        <div>
                          <div className="font-semibold text-lg flex items-center space-x-2">
                            <span>{selectedPack.name}</span>
                            {selectedPack.isPremium && (
                              <Crown className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {selectedPack.submissions} {t.t('purchase.submissions')} • {selectedPack.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">€{selectedPack.price.toFixed(2)}</div>
                        {selectedPack.submissions > 1 && (
                          <div className="text-sm text-muted-foreground">
                            €{(selectedPack.price / selectedPack.submissions).toFixed(2)} {t.t('purchase.perSubmission')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Selection Prompt */}
              {!selectedPack && (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full mb-4">
                        <CreditCard className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{t.t('purchase.selectPackPrompt') || 'Choose Your Pack'}</h3>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-destructive/50">
              <CardContent className="text-center py-16">
                <h3 className="font-semibold text-lg mb-2">{t.t('purchase.noPacksAvailable') || 'No Packs Available'}</h3>
                <p className="text-muted-foreground">
                  {t.t('purchase.noPacksAvailable') || 'There are no packs available for purchase at the moment.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

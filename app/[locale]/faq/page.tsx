"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

interface FAQPageProps {
  params: Promise<{ locale: string }>
}

export default function FAQPage({ params }: FAQPageProps) {
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

  if (!t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              {t.t('faq.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t.t('faq.subtitle')}
            </p>
          </div>

          {/* General Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b pb-2">
              {t.t('faq.general.title')}
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.whatIsIRSimples.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.whatIsIRSimples.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.howDoesItHelp.question')}
                </h3>
                <div className="text-muted-foreground leading-relaxed space-y-3">
                  <p>{t.t('faq.general.howDoesItHelp.answer1')}</p>
                  <p>{t.t('faq.general.howDoesItHelp.answer2')}</p>
                  <p>{t.t('faq.general.howDoesItHelp.answer3')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.whyNotBrokerReports.question')}
                </h3>
                <div className="text-muted-foreground leading-relaxed space-y-3">
                  <p>{t.t('faq.general.whyNotBrokerReports.answer1')}</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>{t.t('faq.general.whyNotBrokerReports.taxRate2to5')}</li>
                    <li>{t.t('faq.general.whyNotBrokerReports.taxRate5to8')}</li>
                    <li>{t.t('faq.general.whyNotBrokerReports.taxRateOver8')}</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.whyUseBeforeYearEnd.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.whyUseBeforeYearEnd.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.supportedBrokers.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.supportedBrokers.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.unsupportedBroker.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.unsupportedBroker.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.supportedAnnexes.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.supportedAnnexes.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.onlyCurrentYear.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.onlyCurrentYear.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.portugueseDividends.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.portugueseDividends.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.cost.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.cost.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.manualSupport.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.manualSupport.answer')}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.general.dataSecurity.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.general.dataSecurity.answer')}
                </p>
              </div>
            </div>
          </section>

          {/* T212 Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b pb-2">T212</h2>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">
                {t.t('faq.t212.exportData.question')}
              </h3>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>{t.t('faq.t212.exportData.answer1')}</p>
                <p>{t.t('faq.t212.exportData.answer2')}</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>{t.t('faq.t212.exportData.example1')}</li>
                  <li>{t.t('faq.t212.exportData.example2')}</li>
                  <li>...</li>
                </ul>
              </div>
            </div>
          </section>

          {/* DEGIRO Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold border-b pb-2">DEGIRO</h2>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {t.t('faq.degiro.exportData.question')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t.t('faq.degiro.exportData.answer1')}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium">
                  {t.t('faq.degiro.accountFile.title')}
                </h4>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>{t.t('faq.degiro.accountFile.step1')}</p>
                  <p>{t.t('faq.degiro.accountFile.step2')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium">
                  {t.t('faq.degiro.transactionsFile.title')}
                </h4>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>{t.t('faq.degiro.transactionsFile.step1')}</p>
                  <p>{t.t('faq.degiro.transactionsFile.step2')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

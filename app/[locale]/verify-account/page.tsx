"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Logo } from "@/components/ui/logo"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { resendVerificationAction } from "@/app/actions/auth-actions"
import { toast } from "@/lib/hooks/use-toast"

function VerifyAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { createPath, currentLocale } = useLocalizedNavigation()
  const [isResending, setIsResending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  useEffect(() => {
    // Get email from URL params (from registration) or from authenticated user
    const emailFromParams = searchParams.get('email')
    const email = emailFromParams || user?.email || ""
    setUserEmail(email)

    // If user is authenticated and verified, redirect to dashboard
    if (!isLoading && isAuthenticated && user?.verified) {
      router.push(createPath("dashboard"))
      return
    }

    // If no user and no email in params, redirect to home
    if (!isLoading && !isAuthenticated && !emailFromParams) {
      router.push(createPath(""))
      return
    }
  }, [user, isAuthenticated, isLoading, router, searchParams, createPath])

  const handleResendEmail = async () => {
    if (!userEmail) return
    
    setIsResending(true)

    try {
      const result = await resendVerificationAction(userEmail, currentLocale)
      
      if (result.error) {
        console.error('Failed to resend verification email:', result.error)
        toast.error(t?.t('verifyAccount.errorResending') || "Failed to resend verification email", result.error)
        return
      }
      
      setEmailSent(true)
      toast.success(t?.t('verifyAccount.emailSentSuccess') || "Verification email sent successfully!")
      // Reset the success message after 5 seconds
      setTimeout(() => setEmailSent(false), 5000)
    } catch (error) {
      console.error('Failed to resend verification email:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email'
      toast.error(t?.t('verifyAccount.errorResending') || "Failed to resend verification email", errorMessage)
    } finally {
      setIsResending(false)
    }
  }



  const handleCheckVerification = () => {
    // Refresh the page to check if user is now verified
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Main Verification Card */}
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">{t?.t('verifyAccount.title') || 'Verify Your Account'}</CardTitle>
              <CardDescription>{t?.t('verifyAccount.description') || 'Please verify your email address before proceeding to your dashboard'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Info */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{t?.t('verifyAccount.emailSentTo') || 'We sent a verification email to:'}</p>
                <Badge variant="outline" className="px-3 py-1">
                  {userEmail}
                </Badge>
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  {t?.t('verifyAccount.nextSteps') || 'Next Steps:'}
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>{t?.t('verifyAccount.checkInbox') || 'Check your email inbox'}</li>
                  <li>{t?.t('verifyAccount.clickLink') || 'Click the verification link'}</li>
                  <li>{t?.t('verifyAccount.returnRefresh') || 'Return here and refresh the page'}</li>
                </ol>
              </div>

              {/* Success Message */}
              {emailSent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">{t?.t('verifyAccount.emailSentSuccess') || 'Verification email sent successfully!'}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={handleResendEmail} disabled={isResending} variant="outline" className="w-full">
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t?.t('verifyAccount.sending') || 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {t?.t('verifyAccount.resendEmail') || 'Resend Verification Email'}
                    </>
                  )}
                </Button>

                <Button onClick={handleCheckVerification} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t?.t('verifyAccount.verifiedEmail') || "I've Verified My Email"}
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {t?.t('verifyAccount.didntReceive') || "Didn't receive the email? Check your spam folder or try resending."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">{t?.t('verifyAccount.whyVerification') || 'Why do we need verification?'}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t?.t('verifyAccount.verificationReason') || 'Email verification helps us ensure the security of your tax data and enables us to send you important updates about your submissions.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  const { currentLocale } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Logo size="lg" showText={false} className="justify-center" />
        <p className="text-muted-foreground">{t?.t('verifyAccount.loading') || 'Loading...'}</p>
      </div>
    </div>
  )
}

export default function VerifyAccount() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyAccountContent />
    </Suspense>
  )
}

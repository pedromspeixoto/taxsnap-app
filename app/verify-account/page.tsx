"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Mail, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import Navbar from "@/app/components/navbar"
import Logo from "@/app/components/ui/logo"

function VerifyAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    // Get email from URL params (from registration) or from authenticated user
    const emailFromParams = searchParams.get('email')
    const email = emailFromParams || user?.email || ""
    setUserEmail(email)

    // If user is authenticated and verified, redirect to dashboard
    if (!isLoading && isAuthenticated && user?.verified) {
      router.push("/dashboard")
      return
    }

    // If no user and no email in params, redirect to home
    if (!isLoading && !isAuthenticated && !emailFromParams) {
      router.push("/")
      return
    }
  }, [user, isAuthenticated, isLoading, router, searchParams])

  const handleResendEmail = async () => {
    if (!userEmail) return
    
    setIsResending(true)

    try {
      // TODO: Implement actual resend verification API call
      // await resendVerification(userEmail)
      
      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      setEmailSent(true)
      // Reset the success message after 5 seconds
      setTimeout(() => setEmailSent(false), 5000)
    } catch (error) {
      console.error('Failed to resend verification email:', error)
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
              <CardTitle className="text-2xl">Verify Your Account</CardTitle>
              <CardDescription>Please verify your email address before proceeding to your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Info */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">We sent a verification email to:</p>
                <Badge variant="outline" className="px-3 py-1">
                  {userEmail}
                </Badge>
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  Next Steps:
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the verification link</li>
                  <li>Return here and refresh the page</li>
                </ol>
              </div>

              {/* Success Message */}
              {emailSent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">Verification email sent successfully!</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={handleResendEmail} disabled={isResending} variant="outline" className="w-full">
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button onClick={handleCheckVerification} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I&apos;ve Verified My Email
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or try resending.
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
                  <p className="text-sm font-medium text-blue-900">Why do we need verification?</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Email verification helps us ensure the security of your tax data and enables us to send you
                    important updates about your submissions.
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

export default function VerifyAccount() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" showText={false} className="justify-center" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyAccountContent />
    </Suspense>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { loginAction, registerAction, forgotPasswordAction } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import type { TranslationHelper } from "@/lib/utils/get-translations"

interface AuthDialogProps {
  mode: "login" | "register"
  children?: React.ReactNode
  t?: TranslationHelper | null
}

export function AuthDialog({ mode, children, t }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  const { setAuthData } = useAuth()
  const { createPath, currentLocale } = useLocalizedNavigation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "register") {
        const result = await registerAction({ email, password, locale: currentLocale })
        
        if (result.error) {
          toast.error(t?.t('errors.authenticationFailed2') || "Registration failed", result.error)
          return
        }

        toast.success(t?.t('success.registrationSuccessful') || "Registration successful!", t?.t('success.checkEmailConfirmation') || "Please check your email to confirm your account.")
        router.push(createPath(`verify-account?email=${encodeURIComponent(email)}`))
      } else {
        const result = await loginAction({ email, password })
        
        if (result.error || !result.authResponse) {
          toast.error(t?.t('errors.authenticationFailed2') || "Authentication failed", result.error || 'Login failed')
          return
        }

        // Use AuthContext for state management
        const user = setAuthData(result.authResponse)

        const welcomeMessage = t?.t('success.welcomeBack')?.replace('{{email}}', user.email) || `Welcome back, ${user.email}!`
        toast.success(t?.t('success.loginSuccessful') || "Login successful!", welcomeMessage)

        // Redirect based on user verification status
        if (user.verified) {
          router.push(createPath("dashboard"))
        } else {
          router.push(createPath("verify-account"))
        }
      }

      setIsOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed"
      toast.error(t?.t('errors.authenticationFailed2') || "Authentication failed", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await forgotPasswordAction({ email, locale: currentLocale })
      
      if (result.error) {
        toast.error(t?.t('errors.general') || "Error", result.error)
        return
      }

      toast.success(
        t?.t('success.general') || "Success", 
        t?.t('auth.forgotPassword.successMessage') || "If an account exists with this email, a password reset link will be sent."
      )
      
      // Reset form, go back to login, and close dialog
      setShowForgotPassword(false)
      setEmail("")
      setIsOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process request"
      toast.error(t?.t('errors.general') || "Error", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={mode === "login" ? "outline" : "default"}>
            {mode === "login" ? (t?.t('nav.login') || "Login") : (t?.t('nav.register') || "Sign Up")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg pt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {showForgotPassword
                ? (t?.t('auth.forgotPassword.title') || "Forgot Password")
                : mode === "login" 
                  ? (t?.t('auth.login.welcomeBack') || "Welcome back") 
                  : (t?.t('auth.register.title') || "Get started")
              }
            </CardTitle>
            <CardDescription>
              {showForgotPassword
                ? (t?.t('auth.forgotPassword.description') || "We'll send you a reset link")
                : mode === "login" 
                  ? (t?.t('auth.login.subtitle') || "Sign in to your Taxsnap account") 
                  : (t?.t('auth.register.description') || "Create your Taxsnap account")
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t?.t('auth.forgotPassword.email') || "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t?.t('auth.forgotPassword.emailPlaceholder') || "Enter your email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                    ? (t?.t('auth.forgotPassword.submitting') || "Sending...") 
                    : (t?.t('auth.forgotPassword.sendResetLink') || "Send Reset Link")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => {
                    setShowForgotPassword(false)
                    setEmail("")
                  }}
                >
                  {t?.t('auth.forgotPassword.backToLogin') || "Back to Login"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t?.t('auth.login.email') || "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t?.t('auth.login.emailPlaceholder') || "Enter your email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t?.t('auth.login.password') || "Password"}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t?.t('auth.login.passwordPlaceholder') || "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {mode === "login" && (
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t?.t('auth.login.forgotPassword') || "Forgot password?"}
                    </button>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                    ? (t?.t('common.loading') || "Processing...") 
                    : mode === "login" 
                      ? (t?.t('auth.login.signIn') || "Sign In") 
                      : (t?.t('auth.register.signUp') || "Sign Up")
                  }
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

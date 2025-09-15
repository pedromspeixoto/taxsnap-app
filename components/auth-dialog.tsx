"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { apiClient } from "@/lib/api/client"
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
  const router = useRouter()
  const { setAuthData } = useAuth()
  const { createPath } = useLocalizedNavigation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "register") {
        // Make API call directly - no state management here
        await apiClient.register({ email, password })
        toast.success(t?.t('success.registrationSuccessful') || "Registration successful!", t?.t('success.checkEmailConfirmation') || "Please check your email to confirm your account.")
        router.push(createPath(`verify-account?email=${encodeURIComponent(email)}`))
      } else {
        // Make API call directly - then use AuthContext for state management
        const authResponse = await apiClient.login({ email, password })
        const user = setAuthData(authResponse)

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={mode === "login" ? "outline" : "default"}>
            {mode === "login" ? (t?.t('nav.login') || "Login") : (t?.t('nav.register') || "Sign Up")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? (t?.t('auth.login.title') || "Login") : (t?.t('auth.register.title') || "Create Account")}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? (t?.t('auth.login.description') || "Enter your credentials to access your account")
              : (t?.t('auth.register.description') || "Create a new account to get started")}
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "login" ? (t?.t('auth.login.welcomeBack') || "Welcome back") : (t?.t('auth.register.title') || "Get started")}
            </CardTitle>
            <CardDescription>
              {mode === "login" ? (t?.t('auth.login.subtitle') || "Sign in to your Taxsnap account") : (t?.t('auth.register.description') || "Create your Taxsnap account")}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (t?.t('common.loading') || "Processing...") 
                  : mode === "login" 
                    ? (t?.t('auth.login.signIn') || "Sign In") 
                    : (t?.t('auth.register.signUp') || "Sign Up")
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

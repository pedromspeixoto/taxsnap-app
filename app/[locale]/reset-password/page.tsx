"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/hooks/use-toast"
import { resetPasswordAction } from "@/app/actions/auth-actions"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [t, setT] = useState<TranslationHelper | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createPath, currentLocale } = useLocalizedNavigation()

  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token")
    if (!tokenFromUrl) {
      toast.error(
        t?.t('errors.general') || "Error",
        t?.t('auth.resetPassword.errorMessage') || "Invalid reset link"
      )
      router.push(createPath("/"))
    } else {
      setToken(tokenFromUrl)
    }
  }, [searchParams, router, createPath, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (newPassword.length < 8) {
      toast.error(
        t?.t('errors.validation') || "Validation Error",
        t?.t('auth.resetPassword.passwordTooShort') || "Password must be at least 8 characters"
      )
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        t?.t('errors.validation') || "Validation Error",
        t?.t('auth.resetPassword.passwordsDontMatch') || "Passwords don't match"
      )
      return
    }

    if (!token) {
      toast.error(
        t?.t('errors.general') || "Error",
        t?.t('auth.resetPassword.errorMessage') || "Invalid reset link"
      )
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPasswordAction({ token, newPassword })

      if (result.error) {
        toast.error(
          t?.t('errors.general') || "Error",
          t?.t('auth.resetPassword.errorMessage') || result.error
        )
        return
      }

      toast.success(
        t?.t('success.general') || "Success",
        t?.t('auth.resetPassword.successMessage') || "Your password has been reset successfully! Redirecting to login..."
      )

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push(createPath("/"))
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password"
      toast.error(
        t?.t('errors.general') || "Error",
        t?.t('auth.resetPassword.errorMessage') || errorMessage
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">IRSimples</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t?.t('auth.resetPassword.title') || "Reset Your Password"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {t?.t('auth.resetPassword.title') || "Reset Your Password"}
            </CardTitle>
            <CardDescription>
              {t?.t('auth.resetPassword.description') || "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {t?.t('auth.resetPassword.newPassword') || "New Password"}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t?.t('auth.resetPassword.newPasswordPlaceholder') || "Enter your new password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t?.t('auth.resetPassword.confirmPassword') || "Confirm Password"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t?.t('auth.resetPassword.confirmPasswordPlaceholder') || "Confirm your new password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? (t?.t('auth.resetPassword.submitting') || "Resetting...")
                  : (t?.t('auth.resetPassword.resetPassword') || "Reset Password")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push(createPath("/"))}
            className="text-sm text-primary hover:underline"
          >
            {t?.t('auth.forgotPassword.backToLogin') || "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  )
}


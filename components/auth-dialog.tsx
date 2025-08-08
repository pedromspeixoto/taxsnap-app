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

interface AuthDialogProps {
  mode: "login" | "register"
  children?: React.ReactNode
}

export function AuthDialog({ mode, children }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setAuthData } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "register") {
        // Make API call directly - no state management here
        await apiClient.register({ email, password })
        toast.success("Registration successful!", "Please check your email to confirm your account.")
        router.push(`/verify-account?email=${encodeURIComponent(email)}`)
      } else {
        // Make API call directly - then use AuthContext for state management
        const authResponse = await apiClient.login({ email, password })
        const user = setAuthData(authResponse)

        toast.success("Login successful!", `Welcome back, ${user.email}!`)

        // Redirect based on user verification status
        if (user.verified) {
          router.push("/dashboard")
        } else {
          router.push("/verify-account")
        }
      }

      setIsOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed"
      toast.error("Authentication failed", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={mode === "login" ? "outline" : "default"}>{mode === "login" ? "Login" : "Sign Up"}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Login" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Enter your credentials to access your account"
              : "Enter your email and password to create a new account"}
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{mode === "login" ? "Welcome back" : "Get started"}</CardTitle>
            <CardDescription>
              {mode === "login" ? "Sign in to your Taxsnap account" : "Create your Taxsnap account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

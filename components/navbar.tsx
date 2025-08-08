"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/lib/contexts/auth-context"
import { AuthDialog } from "@/components/auth-dialog"

interface NavbarProps {
  title?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  className?: string
}

export function Navbar({ 
  title,
  showBackButton = false,
  backButtonText = "Back to Dashboard",
  backButtonHref = "/dashboard",
  className = ""
}: NavbarProps) {
  const { user, isAuthenticated, clearAuth } = useAuth()

  const handleLogout = async () => {
    try {
      clearAuth()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className={`border-b ${className}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Logo />
          {showBackButton && (
            <Link href={backButtonHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backButtonText}
              </Button>
            </Link>
          )}
          {title && (
            <span className="text-lg font-semibold">{title}</span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <AuthDialog mode="login" />
              <AuthDialog mode="register" />
            </>
          )}
        </div>
      </div>
    </header>
  )
} 
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { CheckCircle, TrendingUp, Shield, Clock, Users, FileText } from "lucide-react"
import { AuthDialog } from "@/app/components/auth-dialog"
import { useAuth } from "@/lib/contexts/auth-context"
import Navbar from "@/app/components/navbar"
import Logo from "@/app/components/ui/logo"

export default function LandingPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, isHydrated } = useAuth()

  useEffect(() => {
    // Only redirect if hydrated, not loading, and user is authenticated
    if (isHydrated && !isLoading && isAuthenticated && user) {
      // Add a small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        const targetPath = user.verified ? "/dashboard" : "/verify-account"
        
        // Only redirect if we're not already on the target path
        if (window.location.pathname !== targetPath) {
          try {
            router.push(targetPath)
          } catch (error) {
            console.error('Router push failed:', error)
            // Fallback to window.location as last resort
            window.location.href = targetPath
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isHydrated, isAuthenticated, user, isLoading, router])

  // Show loading state while checking authentication or during hydration
  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" showText={false} className="justify-center" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading state if user is authenticated (redirect is happening)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" showText={false} className="justify-center" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            Professional Tax Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simplify Your <span className="text-primary">Tax Submissions</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Snap your trades. File your taxes. Taxsnap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthDialog mode="register">
              <Button size="lg" className="px-8">
                Get Started Free
              </Button>
            </AuthDialog>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Taxsnap?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Multi-Platform Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Support for all major investment platforms including Interactive Brokers, Trading 212, Revolut, and
                  more.
                </p>
              </CardContent>
            </Card>
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bank-level security with full compliance to tax regulations and data protection standards.
                </p>
              </CardContent>
            </Card>
            <Card className="taxsnap-card-hover">
              <CardHeader>
                <Clock className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Save Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automated processing and calculations reduce manual work from hours to minutes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Automated File Processing</h3>
                    <p className="text-muted-foreground">
                      Upload CSV/Excel files from any broker and get instant processing
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Transaction Management</h3>
                    <p className="text-muted-foreground">Review, edit, and organize all your trades in one place</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Tax Report Generation</h3>
                    <p className="text-muted-foreground">Generate compliant tax reports for your jurisdiction</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Historical Tracking</h3>
                    <p className="text-muted-foreground">Keep track of all past submissions and amendments</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Supported Platforms</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-3 rounded text-center">Interactive Brokers</div>
                <div className="bg-background p-3 rounded text-center">Trading 212</div>
                <div className="bg-background p-3 rounded text-center">Revolut</div>
                <div className="bg-background p-3 rounded text-center">DEGIRO</div>
                <div className="bg-background p-3 rounded text-center">TradeRepublic</div>
                <div className="bg-background p-3 rounded text-center">And More...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">About Taxsnap</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8">
              Taxsnap was founded by a team of tax professionals and software engineers who experienced firsthand the
              complexity of managing investment taxes across multiple platforms. Our mission is to democratize
              professional-grade tax management tools for individual investors.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">10,000+</h3>
                <p className="text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">50,000+</h3>
                <p className="text-muted-foreground">Processed Submissions</p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">99.9%</h3>
                <p className="text-muted-foreground">Uptime Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Taxsnap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

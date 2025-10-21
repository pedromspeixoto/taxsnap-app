import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { Toaster } from "sonner"
import { NuqsAdapter } from "nuqs/adapters/next/app"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IRSimples",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NuqsAdapter>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster 
              theme="dark" 
              position="top-center" 
              richColors 
              offset={20}
              toastOptions={{
                style: {
                  top: '20px',
                },
              }}
            />
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}

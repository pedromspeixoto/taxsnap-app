import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Logo from "@/app/components/ui/logo"

export default function SubmissionHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Logo />
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
} 
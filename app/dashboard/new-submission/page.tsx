"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { ChevronRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import ProgressIndicator from "@/app/components/submissions/ProgressIndicator"
import IrsFileUpload from "@/app/components/submissions/IrsFileUpload"
import { UploadedFile } from "@/lib/types"

export default function Step1BaseIRS() {
  const router = useRouter()
  const [submissionName, setSubmissionName] = useState("")
  const [irsFiles, setIrsFiles] = useState<UploadedFile[]>([])

  const handleIrsFileUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: new Date().toLocaleString(),
    }
    setIrsFiles([...irsFiles, newFile])
  }

  const removeIrsFile = (fileId: string) => {
    setIrsFiles(irsFiles.filter((f) => f.id !== fileId))
  }

  const handleNext = () => {
    if (irsFiles.length === 0) {
      alert("Please upload at least one IRS file to continue")
      return
    }
    router.push("/dashboard/new-submission/brokers")
  }

  return (
    <div className="min-h-screen bg-background">
      <SubmissionHeader isOverviewMode={false} />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={1} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Step 1: Base IRS Files</h1>
          <p className="text-muted-foreground">Upload your base IRS tax documents to get started</p>
        </div>

        {/* Submission Name */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
            <CardDescription>Give your submission a name for easy identification</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Submission Name</Label>
              <Input
                id="name"
                placeholder="e.g., 2024 Tax Year, Q1 2024 Amendment"
                value={submissionName}
                onChange={(e) => setSubmissionName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <IrsFileUpload
          files={irsFiles}
          onFileUpload={handleIrsFileUpload}
          onFileRemove={removeIrsFile}
          size="large"
        />

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
            onClick={handleNext}
            disabled={irsFiles.length === 0 || !submissionName}
          >
            Next: Broker Details
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

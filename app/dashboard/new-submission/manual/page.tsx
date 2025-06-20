"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { CheckCircle, ArrowLeft } from "lucide-react"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import ProgressIndicator from "@/app/components/submissions/ProgressIndicator"
import ManualTransactions from "@/app/components/submissions/ManualTransactions"
import { UploadedFile } from "@/lib/types"

export default function Step3Manual() {
  const router = useRouter()
  const [manualFiles, setManualFiles] = useState<UploadedFile[]>([])

    const handleManualFileUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: new Date().toLocaleString(),
    }
    setManualFiles([...manualFiles, newFile])
  }

  const removeManualFile = (fileId: string) => {
    setManualFiles(manualFiles.filter((f) => f.id !== fileId))
  }

  const handleNext = () => {
    // Manual transactions are optional, so we can proceed without files
    router.push("/dashboard/submission/preview")
  }

  const handleBack = () => {
    router.push("/dashboard/new-submission/brokers")
  }

  return (
    <div className="min-h-screen bg-background">
      <SubmissionHeader isOverviewMode={false} />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={3} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Step 3: Manual Transactions</h1>
          <p className="text-muted-foreground">Upload manual transaction files (optional) or skip to finish</p>
        </div>

        <ManualTransactions
          files={manualFiles}
          onFileUpload={handleManualFileUpload}
          onFileRemove={removeManualFile}
          size="large"
          showSkipOption={true}
          onSkip={handleNext}
        />

        {/* Navigation */}
        <div className="flex justify-between pt-4 max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back: Broker Details
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={handleNext}
          >
            Finish & Process
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { ChevronRight, ArrowLeft } from "lucide-react"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import ProgressIndicator from "@/app/components/submissions/ProgressIndicator"
import BrokerPlatforms from "@/app/components/submissions/BrokerPlatforms"
import { Platform, UploadedFile } from "@/lib/types"

export default function Step2Brokers() {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "1", name: "DEGIRO", color: "bg-emerald-200", files: [] },
  ])

  const addPlatform = (platform: Platform) => {
    setPlatforms([...platforms, platform])
  }

  const removePlatform = (platformId: string) => {
    setPlatforms(platforms.filter((p) => p.id !== platformId))
  }

  const handleFileUpload = (platformId: string, file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: new Date().toLocaleString(),
    }

    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, files: [...p.files, newFile] } : p)))
  }

  const removeFile = (platformId: string, fileId: string) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, files: p.files.filter((f) => f.id !== fileId) } : p)),
    )
  }

  const handleNext = () => {
    const platformsWithFiles = platforms.filter((p) => p.files.length > 0)
    if (platformsWithFiles.length === 0) {
      alert("Please upload at least one trade file from any broker platform")
      return
    }
    router.push("/dashboard/new-submission/manual")
  }

  const handleBack = () => {
    router.push("/dashboard/new-submission")
  }

  return (
    <div className="min-h-screen bg-background">
      <SubmissionHeader isOverviewMode={false} />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={2} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Step 2: Investment Platforms</h1>
          <p className="text-muted-foreground">Upload trade files from your investment platforms</p>
        </div>

        <BrokerPlatforms
          platforms={platforms}
          onPlatformAdd={addPlatform}
          onPlatformRemove={removePlatform}
          onFileUpload={handleFileUpload}
          onFileRemove={removeFile}
          showTitle={false}
        />

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back: Base IRS Files
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={handleNext}
          >
            Next: Manual Transactions
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
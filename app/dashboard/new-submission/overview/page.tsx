"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { FileText } from "lucide-react"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import IrsFileUpload from "@/app/components/submissions/IrsFileUpload"
import BrokerPlatforms from "@/app/components/submissions/BrokerPlatforms"
import ManualTransactions from "@/app/components/submissions/ManualTransactions"
import { UploadedFile, Platform } from "@/lib/types"

export default function SubmissionOverview() {
  const router = useRouter()
  const [submissionName, setSubmissionName] = useState("")
  const [irsFiles, setIrsFiles] = useState<UploadedFile[]>([])
  const [manualFiles, setManualFiles] = useState<UploadedFile[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "1", name: "DEGIRO", color: "bg-emerald-200", files: [] },
    { id: "2", name: "Interactive Brokers", color: "bg-purple-200", files: [] },
    { id: "3", name: "Trading 212", color: "bg-blue-200", files: [] },
  ])

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

  const handlePlatformAdd = (platform: Platform) => {
    setPlatforms([...platforms, platform])
  }

  const handlePlatformRemove = (platformId: string) => {
    setPlatforms(platforms.filter((p) => p.id !== platformId))
  }

  const handleFileUpload = (platformId: string, file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: new Date().toLocaleString(),
    }
    setPlatforms((prev) => prev.map((p) => 
      p.id === platformId ? { ...p, files: [...p.files, newFile] } : p
    ))
  }

  const handleFileRemove = (platformId: string, fileId: string) => {
    setPlatforms((prev) => prev.map((p) => 
      p.id === platformId ? { ...p, files: p.files.filter((f) => f.id !== fileId) } : p
    ))
  }

  const handleProcess = () => {
    if (irsFiles.length === 0) {
      alert("Base IRS file is required")
      return
    }

    const platformsWithFiles = platforms.filter((p) => p.files.length > 0)
    if (platformsWithFiles.length === 0 && manualFiles.length === 0) {
      alert("Please upload at least one trade file from brokers or manual transactions")
      return
    }

    // Simulate processing
    router.push("/dashboard/submission/preview")
  }

  return (
    <div className="min-h-screen bg-background">
      <SubmissionHeader isOverviewMode={true} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">New Tax Submission - Overview</h1>
          <p className="text-muted-foreground">Complete overview of your tax submission</p>
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

        {/* Base IRS Files Section */}
        <div className="mb-8">
          <IrsFileUpload
            files={irsFiles}
            onFileUpload={handleIrsFileUpload}
            onFileRemove={removeIrsFile}
            variant="card"
            size="default"
          />
        </div>

        {/* Broker Platforms Section */}
        <div className="mb-8">
          <BrokerPlatforms
            platforms={platforms}
            onPlatformAdd={handlePlatformAdd}
            onPlatformRemove={handlePlatformRemove}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            showTitle={true}
          />
        </div>

        {/* Manual Transactions Section */}
        <div className="mb-8">
          <ManualTransactions
            files={manualFiles}
            onFileUpload={handleManualFileUpload}
            onFileRemove={removeManualFile}
            variant="card"
            size="default"
          />
        </div>

        {/* Process Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="px-16 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            onClick={handleProcess}
            disabled={irsFiles.length === 0 || (!platforms.some((p) => p.files.length > 0) && manualFiles.length === 0) || !submissionName}
          >
            <FileText className="w-5 h-5 mr-3" />
            Process Submissions
          </Button>
        </div>
      </div>
    </div>
  )
} 
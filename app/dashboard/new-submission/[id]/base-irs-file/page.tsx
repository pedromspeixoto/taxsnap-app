"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import ProgressIndicator from "@/app/components/submissions/ProgressIndicator"
import IrsFileUpload from "@/app/components/submissions/IrsFileUpload"
import BrokerPlatforms from "@/app/components/submissions/BrokerPlatforms"
import { UploadedFile, Platform, SubmissionResponse } from "@/lib/types/submission"
import { formatUploadDate } from "@/lib/utils/date"
import { toast } from "@/lib/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/contexts/auth-context"

// Types for component state
interface ComponentState {
  submission: SubmissionResponse | null
  platforms: Platform[]
  irsFiles: UploadedFile[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  uploadingFiles: Record<string, boolean> // Track uploading state per platform
}

export default function Step2PlatformsAndIRS() {
  const router = useRouter()
  const { id } = useParams()
  const { withAuth, isAuthenticated, isLoading: authLoading } = useAuth()

  const [state, setState] = useState<ComponentState>({
    submission: null,
    platforms: [],
    irsFiles: [],
    isLoading: true,
    isSubmitting: false,
    error: null,
    uploadingFiles: {}
  })

  const fetchSubmission = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setState(prev => ({ 
        ...prev, 
        error: "Invalid submission ID", 
        isLoading: false 
      }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const submission = await withAuth((accessToken) => 
        apiClient.getSubmission(id, accessToken)
      )

      setState(prev => ({
        ...prev,
        submission,
        platforms: submission.platforms || [],
        isLoading: false
      }))
    } catch (error) {
      console.error('Error fetching submission:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submission'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }))
      
      toast.error("Error loading submission", errorMessage)
    }
  }, [id, withAuth])

  const addPlatform = useCallback((platform: Platform) => {
    setState(prev => ({
      ...prev,
      platforms: [...prev.platforms, platform]
    }))
  }, [])

  const removePlatform = useCallback((platformId: string) => {
    setState(prev => ({
      ...prev,
      platforms: prev.platforms.filter((p) => p.id !== platformId)
    }))
  }, [])

  const handleFileUpload = useCallback(async (platformId: string, files: File[]) => {
    // Set loading state
    setState(prev => ({
      ...prev,
      uploadingFiles: { ...prev.uploadingFiles, [platformId]: true }
    }))

    try {
      if (!id) {
        throw new Error("Missing submission ID")
      }

      await withAuth((accessToken) =>
        apiClient.uploadBrokerFiles(id as string, platformId, files, accessToken)
      )

      // Refetch submission data to get the actual uploaded files from database
      await fetchSubmission()

      // Clear loading state
      setState(prev => ({
        ...prev,
        uploadingFiles: { ...prev.uploadingFiles, [platformId]: false }
      }))

      toast.success("Files uploaded successfully", `${files.length} file${files.length !== 1 ? 's' : ''} uploaded`)
    } catch (error) {
      console.error('Error uploading broker files', error)
      toast.error("Error uploading broker files", "Please try again")
      
      // Clear loading state on error without adding files
      setState(prev => ({
        ...prev,
        uploadingFiles: { ...prev.uploadingFiles, [platformId]: false }
      }))
    }
  }, [id, withAuth, fetchSubmission])

  const removeFile = useCallback(async (platformId: string, fileId: string) => {
    try {
      await withAuth((accessToken) =>
        apiClient.deleteSubmissionFile(fileId, accessToken)
      )

      // Refetch submission data to update the UI
      await fetchSubmission()

      toast.success("File deleted successfully")
    } catch (error) {
      console.error('Error deleting file', error)
      toast.error("Error deleting file", "Please try again")
    }
  }, [withAuth, fetchSubmission])

  const handleIrsFileUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: formatUploadDate(new Date()),
    }
    setState(prev => ({ ...prev, irsFiles: [newFile] })) // Replace existing file since we only allow one
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeIrsFile = (fileId: string) => {
    setState(prev => ({ ...prev, irsFiles: [] }))
  }

  const handleNext = async () => {
    // Validation
    const platformsWithFiles = state.platforms.filter((p) => p.files.length > 0)
    if (platformsWithFiles.length === 0) {
      toast.warning("No trade files uploaded", "Please upload at least one trade file from any broker platform")
      return
    }

    try {
      setState(prev => ({ ...prev, isSubmitting: true }))
      // TODO: Save platforms and IRS file data
      router.push(`/dashboard/new-submission/${id}/review`)
    } catch (error) {
      console.error('Error proceeding to next step:', error)
      toast.error("Error proceeding", "Please try again")
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/new-submission/${id}`)
  }

  // Effects
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmission()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, fetchSubmission, router])

  // Loading state
  if (authLoading || state.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SubmissionHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading submission...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-background">
        <SubmissionHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Error Loading Submission</h2>
            <p className="text-muted-foreground mb-4">{state.error}</p>
            <div className="space-x-2">
              <Button onClick={fetchSubmission} variant="outline">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Step 1
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SubmissionHeader />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={2} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Step 2: Broker Files & IRS Document</h1>
          <p className="text-muted-foreground">
            Upload trade files from your broker platforms and optionally add your base IRS document
          </p>
          {state.submission && (
            <p className="text-sm text-muted-foreground mt-2">
              Submission: {state.submission.title}
            </p>
          )}
        </div>

        <BrokerPlatforms
          platforms={state.platforms}
          onPlatformAdd={addPlatform}
          onPlatformRemove={removePlatform}
          onFileUpload={handleFileUpload}
          onFileRemove={removeFile}
          showTitle={true}
          uploadingFiles={state.uploadingFiles}
        />

        {/* Base IRS File Section */}
        <div className="mt-8">
          <IrsFileUpload
            files={state.irsFiles}
            onFileUpload={handleIrsFileUpload}
            onFileRemove={removeIrsFile}
            size="large"
            singleFile={true}
            optional={true}
          />

          {/* Skip Option */}
          <div className="max-w-4xl mx-auto mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Base IRS file is optional - you can skip this if you don&apos;t have one
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back: Submission Name
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
            onClick={handleNext}
            disabled={
              state.platforms.filter((p) => p.files.length > 0).length === 0 ||
              state.isSubmitting
            }
          >
            {state.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next: Preview & Submit
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 
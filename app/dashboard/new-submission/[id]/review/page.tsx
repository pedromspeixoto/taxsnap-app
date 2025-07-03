"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { CheckCircle, ArrowLeft, FileText, Building2, Upload, AlertCircle, Loader2 } from "lucide-react"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import ProgressIndicator from "@/app/components/submissions/ProgressIndicator"
import { Platform, UploadedFile, SubmissionResponse, SubmissionStatus } from "@/lib/types/submission"
import { toast } from "@/lib/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/contexts/auth-context"

interface ComponentState {
  submission: SubmissionResponse | null
  isLoading: boolean
  error: string | null
}

export default function Step3Preview() {
  const router = useRouter()
  const { id } = useParams()
  const { withAuth, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [state, setState] = useState<ComponentState>({
    submission: null,
    isLoading: true,
    error: null
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

  const handleSubmit = async () => {
    if (!id || typeof id !== 'string') {
      toast.error("Invalid submission", "Submission ID is missing")
      return
    }

    setIsProcessing(true)
    
    try {
      // Step 1: Update status to PROCESSING when user clicks "Process Submission"
      await withAuth((accessToken) =>
        apiClient.updateSubmissionStatus(id, SubmissionStatus.PROCESSING, accessToken)
      )

      // Step 2: Calculate taxes with default values
      const taxResults = await withAuth((accessToken) =>
        apiClient.calculateTaxes(
          id,
          {
            p_l_analysis_year: new Date().getFullYear() - 1, // Previous year
            p_l_calculation_type: "pl_average_weighted" // pl_average_weighted or pl_detailed
          },
          accessToken
        )
      )

      // Step 3: If tax calculation succeeds, store results and update status to COMPLETE
      await withAuth((accessToken) =>
        apiClient.storeSubmissionResults(id, taxResults as Record<string, unknown>, accessToken)
      )

      await withAuth((accessToken) =>
        apiClient.updateSubmissionStatus(id, SubmissionStatus.COMPLETE, accessToken)
      )

      toast.success("Processing complete", "Your tax calculation has been completed successfully")
      
      // Navigate to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error('Error processing submission:', error)
      
      // If tax calculation fails, keep status as PROCESSING for manual review
      // (We already updated it to PROCESSING at the start)
      toast.error("Processing failed", "We'll review your submission manually. Check back later for updates.")
      
      // Still navigate to dashboard so user can see the PROCESSING status
      router.push("/dashboard")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/new-submission/${id}/base-irs-file`)
  }

  // Effects
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmission()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, fetchSubmission, router])

  const totalFiles = state.submission?.platforms?.reduce((sum: number, platform: Platform) => sum + platform.files.length, 0) || 0

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
                Back to Step 2
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!state.submission) {
    return (
      <div className="min-h-screen bg-background">
        <SubmissionHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Submission Not Found</h2>
            <p className="text-muted-foreground mb-4">The submission you&apos;re looking for doesn&apos;t exist.</p>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Step 2
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SubmissionHeader />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={3} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Step 3: Review & Submit</h1>
          <p className="text-muted-foreground">Review your submission details before processing</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Submission Name */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Submission Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Submission Name:</span>
                  <span className="text-muted-foreground">{state.submission.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Files:</span>
                  <Badge variant="secondary">{totalFiles + (state.submission.baseIrsPath ? 1 : 0)} files</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Broker Platforms */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Investment Platforms ({state.submission.platforms?.length || 0})
              </CardTitle>
              <CardDescription>
                Trade files from your broker platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.submission.platforms?.map((platform: Platform) => (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                        <span className="font-medium">{platform.name}</span>
                      </div>
                      <Badge variant="outline">{platform.files.length} files</Badge>
                    </div>
                    <div className="space-y-2">
                      {platform.files.map((file: UploadedFile) => (
                        <div key={file.id} className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                          <span className="font-medium">{file.name}</span>
                          <span className="text-muted-foreground">{file.uploadedAt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Base IRS File */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Base IRS File
              </CardTitle>
              <CardDescription>
                Optional base IRS tax document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.submission.baseIrsPath ? (
                <div className="flex items-center justify-between text-sm bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{state.submission.baseIrsPath.split('/').pop()}</span>
                  </div>
                  <span className="text-muted-foreground">Uploaded</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/50 rounded p-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>No base IRS file uploaded (optional)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="shadow-sm border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Process</h3>
                <p className="text-muted-foreground mb-4">
                  Your submission contains {totalFiles} trade files from {state.submission.platforms?.length || 0} platform(s)
                  {state.submission.baseIrsPath ? " and 1 base IRS file" : ""}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back: Upload Files
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={handleSubmit}
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Process Submission
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 
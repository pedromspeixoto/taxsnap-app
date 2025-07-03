"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import ProgressIndicator from "@/app/components/submissions/ProgressIndicator"
import { SubmissionResponse } from "@/lib/types/submission"
import { toast } from "@/lib/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/contexts/auth-context"

// Types for component state
interface ComponentState {
  submission: SubmissionResponse | null
  submissionName: string
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export default function Step1SubmissionName() {
  const router = useRouter()
  const { id } = useParams()
  const { withAuth, isAuthenticated, isLoading: authLoading } = useAuth()

  const [state, setState] = useState<ComponentState>({
    submission: null,
    submissionName: "",
    isLoading: true,
    isSubmitting: false,
    error: null
  })

  const fetchSubmission = useCallback(async () => {
    if (id === "new") {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

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
        submissionName: submission.title,
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

  // Form submission handler
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!state.submissionName.trim()) {
      toast.warning("Missing submission name", "Please enter a submission name")
      return
    }

    try {
      setState(prev => ({ ...prev, isSubmitting: true }))

      // Create submission if new only / if not new, update the submission
      if (id === "new") {
        const submission = await withAuth((accessToken) =>
          apiClient.createSubmission(state.submissionName, accessToken)
        )
        router.push(`/dashboard/new-submission/${submission.id}/base-irs-file`)
      } else {
        // Update submission title if it changed
        if (state.submission && state.submissionName !== state.submission.title) {
          await withAuth((accessToken) =>
            apiClient.updateSubmission(id as string, { title: state.submissionName }, accessToken)
          )
        }
        router.push(`/dashboard/new-submission/${id}/base-irs-file`)
      }

    } catch (error) {
      console.error('Error proceeding to next step:', error)
      toast.error("Error proceeding", "Please try again")
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const updateSubmissionName = useCallback((name: string) => {
    setState(prev => ({ ...prev, submissionName: name }))
  }, [])

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
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
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
        <ProgressIndicator currentStep={1} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Step 1: Name Your Submission</h1>
          <p className="text-muted-foreground">
            Give your submission a memorable name for easy identification
          </p>
          {state.submission && (
            <p className="text-sm text-muted-foreground mt-2">
              Editing: {state.submission.title}
            </p>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleNext}>
            {/* Submission Name */}
            <Card className="mb-8 shadow-sm">
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
                <CardDescription>Choose a name that helps you identify this submission easily</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Submission Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., 2024 Tax Year, Q1 2024 Amendment, December Trading"
                    value={state.submissionName}
                    onChange={(e) => updateSubmissionName(e.target.value)}
                    required
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    This name will help you identify your submission in your dashboard
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
                disabled={!state.submissionName.trim() || state.isSubmitting}
              >
                {state.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next: Upload Files
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

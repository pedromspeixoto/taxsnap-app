"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, FileText, CheckCircle, AlertTriangle, Building2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import ProgressIndicator from "@/components/submissions/ProgressIndicator"
import { SubmissionResponse } from "@/lib/types/submission"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { calculateTaxesAction, getSubmissionAction } from "@/app/actions/submission-actions"

// Types for component state
interface ComponentState {
  submission: SubmissionResponse | null
  isLoading: boolean
  error: string | null
}

// Submit button component
function SubmitButton({ disabled, t }: { disabled: boolean, t: TranslationHelper | null }) {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t?.t('newSubmission.processing') || 'Calculating taxes...'}
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          {t?.t('newSubmission.calculateTaxes') || 'Calculate Taxes'}
        </>
      )}
    </Button>
  )
}

export default function Step3ReviewSubmission() {
  const { id } = useParams()
  const { getValidAccessToken, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { currentLocale, createPath } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  // Form submission handler
  const handleSubmit = async (formData: FormData) => {
    try {
      const accessToken = await getValidAccessToken()
      formData.append('accessToken', accessToken)
      
      const result = await calculateTaxesAction({}, formData)
      
      if (result.error) {
        toast.error(t?.t('errors.errorCalculatingTaxes') || "Error calculating taxes", result.error)
      }

      if (result.submissionId) {
        router.push(createPath(`dashboard/submission/${result.submissionId}`))
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      
      // Check if this is an authentication error
      if (error instanceof Error && (
        error.message.includes('No access token available') ||
        error.message.includes('No refresh token available') ||
        error.message.includes('Token refresh failed')
      )) {
        // Auth system already handled the failure and redirect, don't show additional error
        return
      }
      
      // For other errors, show a generic error message
      toast.error(t?.t('errors.errorCalculatingTaxes') || "Error", t?.t('errors.failedToSubmit') || "Failed to submit. Please try again.")
    }
  }

  const [state, setState] = useState<ComponentState>({
    submission: null,
    isLoading: true,
    error: null
  })

  const fetchSubmission = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setState(prev => ({ 
        ...prev, 
        error: t?.t('errors.invalidSubmissionId') || "Invalid submission ID", 
        isLoading: false 
      }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const accessToken = await getValidAccessToken()
      const result = await getSubmissionAction(id, accessToken)

      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          error: result.error!, 
          isLoading: false 
        }))
        toast.error(t?.t('errors.errorLoadingSubmission') || "Error loading submission", result.error)
        return
      }

      setState(prev => ({
        ...prev,
        submission: result.submission || null,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error fetching submission:', error)
      
      // Check if this is an authentication error
      if (error instanceof Error && (
        error.message.includes('No access token available') ||
        error.message.includes('No refresh token available') ||
        error.message.includes('Token refresh failed')
      )) {
        // Auth system already handled the failure and redirect, don't show additional error
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submission'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }))
      
      toast.error(t?.t('errors.errorLoadingSubmission') || "Error loading submission", errorMessage)
    }
  }, [id, getValidAccessToken, t])

  const handleBack = () => {
    window.location.href = createPath(`dashboard/new-submission/${id}/brokers`)
  }

  // Effects
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmission()
    } else if (!authLoading && !isAuthenticated) {
      // Don't redirect immediately - let the auth system handle it
      // This prevents race conditions with token refresh
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          window.location.href = createPath('')
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, fetchSubmission, createPath])

  // Additional effect to handle authentication state changes during component lifecycle
  useEffect(() => {
    if (!authLoading && !isAuthenticated && state.submission) {
      // User was authenticated but now isn't - clear the state
      setState(prev => ({
        ...prev,
        submission: null,
        error: "Authentication expired. Please log in again.",
        isLoading: false
      }))
    }
  }, [authLoading, isAuthenticated, state.submission])

  // Loading state
  if (authLoading || state.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showBackButton={true} backButtonHref="/dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t?.t('common.loading') || 'Loading submission...'}</span>
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
        <Navbar showBackButton={true} backButtonHref="/dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">{t?.t('newSubmission.errorLoading') || 'Error Loading Submission'}</h2>
            <p className="text-muted-foreground mb-4">{state.error}</p>
            <div className="space-x-2">
              <Button onClick={fetchSubmission} variant="outline">
                {t?.t('newSubmission.tryAgain') || 'Try Again'}
              </Button>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t?.t('newSubmission.backUploadFiles') || 'Back to Upload Files'}
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
        <Navbar showBackButton={true} backButtonHref="/dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">{t?.t('newSubmission.errorLoading') || 'Submission Not Found'}</h2>
            <p className="text-muted-foreground mb-4">{t?.t('newSubmission.errorLoading') || 'The submission you\'re looking for doesn\'t exist.'}</p>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t?.t('newSubmission.backUploadFiles') || 'Back to Upload Files'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { submission } = state
  const platformsWithFiles = submission.platforms?.filter(p => p.files.length > 0) || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar showBackButton={true} backButtonHref="/dashboard" />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={3} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{t?.t('newSubmission.step3Title') || 'Step 3: Review & Submit'}</h1>
          <p className="text-muted-foreground">
            {t?.t('newSubmission.step3Description') || 'Review your submission details and files before calculating taxes'}
          </p>
        </div>

        <div className="max-w-full mx-auto px-4 space-y-8">
          {/* Summary Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-2">
              <h2 className="text-2xl font-bold text-gray-300">{t?.t('newSubmission.summary') || 'Summary'}</h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Submission Summary */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {t?.t('newSubmission.submissionSummary') || 'Submission Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">
                      {submission.submissionType === 'pl_average_weighted' ? 'Average Weighted P&L' : 'Detailed P&L'}
                    </div>
                    <p className="text-sm text-muted-foreground">{t?.t('newSubmission.submissionType') || 'Submission Type'}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{submission.year || 'Not specified'}</div>
                    <p className="text-sm text-muted-foreground">{t?.t('newSubmission.year') || 'Year'}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{submission.fiscalNumber || 'Not specified'}</div>
                    <p className="text-sm text-muted-foreground">{t?.t('newSubmission.fiscalNumber') || 'Fiscal Number'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Files */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  {t?.t('newSubmission.investmentPlatformsCount') || 'Investment Platforms'} ({platformsWithFiles.length})
                </CardTitle>
                <CardDescription>
                  {t?.t('newSubmission.tradeFilesDescription') || 'Trade files from your broker platforms'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformsWithFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t?.t('newSubmission.tradeFilesDescription') || 'No broker files uploaded'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {platformsWithFiles.map((platform) => (
                      <div key={platform.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${platform.color || 'bg-gray-400'}`}></div>
                            <span className="font-medium">{platform.name}</span>
                          </div>
                          <Badge variant="outline">{platform.files.length} {t?.t('newSubmission.files') || 'files'}</Badge>
                        </div>
                        <div className="space-y-2">
                          {platform.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{file.name}</span>
                              </div>
                              <span className="text-muted-foreground">{file.uploadedAt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <Card className="shadow-sm border-amber-200 bg-amber-50">
            <CardContent>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2">{t?.t('newSubmission.beforeSubmitting') || 'Before submitting:'}</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• {t?.t('newSubmission.ensureFilesComplete') || 'Ensure all trade files are complete and accurate'}</li>
                    <li>• {t?.t('newSubmission.doubleCheckDetails') || 'Double-check your submission details'}</li>
                    <li>• {t?.t('newSubmission.processMayTakeTime') || 'This process may take a few minutes to complete'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t?.t('newSubmission.backUploadFiles') || 'Back: Upload Files'}
            </Button>
            <form action={handleSubmit}>
              <input type="hidden" name="submissionId" value={id as string} />
              <SubmitButton disabled={!isAuthenticated || platformsWithFiles.length === 0} t={t} />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 
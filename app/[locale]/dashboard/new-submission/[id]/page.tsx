"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import ProgressIndicator from "@/components/submissions/ProgressIndicator"
import { SubmissionResponse } from "@/lib/types/submission"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown } from "lucide-react"

import { SubmissionWarning } from "@/components/submissions"
import { createOrUpdateSubmissionAction, getSubmissionAction } from "@/app/actions/submission-actions"

// Simple checkbox component
// Checkbox component removed - tier selection now handled by modal

// Types for component state
interface ComponentState {
  submission: SubmissionResponse | null
  isLoading: boolean
  error: string | null
}


// Submit button component that uses useFormStatus
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
          {t?.t('newSubmission.processing') || 'Processing...'}
        </>
      ) : (
        <>
          {t?.t('newSubmission.nextUploadFiles') || 'Next: Upload Files'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  )
}

export default function Step1SubmissionName() {
  const { id } = useParams()
  const { getValidAccessToken, isAuthenticated, isLoading: authLoading } = useAuth()
  const { createPath, currentLocale } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])
  const router = useRouter()
  const [state, setState] = useState<ComponentState>({
    submission: null,
    isLoading: true,
    error: null
  })

  // Form field states (controlled components)
  const [submissionName, setSubmissionName] = useState("")
  const [submissionYear, setSubmissionYear] = useState(new Date().getFullYear())
  const [submissionType, setSubmissionType] = useState("pl_average_weighted")
  const [fiscalNumber, setFiscalNumber] = useState("")
  const [isPremium, setIsPremium] = useState(false)


  // Simple form submission handler
  const handleFormSubmit = async (formData: FormData) => {
    try {
      const accessToken = await getValidAccessToken()
      formData.append('accessToken', accessToken)
      // isPremium value is now handled by hidden input fields in the form
      
      const result = await createOrUpdateSubmissionAction({}, formData)
      
      if (result.error) {
        toast.error(t?.t('errors.errorLoadingSubmission') || "Error", result.error)
      }

      if (result.submissionId) {
        router.push(`/dashboard/new-submission/${result.submissionId}/brokers`)
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      toast.error(t?.t('errors.errorLoadingSubmission') || "Error", t?.t('errors.authenticationFailed') || "Authentication failed. Please try again.")
    }
  }


  const fetchSubmission = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setState(prev => ({ 
        ...prev, 
        error: t?.t('errors.invalidSubmissionId') || "Invalid submission ID", 
        isLoading: false 
      }))
      return
    }

    // Handle new submissions - extract tier from URL params
    if (id === 'new') {
      setState(prev => ({ ...prev, isLoading: false }))
      
      // Read tier from URL parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const tierParam = urlParams.get('tier')
        if (tierParam === 'premium') {
          setIsPremium(true)
        } else if (tierParam === 'standard') {
          setIsPremium(false)
        }
      }
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
      
      // Update form fields with submission data
      if (result.submission) {
        setSubmissionName(result.submission.title)
        setSubmissionYear(result.submission.year || new Date().getFullYear())
        setSubmissionType(result.submission.submissionType || "pl_average_weighted")
        setFiscalNumber(result.submission.fiscalNumber || "")
        setIsPremium(result.submission.tier === 'PREMIUM')
      }
    } catch (error) {
      console.error('Error fetching submission:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submission'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }))
      
      toast.error(t?.t('errors.errorLoadingSubmission') || "Error loading submission", errorMessage)
    }
  // Don't include 't' to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getValidAccessToken])

  // Effects
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmission()
    } else if (!authLoading && !isAuthenticated) {
      window.location.href = '/'
    }
  }, [authLoading, isAuthenticated, fetchSubmission])

  // Loading state
  if (authLoading || state.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showBackButton={true} backButtonHref="/dashboard" />
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
        <Navbar showBackButton={true} backButtonHref="/dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">{t?.t('newSubmission.errorLoading') || 'Error Loading Submission'}</h2>
            <p className="text-muted-foreground mb-4">{state.error}</p>
            <div className="space-x-2">
              <Button onClick={fetchSubmission} variant="outline">
                {t?.t('newSubmission.tryAgain') || 'Try Again'}
              </Button>
              <Link href={createPath("dashboard")}>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t?.t('submission.backToDashboard') || 'Back to Dashboard'}
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
      <Navbar showBackButton={true} backButtonHref="/dashboard" />

      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator currentStep={1} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{t?.t('newSubmission.step1') || 'Step 1: Submission Details'}</h1>
          <p className="text-muted-foreground">
            {t?.t('newSubmission.fillDetails') || 'Fill in the details of your submission'}
          </p>
          {state.submission && (
            <p className="text-sm text-muted-foreground mt-2">
              Editing: {state.submission.title}
            </p>
          )}
        </div>
        <div className="max-w-2xl mx-auto mb-8">
          <form action={handleFormSubmit}>
            {/* Hidden fields */}
            <input type="hidden" name="submissionId" value={id as string} />
            
            {/* Submission Details */}
            <Card className="mb-8 shadow-sm">
              {/* Show selected tier (for premium submissions) */}
              {isPremium && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 border border-yellow-300">
                        <Crown className="w-4 h-4 text-yellow-600" />
                      </div>
                      <input type="hidden" name="isPremium" value="true" />
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lg">{t?.t('modal.tierSelection.premium.title') || 'Premium Submission'}</span>
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                          Premium
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      <p>{t?.t('modal.tierSelection.premium.manualReview') || 'This submission will include personalized manual review from our certified accountants.'}</p>
                      <p className="text-xs mt-1 text-yellow-700">
                        • {t?.t('modal.tierSelection.premium.priorityProcessing') || 'Priority processing'} • {t?.t('modal.tierSelection.premium.manualVerification') || 'Manual verification'} • {t?.t('modal.tierSelection.premium.expertReview') || 'Expert review'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Show selected tier (for standard submissions) */}
              {!isPremium && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300" />
                      <input type="hidden" name="isPremium" value="false" />
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lg">{t?.t('modal.tierSelection.standard.title') || 'Standard Submission'}</span>
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Standard
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      <p>{t?.t('modal.tierSelection.standard.description') || 'This submission will be processed as standard.'}</p>
                      <p className="text-xs mt-1 text-blue-700">
                        • {t?.t('modal.tierSelection.standard.automatedCalculation') || 'Automated tax calculation'} • {t?.t('modal.tierSelection.standard.fastProcessing') || 'Fast processing'} • {t?.t('modal.tierSelection.standard.reliableResults') || 'Reliable results'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {/* Divider */}
              <div className="mx-6 border-t border-gray-200 dark:border-gray-700"></div>
              
              {/* Submission Name */}
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="submissionName">{t?.t('newSubmission.name') || 'Name'}</Label>
                  <Input
                    id="submissionName"
                    name="submissionName"
                    placeholder={t?.t('newSubmission.submissionNamePlaceholder') || 'e.g., 2024 Tax Year, Q1 2024 Amendment, December Trading'}
                    value={submissionName}
                    onChange={(e) => setSubmissionName(e.target.value)}
                    required
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t?.t('newSubmission.nameHelper') || 'This name will help you identify your submission in your dashboard'}
                  </p>
                </div>
              </CardContent>
              {/* Submission Year */}
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="submissionYear">{t?.t('newSubmission.year') || 'Year'}</Label>
                  <Input
                    id="submissionYear"
                    name="submissionYear"
                    type="number"
                    placeholder="e.g., 2024"
                    value={submissionYear.toString()}
                    onChange={(e) => setSubmissionYear(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t?.t('newSubmission.referenceYear') || 'The reference year for the submission'}
                  </p>
                </div>
              </CardContent>
              {/* Submission Type */}
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="submissionType">{t?.t('newSubmission.type') || 'Type'}</Label>
                  <Select
                    value={submissionType}
                    onValueChange={setSubmissionType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a submission type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl_average_weighted">{t?.t('newSubmission.averageWeighted') || 'Average Weighted'}</SelectItem>
                      <SelectItem value="pl_detailed">{t?.t('newSubmission.detailed') || 'Detailed'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="submissionType" value={submissionType} />
                  <p className="text-sm text-muted-foreground">
                    {t?.t('newSubmission.submissionType') || 'The type of submission to be processed (Weighted or Detailed)'}
                  </p>
                </div>
              </CardContent>
              {/* Fiscal Identification Number (Optional) */}
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="fiscalNumber">{t?.t('newSubmission.fiscalIdNumber') || 'Fiscal Identification Number'}</Label>
                  <Input
                    id="fiscalNumber"
                    name="fiscalNumber"
                    placeholder="e.g., 1234567890"
                    value={fiscalNumber}
                    onChange={(e) => setFiscalNumber(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t?.t('newSubmission.fiscalIdOptional') || 'The fiscal identification number of the submission (optional)'}
                  </p>
                </div>
              </CardContent>

            </Card>

            <SubmissionWarning />

            {/* Navigation */}
            <div className="flex justify-end">
              <SubmitButton 
                disabled={!submissionName.trim() || !isAuthenticated}
                t={t}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

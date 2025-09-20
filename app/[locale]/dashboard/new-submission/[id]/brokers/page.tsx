"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import ProgressIndicator from "@/components/submissions/ProgressIndicator"
import IrsFileUpload from "@/components/submissions/IrsFileUpload"
import BrokerPlatforms from "@/components/submissions/BrokerPlatforms"
import { UploadedFile, Platform, SubmissionResponse } from "@/lib/types/submission"
import { formatUploadDate } from "@/lib/utils/date"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { 
  navigateToReviewAction, 
  uploadBrokerFilesAction, 
  deleteSubmissionFileAction,
  downloadManualLogTemplateAction,
  getSubmissionAction,
  deleteAllSubmissionFilesAction
} from "@/app/actions/submission-actions"

// Types for component state
interface ComponentState {
  submission: SubmissionResponse | null
  platforms: Platform[]
  irsFiles: UploadedFile[]
  isLoading: boolean
  error: string | null
  uploadingFiles: Record<string, boolean> // Track uploading state per platform
}

// Navigation button component
function NavigationButton({ platforms, disabled, t }: { platforms: Platform[], disabled: boolean, t: TranslationHelper | null }) {
  const { pending } = useFormStatus()
  const platformsWithFiles = platforms.filter((p) => p.files.length > 0)
  
  return (
    <Button
      type="submit"
      className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
      disabled={platformsWithFiles.length === 0 || disabled || pending}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t?.t('newSubmission.processing') || 'Processing...'}
        </>
      ) : (
        <>
          {t?.t('newSubmission.nextPreviewSubmit') || 'Next: Preview & Submit'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  )
}

export default function Step2PlatformsAndIRS() {
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

  // Navigation form handler
  const handleNavigationSubmit = async (formData: FormData) => {
    try {
      const accessToken = await getValidAccessToken()
      formData.append('accessToken', accessToken)
      
      const result = await navigateToReviewAction({}, formData)
      if (result.error) {
        toast.error(t?.t('errors.navigationError') || "Navigation Error", result.error)
      }
      
      router.push(createPath(`dashboard/new-submission/${id}/review`))
    } catch (error) {
      console.error('Error in navigation:', error)
      toast.error(t?.t('errors.navigationError') || "Navigation Error", t?.t('errors.authenticationFailed') || "Authentication failed. Please try again.")
    }
  }

  const [state, setState] = useState<ComponentState>({
    submission: null,
    platforms: [],
    irsFiles: [],
    isLoading: true,
    error: null,
    uploadingFiles: {}
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
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        platforms: [],
        irsFiles: []
      }))

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
        platforms: result.submission?.platforms || [],
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
      
      toast.error(t?.t('errors.errorLoadingSubmission') || "Error loading submission", errorMessage)
    }
  }, [id, getValidAccessToken, t])

  const refreshSubmissionData = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      return
    }

    try {
      const accessToken = await getValidAccessToken()
      const result = await getSubmissionAction(id, accessToken)

      if (result.error) {
        console.error('Error refreshing submission:', result.error)
        return
      }

      setState(prev => ({
        ...prev,
        submission: result.submission || null,
        platforms: result.submission?.platforms || [],
      }))
    } catch (error) {
      console.error('Error refreshing submission:', error)
    }
  }, [id, getValidAccessToken])

  const addPlatform = (platform: Platform) => {
    setState(prev => ({
      ...prev,
      platforms: [...prev.platforms, platform]
    }))
  }

  const handleFileUpload = async (platformId: string, files: File[]) => {
    if (!id) {
      toast.error("Missing submission ID")
      return
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      uploadingFiles: { ...prev.uploadingFiles, [platformId]: true }
    }))

    try {
      const accessToken = await getValidAccessToken()
      
      // Create FormData for server action
      const formData = new FormData()
      formData.append('submissionId', id as string)
      formData.append('platformId', platformId)
      formData.append('accessToken', accessToken)
      files.forEach(file => formData.append('files', file))

      // Call server action directly
      const result = await uploadBrokerFilesAction({}, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.message) {
        toast.success(t?.t('success.filesUploadedSuccessfully') || "Files uploaded successfully", result.message)
        // Refresh submission data to show updated files
        await refreshSubmissionData()
      }
    } catch (error) {
      console.error('Error uploading broker files', error)
      toast.error(t?.t('errors.errorUploadingFiles') || "Error uploading broker files", t?.t('errors.authenticationFailed') || "Please try again")
    } finally {
      // Clear loading state
      setState(prev => ({
        ...prev,
        uploadingFiles: { ...prev.uploadingFiles, [platformId]: false }
      }))
    }
  }

  const removeFile = async (fileId: string) => {
    if (!id) {
      toast.error(t?.t('errors.missingSubmissionId') || "Missing submission ID")
      return
    }

    try {
      const accessToken = await getValidAccessToken()
      
      // Create FormData for server action
      const formData = new FormData()
      formData.append('fileId', fileId)
      formData.append('submissionId', id as string)
      formData.append('accessToken', accessToken)

      // Call server action directly
      const result = await deleteSubmissionFileAction({}, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }

      if (result.message) {
        toast.success(t?.t('success.fileDeletedSuccessfully') || "File deleted successfully", result.message)
        // Refresh submission data to show updated files
        await refreshSubmissionData()
      }
    } catch (error) {
      console.error('Error deleting file', error)
      toast.error(t?.t('errors.errorDeletingFile') || "Error deleting file", t?.t('errors.authenticationFailed') || "Please try again")
    }
  }

  const removePlatform = async (platformId: string) => {
    // Delete all files from the platform
    const platform = state.platforms.find((p) => p.id === platformId)
    const accessToken = await getValidAccessToken()

    if (platform) {
      const formData = new FormData()
      formData.append('submissionId', id as string)
      formData.append('brokerId', platformId)
      formData.append('accessToken', accessToken)

      const result = await deleteAllSubmissionFilesAction({}, formData)
      if (result.error) {
        throw new Error(result.error)
      }
    }

    setState(prev => ({
      ...prev,
      platforms: prev.platforms.filter((p) => p.id !== platformId)
    }))
  }

  const handleTemplateDownload = async (platformId: string) => {
    if (platformId === 'manual_log') {
      try {
        const accessToken = await getValidAccessToken()
        
        // Call server action to get template URL
        const result = await downloadManualLogTemplateAction(accessToken)
        
        if (result.message) {
          // Create download link
          const link = document.createElement('a')
          link.href = result.message
          link.download = 'manual_log_template.csv'
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          
          link.click()
          
          document.body.removeChild(link)
          
          toast.success(t?.t('success.templateDownloaded') || "Template downloaded", t?.t('success.templateDownloadDescription') || "Use this template to format your manual trades")
        }
      } catch (error) {
        console.error('Error downloading template:', error)
        toast.error(t?.t('errors.errorDownloadingTemplate') || "Error downloading template", t?.t('errors.authenticationFailed') || "Please try again")
      }
    }
  }

  const handleIrsFileUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: formatUploadDate(new Date()),
    }
    setState(prev => ({ ...prev, irsFiles: [newFile] }))
  }

  const removeIrsFile = (fileId: string) => {
    console.log("Removing IRS file", fileId)
    // TODO: Remove IRS file from database
    setState(prev => ({ ...prev, irsFiles: [] }))
  }

  const handleBack = () => {
    window.location.href = createPath(`dashboard/new-submission/${id}`)
  }

  // Effects
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmission()
    } else if (!authLoading && !isAuthenticated) {
      window.location.href = createPath('')
    }
  // createPath is not a dependency of the useEffect and creates an infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated,fetchSubmission])

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
                {t?.t('newSubmission.backSubmissionName') || 'Back to Step 1'}
              </Button>
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
        <ProgressIndicator currentStep={2} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{t?.t('newSubmission.step2Title') || 'Step 2: Broker Files & IRS Document'}</h1>
          <p className="text-muted-foreground">
            {t?.t('newSubmission.step2Description') || 'Upload trade files from your broker platforms and optionally add your base IRS document'}
          </p>
          {state.submission && (
            <p className="text-sm text-muted-foreground mt-2">
              {t?.t('newSubmission.submissionLabel') || 'Submission:'} {state.submission.title}
            </p>
          )}
        </div>

        <BrokerPlatforms
          platforms={state.platforms}
          onPlatformAdd={addPlatform}
          onPlatformRemove={removePlatform}
          onFileUpload={handleFileUpload}
          onFileRemove={removeFile}
          onTemplateDownload={handleTemplateDownload}
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
              {t?.t('newSubmission.baseIrsOptional') || 'Base IRS file is optional - you can skip this if you don\'t have one'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t?.t('newSubmission.backSubmissionName') || 'Back: Submission Name'}
          </Button>
          <form action={handleNavigationSubmit}>
            <input type="hidden" name="submissionId" value={id as string} />
            <NavigationButton 
              platforms={state.platforms} 
              disabled={!isAuthenticated}
              t={t}
            />
          </form>
        </div>
      </div>
    </div>
  )
} 
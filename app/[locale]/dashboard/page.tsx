"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, Search, ChevronLeft, ChevronRight, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { SubmissionResponse, SubmissionStatus } from "@/lib/types/submission"
import { formatDate } from "@/lib/utils/date"
import { toast } from "@/lib/hooks/use-toast"
import { getSubmissionsAction } from "@/app/actions/submission-actions"
import { TierSelectionModal } from "@/components/submissions/TierSelectionModal"
import Link from "next/link"
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs"
import { Suspense } from "react"

interface DashboardState {
  submissions: SubmissionResponse[]
  isLoading: boolean
  error: string | null
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const { getValidAccessToken, isAuthenticated, isLoading: authLoading } = useAuth()
  const { createPath, currentLocale } = useLocalizedNavigation()
  const router = useRouter()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  const [{ q, status, tier, page }, setQuery] = useQueryStates({
    q: parseAsString.withDefault(""),
    status: parseAsString.withDefault("all"),
    tier: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1),
  })
  const itemsPerPage = 5

  const [state, setState] = useState<DashboardState>({
    submissions: [],
    isLoading: true,
    error: null
  })

  const fetchSubmissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const accessToken = await getValidAccessToken()
      const result = await getSubmissionsAction(accessToken)

      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          error: result.error!, 
          isLoading: false,
          submissions: [] 
        }))
        toast.error(t?.t('errors.errorLoadingSubmissions') || "Error loading submissions", result.error)
        return
      }

      setState(prev => ({
        ...prev,
        submissions: result.submissions || [],
        isLoading: false
      }))
    } catch (error) {
      console.error('Error fetching submissions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submissions'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false,
        submissions: [] 
      }))
      
      toast.error(t?.t('errors.errorLoadingSubmissions') || "Error loading submissions", errorMessage)
    }
  // Don't include 't' to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValidAccessToken])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmissions()
    }
  }, [authLoading, isAuthenticated, fetchSubmissions])

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.COMPLETE:
        return "bg-green-500"
      case SubmissionStatus.PROCESSING:
        return "bg-yellow-500"
      case SubmissionStatus.DRAFT:
        return "bg-blue-400"
      case SubmissionStatus.FAILED:
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadgeClass = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.COMPLETE:
        return "bg-green-100 text-green-800 border-green-200" 
      case SubmissionStatus.PROCESSING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"  
      case SubmissionStatus.DRAFT:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case SubmissionStatus.FAILED:
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDetailsUrl = (submission: SubmissionResponse) => {
    switch (submission.status) {
      case SubmissionStatus.DRAFT:
        return `/dashboard/new-submission/${submission.id}`
      case SubmissionStatus.COMPLETE:
      case SubmissionStatus.PROCESSING:
      case SubmissionStatus.FAILED:
        return `/dashboard/submission/${submission.id}`
      default:
        return `/dashboard/submission/${submission.id}`
    }
  }

  const getDetailsButtonText = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return t?.t('dashboard.continueEditing') || "Continue Editing"
      case SubmissionStatus.COMPLETE:
        return t?.t('dashboard.viewResults') || "View Results"
      case SubmissionStatus.PROCESSING:
        return t?.t('dashboard.viewResults') || "View Details"
      case SubmissionStatus.FAILED:
        return t?.t('dashboard.viewResults') || "View Details"
      default:
        return t?.t('dashboard.viewResults') || "View Details"
    }
  }

  const filteredSubmissions = state.submissions.filter((submission: SubmissionResponse) => {
    const matchesSearch = submission.title.toLowerCase().includes(q.toLowerCase())
    const matchesStatus = status === "all" || submission.status === status
    const matchesTier = tier === "all" || 
      (tier === "premium" && submission.tier === "PREMIUM") ||
      (tier === "standard" && submission.tier === "STANDARD")
    return matchesSearch && matchesStatus && matchesTier
  })

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const currentPage = Math.min(Math.max(page, 1), Math.max(totalPages, 1))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage)

  const handleSearchChange = (value: string) => {
    setQuery({ q: value, page: 1 })
  }

  const handleStatusChange = (value: string) => {
    setQuery({ status: value, page: 1 })
  }

  const handleTierChange = (value: string) => {
    setQuery({ tier: value, page: 1 })
  }

  const handleNewSubmission = (tier: 'PREMIUM' | 'STANDARD') => {
    // Navigate to new submission with tier parameter
    router.push(createPath(`dashboard/new-submission/new?tier=${tier.toLowerCase()}`))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t?.t('dashboard.title') || 'Dashboard'}</h1>
            <p className="text-muted-foreground">{t?.t('dashboard.subtitle') || 'Manage your tax submissions and track progress'}</p>
          </div>
          <TierSelectionModal onTierSelect={handleNewSubmission} t={t}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t?.t('dashboard.newSubmission') || 'New Submission'}
            </Button>
          </TierSelectionModal>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-2">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t?.t('dashboard.searchPlaceholder') || 'Search by name or transaction count...'}
                  value={q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t?.t('dashboard.filterByStatus') || 'Filter by status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t?.t('dashboard.allStatus') || 'All Status'}</SelectItem>
                  <SelectItem value={SubmissionStatus.COMPLETE}>{t?.t('dashboard.completed') || 'Completed'}</SelectItem>
                  <SelectItem value={SubmissionStatus.PROCESSING}>{t?.t('dashboard.processing') || 'Processing'}</SelectItem>
                  <SelectItem value={SubmissionStatus.DRAFT}>{t?.t('dashboard.draft') || 'Draft'}</SelectItem>
                  <SelectItem value={SubmissionStatus.FAILED}>{t?.t('dashboard.failed') || 'Failed'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tier} onValueChange={handleTierChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t?.t('dashboard.allTiers') || 'All Tiers'}</SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Premium
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t?.t('dashboard.taxSubmissions') || 'Tax Submissions'}</CardTitle>
                <CardDescription>
                  {state.isLoading 
                    ? (t?.t('dashboard.loadingSubmissions') || 'Loading submissions...') 
                    : (t?.t('dashboard.submissionsFound')?.replace('{{count}}', String(filteredSubmissions.length)) || `${filteredSubmissions.length} submission${filteredSubmissions.length !== 1 ? 's' : ''} found`)
                  }
                </CardDescription>
              </div>
              {filteredSubmissions.length > itemsPerPage && (
                <div className="text-sm text-muted-foreground">
                  {t?.t('dashboard.pageOfPages')
                    ?.replace('{{current}}', String(currentPage))
                    ?.replace('{{total}}', String(totalPages))
                    || `Page ${currentPage} of ${totalPages}`}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {state.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t?.t('dashboard.loadingSubmissions') || 'Loading submissions...'}</p>
              </div>
            ) : state.error ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">{t?.t('dashboard.errorLoadingSubmissionsTitle') || 'Error Loading Submissions'}</h3>
                <p className="text-muted-foreground mb-4">{state.error}</p>
                <Button onClick={fetchSubmissions} variant="outline">
                  {t?.t('dashboard.tryAgain') || 'Try Again'}
                </Button>
              </div>
            ) : paginatedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {q || status !== "all" ? (t?.t('dashboard.noSubmissions') || "No submissions found") : (t?.t('dashboard.noSubmissions') || "No submissions yet")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {q || status !== "all" || tier !== "all"
                    ? (t?.t('dashboard.adjustFilter') || "Try adjusting your search or filter criteria")
                    : (t?.t('dashboard.createFirst') || "Create your first tax submission to get started")
                  }
                </p>
                {!q && status === "all" && tier === "all" && (
                  <Link href={createPath("dashboard/new-submission/new")}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t?.t('dashboard.createFirstSubmission') || 'Create First Submission'}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(submission.status)}`}></div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{submission.title}</h3>
                          {submission.tier === 'PREMIUM' && (
                            <div title="Premium Submission">
                              <Crown className="w-4 h-4 text-yellow-500" />
                            </div>
                          )}
                        </div>
                        <Badge className={`${getStatusBadgeClass(submission.status)} border`}>
                          {submission.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(submission.createdAt)}
                        </span>
                        <Link href={getDetailsUrl(submission)}>
                          <Button variant="outline" size="sm">
                            {getDetailsButtonText(submission.status)}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t?.t('dashboard.showingResults')
                        ?.replace('{{start}}', String(startIndex + 1))
                        ?.replace('{{end}}', String(Math.min(startIndex + itemsPerPage, filteredSubmissions.length)))
                        ?.replace('{{total}}', String(filteredSubmissions.length))
                        || `Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of ${filteredSubmissions.length} submissions`}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery({ page: currentPage - 1 })}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {t?.t('dashboard.previous') || 'Previous'}
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery({ page: currentPage + 1 })}
                        disabled={currentPage === totalPages}
                      >
                        {t?.t('dashboard.next') || 'Next'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

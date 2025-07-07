"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Plus, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Navbar from "@/app/components/navbar"
import { SubmissionResponse, SubmissionStatus } from "@/lib/types/submission"
import { formatDate } from "@/lib/utils/date"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/lib/hooks/use-toast"

interface DashboardState {
  submissions: SubmissionResponse[]
  isLoading: boolean
  error: string | null
}

export default function Dashboard() {
  const { withAuth, isAuthenticated, isLoading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [state, setState] = useState<DashboardState>({
    submissions: [],
    isLoading: true,
    error: null
  })

  const fetchSubmissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const submissions = await withAuth((accessToken) => 
        apiClient.getSubmissions(accessToken)
      )

      setState(prev => ({
        ...prev,
        submissions,
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
      
      toast.error("Error loading submissions", errorMessage)
    }
  }, [withAuth])

  // Effects
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
        // Take user to wizard to continue editing
        return `/dashboard/new-submission/${submission.id}`
      case SubmissionStatus.COMPLETE:
      case SubmissionStatus.PROCESSING:
      case SubmissionStatus.FAILED:
        // Take user to submission details/results page
        return `/dashboard/submission/${submission.id}`
      default:
        return `/dashboard/submission/${submission.id}`
    }
  }

  const getDetailsButtonText = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.DRAFT:
        return "Continue Editing"
      case SubmissionStatus.COMPLETE:
        return "View Results"
      case SubmissionStatus.PROCESSING:
        return "View Details"
      case SubmissionStatus.FAILED:
        return "View Details"
      default:
        return "View Details"
    }
  }

  // Filter and search submissions
  const filteredSubmissions = state.submissions.filter((submission: SubmissionResponse) => {
    const matchesSearch = submission.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your tax submissions and track progress</p>
          </div>
          <Link href="/dashboard/new-submission/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </Button>
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-2">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or transaction count..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={SubmissionStatus.COMPLETE}>Completed</SelectItem>
                  <SelectItem value={SubmissionStatus.PROCESSING}>Processing</SelectItem>
                  <SelectItem value={SubmissionStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={SubmissionStatus.FAILED}>Failed</SelectItem>
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
                <CardTitle>Tax Submissions</CardTitle>
                <CardDescription>
                  {state.isLoading 
                    ? "Loading submissions..." 
                    : `${filteredSubmissions.length} submission${filteredSubmissions.length !== 1 ? 's' : ''} found`
                  }
                </CardDescription>
              </div>
              {filteredSubmissions.length > itemsPerPage && (
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {state.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading submissions...</p>
              </div>
            ) : state.error ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Submissions</h3>
                <p className="text-muted-foreground mb-4">{state.error}</p>
                <Button onClick={fetchSubmissions} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : paginatedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== "all" ? "No submissions found" : "No submissions yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first tax submission to get started"
                  }
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Link href="/dashboard/new-submission/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Submission
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
                        <h3 className="font-semibold">{submission.title}</h3>
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
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
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

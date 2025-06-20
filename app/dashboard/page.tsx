"use client"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Plus, FileText, LogOut, Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Logo from "@/app/components/ui/logo"

interface Submission {
  id: string
  name: string
  status: "draft" | "processing" | "completed"
  createdAt: string
  platforms: number
  transactions: number
}

export default function Dashboard() {
  const { clearAuth } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Mock data - in real app this would come from API
  const [allSubmissions] = useState<Submission[]>([
    {
      id: "1",
      name: "2023 Tax Year",
      status: "completed",
      createdAt: "2024-01-15",
      platforms: 3,
      transactions: 156,
    },
    {
      id: "2", 
      name: "Q4 2023 Amendment",
      status: "processing",
      createdAt: "2024-02-10",
      platforms: 2,
      transactions: 45,
    },
    {
      id: "3",
      name: "2022 Tax Year Final",
      status: "completed", 
      createdAt: "2024-01-05",
      platforms: 4,
      transactions: 234,
    },
    {
      id: "4",
      name: "Q1 2024 Trades",
      status: "processing",
      createdAt: "2024-03-01",
      platforms: 2,
      transactions: 78,
    },
    {
      id: "5", 
      name: "Crypto Trading 2023",
      status: "completed",
      createdAt: "2024-01-20",
      platforms: 1,
      transactions: 89,
    },
    {
      id: "6",
      name: "Stock Portfolio Rebalance",
      status: "draft",
      createdAt: "2024-03-15",
      platforms: 3,
      transactions: 12,
    },
  ])

  const handleLogout = () => {
    clearAuth()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // Filter and search submissions
  const filteredSubmissions = allSubmissions.filter(submission => {
    const matchesSearch = submission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         submission.transactions.toString().includes(searchQuery)
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
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome back!</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your tax submissions and track progress</p>
          </div>
          <Link href="/dashboard/new-submission">
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
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
                  {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
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
            {paginatedSubmissions.length === 0 ? (
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
                  <Link href="/dashboard/new-submission">
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
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(submission.status)}`} />
                        <div>
                          <h3 className="font-semibold">{submission.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {submission.platforms} platform{submission.platforms !== 1 ? 's' : ''} • {submission.transactions} transaction{submission.transactions !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={submission.status === "completed" ? "default" : "secondary"}>
                          {submission.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                        <Link href={`/dashboard/submission/${submission.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
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

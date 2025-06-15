"use client"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Plus, FileText, Calendar, TrendingUp, LogOut } from "lucide-react"
import Link from "next/link"

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
  const [submissions] = useState<Submission[]>([
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold">Taxsnap</span>
          </div>
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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">+1 from last month</p>
            </CardContent>
          </Card>
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.reduce((acc, sub) => acc + sub.transactions, 0)}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Year</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2024</div>
              <p className="text-xs text-muted-foreground">Current tax year</p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tax Submissions</CardTitle>
            <CardDescription>View and manage your tax submission history</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-4">Create your first tax submission to get started</p>
                <Link href="/dashboard/new-submission">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Submission
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(submission.status)}`} />
                      <div>
                        <h3 className="font-semibold">{submission.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {submission.platforms} platforms • {submission.transactions} transactions
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

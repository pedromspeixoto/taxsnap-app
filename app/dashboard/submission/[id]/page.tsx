"use client"

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { ArrowLeft, Download, FileText, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function SubmissionDetail() {
  const submission = {
    id: "1",
    name: "2023 Tax Year",
    status: "completed",
    createdAt: "2024-01-15",
    platforms: ["DEGIRO", "Trading 212", "Interactive Brokers"],
    totalTransactions: 156,
    totalPL: 1450,
    totalDividends: 320,
  }

  const transactions = [
    { symbol: "AAPL", buys: 10, sells: 8, pl: 320 },
    { symbol: "TSLA", buys: 5, sells: 5, pl: -50 },
    { symbol: "MSFT", buys: 12, sells: 6, pl: 1120 },
    { symbol: "GOOGL", buys: 3, sells: 2, pl: 60 },
  ]

  const dividends = [
    { country: "USA", amount: 210 },
    { country: "Germany", amount: 80 },
    { country: "Portugal", amount: 30 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold">Taxsnap</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{submission.name}</h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Created {new Date(submission.createdAt).toLocaleDateString()}
              </span>
              <Badge variant="default">{submission.status}</Badge>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submission.platforms.length}</div>
              <p className="text-xs text-muted-foreground">{submission.platforms.join(", ")}</p>
            </CardContent>
          </Card>
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submission.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total processed</p>
            </CardContent>
          </Card>
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realized P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${submission.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                €{submission.totalPL > 0 ? "+" : ""}
                {submission.totalPL}
              </div>
              <p className="text-xs text-muted-foreground">Capital gains/losses</p>
            </CardContent>
          </Card>
          <Card className="taxsnap-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dividends</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{submission.totalDividends}</div>
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Summary */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
            <CardDescription>Overview of stock transactions and P&L</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock Symbol</TableHead>
                  <TableHead>Total Buys</TableHead>
                  <TableHead>Total Sells</TableHead>
                  <TableHead>Realized P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.buys}</TableCell>
                    <TableCell>{stock.sells}</TableCell>
                    <TableCell className={stock.pl >= 0 ? "text-green-600" : "text-red-600"}>
                      €{stock.pl > 0 ? "+" : ""}
                      {stock.pl}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dividends */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Dividends by Country</CardTitle>
            <CardDescription>Total dividends received by country</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Total Dividends (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividends.map((dividend) => (
                  <TableRow key={dividend.country}>
                    <TableCell className="font-medium">{dividend.country}</TableCell>
                    <TableCell>€{dividend.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

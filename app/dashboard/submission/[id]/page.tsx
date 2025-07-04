"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { FileText, Building2, Upload, CheckCircle, AlertCircle, Download, ExternalLink } from "lucide-react"
import SubmissionHeader from "@/app/components/submissions/SubmissionHeader"
import { Platform, UploadedFile, SubmissionResponse, SubmissionStatus, SubmissionResults, StockTrade, StockSummary } from "@/lib/types/submission"
import { toast } from "@/lib/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/contexts/auth-context"
import { getCountryFlag, getCountryName } from "@/lib/utils/country"
import Image from "next/image"


interface ComponentState {
  submission: SubmissionResponse | null
  results: SubmissionResults | null
  isLoading: boolean
  error: string | null
}

export default function SubmissionDetails() {
  const router = useRouter()
  const { id } = useParams()
  const { withAuth, isAuthenticated, isLoading: authLoading } = useAuth()

  const [state, setState] = useState<ComponentState>({
    submission: null,
    results: null,
    isLoading: true,
    error: null
  })

  const fetchSubmissionDetails = useCallback(async () => {
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

      if (!submission) {
        setState(prev => ({ 
          ...prev, 
          error: "Submission not found", 
          isLoading: false 
        }))
        return
      }

      // Fetch results if submission is complete
      let results: SubmissionResults | null = null
      if (submission.status === SubmissionStatus.COMPLETE) {
        try {
          const storedResults = await withAuth((accessToken) => 
            apiClient.getSubmissionResults(id, accessToken)
          )
          results = storedResults as unknown as SubmissionResults
        } catch (error) {
          console.error('Error fetching submission results:', error)
          // Use fallback mock data for completed submissions if results fetch fails
          results = {
            status: "success",
            error_message: "",
            stock_pl_trades: [],
            year_dividends_by_country: [],
            total_stocks_pl: 0,
            total_stocks_aquisition_amount: 0,
            total_stocks_realized_amount: 0,
            total_stocks_trade_expenses_amount: 0,
            total_dividends_gross_amount: 0,
            total_dividends_taxes_amount: 0,
            stocks_pl_file_details_url: "",
            dividends_file_details_url: "",
            irs_tax_report_annex_j_url: "",
            irs_tax_report_full_report_url: ""
          }
        }
      }

      setState(prev => ({
        ...prev,
        submission,
        results,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error fetching submission details:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load submission details'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }))
      
      toast.error("Error loading submission", errorMessage)
    }
  }, [id, withAuth])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSubmissionDetails()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, fetchSubmissionDetails, router])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }



    const processStockSummary = (trades: StockTrade[]): StockSummary[] => {
    const stockMap = new Map<string, StockSummary>()
    
    trades.forEach(trade => {
      const existing = stockMap.get(trade.ticker)
      const pl = trade.realized_amount - trade.buy_amount - trade.trade_expenses
      
      if (existing) {
        existing.totalBuys += 1
        existing.totalSells += 1
        existing.realizedPL += pl
      } else {
        stockMap.set(trade.ticker, {
          ticker: trade.ticker,
          totalBuys: 1,
          totalSells: 1,
          realizedPL: pl
        })
      }
    })
    
    return Array.from(stockMap.values()).sort((a, b) => b.realizedPL - a.realizedPL)
  }

  const totalFiles = state.submission?.platforms?.reduce((sum: number, platform: Platform) => sum + platform.files.length, 0) || 0

  // Loading state
  if (authLoading || state.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SubmissionHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Loading submission details...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error || !state.submission) {
    return (
      <div className="min-h-screen bg-background">
        <SubmissionHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Submission</h2>
            <p className="text-muted-foreground mb-4">{state.error || "Submission not found"}</p>
            <div className="space-x-2">
              <Button onClick={fetchSubmissionDetails} variant="outline">
                Try Again
              </Button>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(state.submission.status)}`}></div>
            <h1 className="text-3xl font-bold">{state.submission.title}</h1>
          </div>
          
          <p className="text-muted-foreground">
            {state.submission.status === SubmissionStatus.COMPLETE && "Tax calculation completed successfully"}
            {state.submission.status === SubmissionStatus.PROCESSING && "Tax calculation in progress"}
            {state.submission.status === SubmissionStatus.DRAFT && "Submission in draft mode"}
            {state.submission.status === SubmissionStatus.FAILED && "Tax calculation failed - under manual review"}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">

          {/* Summary Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-300">Summary</h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Submission Summary */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Submission Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{state.submission.platforms?.length || 0}</div>
                    <p className="text-sm text-muted-foreground">Platforms</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{totalFiles}</div>
                    <p className="text-sm text-muted-foreground">Trade Files</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{state.submission.baseIrsPath ? '1' : '0'}</div>
                    <p className="text-sm text-muted-foreground">IRS Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Files */}
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
                {!state.submission.platforms || state.submission.platforms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No broker files uploaded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.submission.platforms.map((platform: Platform) => (
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

            {/* Base IRS File - Only show if it exists */}
            {state.submission.baseIrsPath && (
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
                  <div className="flex items-center justify-between text-sm bg-green-50 border border-green-200 rounded p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{state.submission.baseIrsPath.split('/').pop()}</span>
                    </div>
                    <span className="text-muted-foreground">Uploaded</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section - Only show for completed submissions */}
          {state.submission.status === SubmissionStatus.COMPLETE && state.results && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-300">Results</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              {/* Tax Summary */}
              <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-white">
                     <CheckCircle className="w-5 h-5 text-green-600" />
                        Tax Calculation Results
                     </CardTitle>
                   <CardDescription className="text-gray-300">
                     Summary of your tax calculations
                   </CardDescription>
                 </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(state.results.total_stocks_pl)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">Total Stocks P&L</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(state.results.total_dividends_gross_amount)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">Total Dividends (Gross)</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(state.results.total_dividends_taxes_amount)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">Dividend Taxes</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(state.results.total_stocks_aquisition_amount)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">Total Acquisition</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(state.results.total_stocks_realized_amount)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">Total Realized</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(state.results.total_stocks_trade_expenses_amount)}
                      </div>
                      <p className="text-sm font-medium text-gray-700">Trade Expenses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Summary Table */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Stock Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of stock transactions and P&L
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.results.stock_pl_trades && state.results.stock_pl_trades.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-gray-300">Stock Symbol</th>
                            <th className="text-right p-3 font-medium text-gray-300">Total Buys</th>
                            <th className="text-right p-3 font-medium text-gray-300">Total Sells</th>
                            <th className="text-right p-3 font-medium text-gray-300">Realized P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {processStockSummary(state.results.stock_pl_trades).map((stock, index) => (
                            <tr key={stock.ticker} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="p-3 font-medium text-gray-900">{stock.ticker}</td>
                              <td className="p-3 text-right text-gray-900">{stock.totalBuys}</td>
                              <td className="p-3 text-right text-gray-900">{stock.totalSells}</td>
                              <td className={`p-3 text-right font-medium ${stock.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stock.realizedPL)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No stock transactions found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dividends by Country Table */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-600" />
                    Dividends by Country
                  </CardTitle>
                  <CardDescription>
                    Total dividends received by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.results.year_dividends_by_country && state.results.year_dividends_by_country.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-gray-300">Country</th>
                            <th className="text-right p-3 font-medium text-gray-300">Total Dividends (€)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.results.year_dividends_by_country.map((dividend, index) => (
                            <tr key={dividend.dividend_country_code} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Image 
                                    src={getCountryFlag(dividend.dividend_country_code)} 
                                    alt={`${getCountryName(dividend.dividend_country_code)} flag`}
                                    className="w-5 h-4 object-cover rounded"
                                    width={20}
                                    height={16}
                                    onError={() => {
                                      // Handle image loading error
                                      console.log('Failed to load flag image');
                                    }}
                                  />
                                  <span className="font-medium text-gray-900">{getCountryName(dividend.dividend_country_code)}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right font-medium text-gray-900">
                                {formatCurrency(dividend.total_dividends)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No dividend data found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Download Reports */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    Download Reports
                  </CardTitle>
                  <CardDescription>
                    Generated tax reports and documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.results.irs_tax_report_annex_j_url && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">IRS Tax Report (Annex J)</span>
                        </div>
                        <a 
                          href={state.results.irs_tax_report_annex_j_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    )}
                    {state.results.irs_tax_report_full_report_url && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Full Tax Report</span>
                        </div>
                        <a 
                          href={state.results.irs_tax_report_full_report_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    )}
                    {state.results.stocks_pl_file_details_url && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Stocks P&L Details</span>
                        </div>
                        <a 
                          href={state.results.stocks_pl_file_details_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    )}
                    {state.results.dividends_file_details_url && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Dividends Details</span>
                        </div>
                        <a 
                          href={state.results.dividends_file_details_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Processing Status */}
          {state.submission.status === SubmissionStatus.PROCESSING && (
            <Card className="shadow-sm border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2 text-yellow-700">Processing Your Submission</h3>
                  <p className="text-muted-foreground mb-4">
                    Your tax calculation is currently being processed. This may take a few minutes.
                  </p>
                  <Button onClick={fetchSubmissionDetails} variant="outline">
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed Status */}
          {state.submission.status === SubmissionStatus.FAILED && (
            <Card className="shadow-sm border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-red-700">Processing Failed</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an issue processing your submission. Our team has been notified and will review it manually.
                  </p>
                  <Button onClick={fetchSubmissionDetails} variant="outline">
                    Check for Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}



        </div>
      </div>
    </div>
  )
}

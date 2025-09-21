"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Building2, Upload, CheckCircle, AlertCircle, Download, ExternalLink, ChevronDown, ChevronRight, Crown } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Platform, UploadedFile, SubmissionResponse, SubmissionStatus, SubmissionResults, StockTrade } from "@/lib/types/submission"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { getCountryFlag, getCountryName } from "@/lib/utils/country"
import Image from "next/image"
import { SubmissionWarning } from "@/components/submissions"
import { TaxFieldInfo } from "@/components/submissions"
import { 
  getSubmissionWithResultsAction, 
  getSubmissionResultsAction 
} from "@/app/actions/submission-actions"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"


interface ComponentState {
  submission: SubmissionResponse | null
  results: SubmissionResults | null
  isLoading: boolean
  error: string | null
}

interface GroupedStockTrades {
  ticker: string
  trades: StockTrade[]
  totalTrades: number
  totalPL: number
}

export default function SubmissionDetails() {
  const router = useRouter()
  const { id } = useParams()
  const { getValidAccessToken, isAuthenticated, isLoading: authLoading } = useAuth()
  const { currentLocale } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  const [state, setState] = useState<ComponentState>({
    submission: null,
    results: null,
    isLoading: true,
    error: null
  })

  const [expandedTickers, setExpandedTickers] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['results'])) // Summary collapsed by default
  const [stockSummaryPage, setStockSummaryPage] = useState(1)
  const [dividendsPage, setDividendsPage] = useState(1)
  
  const STOCKS_PER_PAGE = 6 // Number of stock tickers per page
  const DIVIDENDS_PER_PAGE = 4 // Number of dividend countries per page

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const fetchSubmissionDetails = useCallback(async () => {
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
      const submissionResult = await getSubmissionWithResultsAction(id, accessToken)

      if (submissionResult.error) {
        setState(prev => ({ 
          ...prev, 
          error: submissionResult.error!, 
          isLoading: false 
        }))
        toast.error(t?.t('errors.errorLoadingSubmission') || "Error loading submission", submissionResult.error)
        return
      }

      if (!submissionResult.submission) {
        setState(prev => ({ 
          ...prev, 
          error: t?.t('errors.submissionNotFound') || "Submission not found", 
          isLoading: false 
        }))
        return
      }

      // Fetch results if submission is complete
      let results: SubmissionResults | null = null
      if (submissionResult.submission.status === SubmissionStatus.COMPLETE) {
        const resultsResult = await getSubmissionResultsAction(id, accessToken)
        
        if (resultsResult.error) {
          console.error('Error fetching submission results:', resultsResult.error)
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
        } else {
          results = resultsResult.results || null
        }
      }

      setState(prev => ({
        ...prev,
        submission: submissionResult.submission || null,
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
      
      toast.error(t?.t('errors.errorLoadingSubmission') || "Error loading submission", errorMessage)
    }
  // Don't include 't' to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getValidAccessToken]) // Don't include 't' to avoid infinite loops

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

  const groupTradesByTicker = (trades: StockTrade[]): GroupedStockTrades[] => {
    const grouped = trades.reduce((acc, trade) => {
      if (!acc[trade.ticker]) {
        acc[trade.ticker] = []
      }
      acc[trade.ticker].push(trade)
      return acc
    }, {} as Record<string, StockTrade[]>)

    return Object.entries(grouped).map(([ticker, trades]) => {
      const totalPL = trades.reduce((sum, trade) => 
        sum + (trade.realized_amount - trade.buy_amount - trade.trade_expenses), 0
      )
      
      return {
        ticker,
        trades: trades.sort((a, b) => {
          // Sort by realized date (most recent first)
          const dateA = new Date(a.realized_year, a.realized_month - 1, a.realized_day)
          const dateB = new Date(b.realized_year, b.realized_month - 1, b.realized_day)
          return dateB.getTime() - dateA.getTime()
        }),
        totalTrades: trades.length,
        totalPL
      }
    }).sort((a, b) => b.totalPL - a.totalPL) // Sort by total P&L descending
  }

  const formatDate = (day: number, month: number, year: number): string => {
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    })
  }

  const toggleTicker = (ticker: string) => {
    setExpandedTickers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ticker)) {
        newSet.delete(ticker)
      } else {
        newSet.add(ticker)
      }
      return newSet
    })
  }

  // Loading state
  if (authLoading || state.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          showBackButton={true} 
          backButtonHref="/dashboard" 
        />
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
        <Navbar 
          showBackButton={true} 
          backButtonHref="/dashboard" 
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Submission</h2>
            <p className="text-muted-foreground mb-4">{state.error || (t?.t('errors.submissionNotFound') || "Submission not found")}</p>
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
      <Navbar 
        showBackButton={true} 
        backButtonHref="/dashboard" 
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(state.submission.status)}`}></div>
            <h1 className="text-3xl font-bold">{state.submission.title}</h1>
            {state.submission.tier === 'PREMIUM' && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 px-3 py-1 rounded-full">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Premium Submission</span>
              </div>
            )}
          </div>
          
          <p className="text-muted-foreground">
            {state.submission.status === SubmissionStatus.COMPLETE && (t?.t('submission.calculationCompleted') || "Tax calculation completed successfully")}
            {state.submission.status === SubmissionStatus.PROCESSING && "Tax calculation in progress"}
            {state.submission.status === SubmissionStatus.DRAFT && "Submission in draft mode"}
            {state.submission.status === SubmissionStatus.FAILED && "Tax calculation failed - under manual review"}
            {state.submission.tier === 'PREMIUM' && (
              <span className="block mt-1 text-yellow-600">
                {t?.t('submission.premiumDescription') || 'This submission includes personalized manual review from certified accountants.'}
              </span>
            )}
          </p>
        </div>

        <div className="max-w-full mx-auto px-4 space-y-8">

          {/* Summary Section */}
          <div className="space-y-6">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => toggleSection('summary')}
            >
              {expandedSections.has('summary') ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              <h2 className="text-2xl font-bold text-gray-300">{t?.t('submission.summary') || 'Summary'}</h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Summary Content */}
            {expandedSections.has('summary') && (
              <div className="space-y-6">
                {/* Submission Summary */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {t?.t('newSubmission.submissionSummary') || 'Submission Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{state.submission.submissionType === "pl_average_weighted" && "Average Weighted P&L"}</div>
                        <p className="text-sm text-muted-foreground">Submission Type</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{state.submission.year}</div>
                        <p className="text-sm text-muted-foreground">Year</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{state.submission.fiscalNumber}</div>
                        <p className="text-sm text-muted-foreground">Fiscal Number</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Files */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-600" />
                      {t?.t('newSubmission.investmentPlatforms') || 'Investment Platforms'} ({state.submission.platforms?.length || 0})
                    </CardTitle>
                    <CardDescription>
                      {t?.t('newSubmission.tradeFiles') || 'Trade files from your broker platforms'}
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
            )}
          </div>

          {/* Results Section - Only show for completed submissions */}
          {state.submission.status === SubmissionStatus.COMPLETE && state.results && (
            <div className="space-y-6">
              <div 
                className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => toggleSection('results')}
              >
                {expandedSections.has('results') ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <h2 className="text-2xl font-bold text-gray-300">{t?.t('submission.results') || 'Results'}</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              {/* Results Content */}
              {expandedSections.has('results') && (
                <div className="space-y-6">
                  {/* Tax Summary */}
                  <Card className="shadow-sm">
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2 text-white">
                         <CheckCircle className="w-5 h-5 text-green-600" />
                         {t?.t('submission.taxCalculationResults') || 'Tax Calculation Results'}
                       </CardTitle>
                       <CardDescription>
                         {t?.t('submission.summaryOfCalculations') || 'Summary of your tax calculations'}
                       </CardDescription>
                     </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(state.results.total_stocks_pl)}
                            </div>
                            <TaxFieldInfo fieldType="total_stocks_pl" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{t?.t('submission.totalStocksPL') || 'Total Stocks P&L'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(state.results.total_dividends_gross_amount)}
                            </div>
                            <TaxFieldInfo fieldType="total_dividends_gross" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{t?.t('submission.totalDividends') || 'Total Dividends (Gross)'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl font-bold text-red-600">
                              {formatCurrency(state.results.total_dividends_taxes_amount)}
                            </div>
                            <TaxFieldInfo fieldType="dividend_taxes" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{t?.t('submission.dividendTaxes') || 'Dividend Taxes'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(state.results.total_stocks_aquisition_amount)}
                            </div>
                            <TaxFieldInfo fieldType="total_acquisition" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{t?.t('submission.totalAcquisition') || 'Total Acquisition'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(state.results.total_stocks_realized_amount)}
                            </div>
                            <TaxFieldInfo fieldType="total_realized" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{t?.t('submission.totalRealized') || 'Total Realized'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(state.results.total_stocks_trade_expenses_amount)}
                            </div>
                            <TaxFieldInfo fieldType="trade_expenses" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{t?.t('submission.tradeExpenses') || 'Trade Expenses'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Two Column Layout for Stock Summary and Dividends */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Stock Summary Table */}
                    <Card className="shadow-sm flex flex-col h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          {t?.t('submission.stockSummary') || 'Stock Summary'}
                        </CardTitle>
                        <CardDescription>
                          {t?.t('submission.stockOverview') || 'Overview of stock transactions and P&L'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        {state.results.stock_pl_trades && state.results.stock_pl_trades.length > 0 ? (
                          <div className="flex flex-col space-y-4 flex-1">
                            <div className="space-y-2">
                              {(() => {
                                const groupedTrades = groupTradesByTicker(state.results.stock_pl_trades)
                                const startIndex = (stockSummaryPage - 1) * STOCKS_PER_PAGE
                                const endIndex = startIndex + STOCKS_PER_PAGE
                                const paginatedTrades = groupedTrades.slice(startIndex, endIndex)
                                
                                return (
                                  <>
                                    {paginatedTrades.map((stockGroup) => {
                                      const isExpanded = expandedTickers.has(stockGroup.ticker)
                                      
                                      return (
                                        <div key={stockGroup.ticker} className="border border-gray-200 rounded-lg overflow-hidden">
                                          {/* Ticker Header Row */}
                                          <div 
                                            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleTicker(stockGroup.ticker)}
                                          >
                                            <div className="flex items-center gap-3">
                                              {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                              ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-500" />
                                              )}
                                              <span className="font-bold text-lg text-gray-900">{stockGroup.ticker}</span>
                                              <Badge variant="secondary">{stockGroup.totalTrades} trades</Badge>
                                            </div>
                                            <div className="text-right">
                                              <div className={`text-lg font-bold ${stockGroup.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(stockGroup.totalPL)}
                                              </div>
                                              <div className="text-sm text-gray-500">Total P&L</div>
                                            </div>
                                          </div>

                                          {/* Expanded Trade Details */}
                                          {isExpanded && (
                                            <div className="bg-white">
                                              <div className="overflow-x-auto">
                                                <table className="w-full">
                                                  <thead className="bg-gray-50 border-t">
                                                    <tr>
                                                      <th className="text-left p-3 text-sm font-medium text-gray-700">Buy Date</th>
                                                      <th className="text-right p-3 text-sm font-medium text-gray-700">Buy Amount</th>
                                                      <th className="text-left p-3 text-sm font-medium text-gray-700">Sell Date</th>
                                                      <th className="text-right p-3 text-sm font-medium text-gray-700">Sell Amount</th>
                                                      <th className="text-right p-3 text-sm font-medium text-gray-700">Expenses</th>
                                                      <th className="text-right p-3 text-sm font-medium text-gray-700">P&L</th>
                                                      <th className="text-center p-3 text-sm font-medium text-gray-700">Country</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {stockGroup.trades.map((trade, tradeIndex) => {
                                                      const tradePL = trade.realized_amount - trade.buy_amount - trade.trade_expenses
                                                      
                                                      return (
                                                        <tr key={tradeIndex} className={tradeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                          <td className="p-3 text-sm text-gray-900">
                                                            {formatDate(trade.buy_day, trade.buy_month, trade.buy_year)}
                                                          </td>
                                                          <td className="p-3 text-sm text-right text-gray-900">
                                                            {formatCurrency(trade.buy_amount)}
                                                          </td>
                                                          <td className="p-3 text-sm text-gray-900">
                                                            {formatDate(trade.realized_day, trade.realized_month, trade.realized_year)}
                                                          </td>
                                                          <td className="p-3 text-sm text-right text-gray-900">
                                                            {formatCurrency(trade.realized_amount)}
                                                          </td>
                                                          <td className="p-3 text-sm text-right text-gray-900">
                                                            {formatCurrency(trade.trade_expenses)}
                                                          </td>
                                                          <td className={`p-3 text-sm text-right font-medium ${tradePL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatCurrency(tradePL)}
                                                          </td>
                                                          <td className="p-3 text-sm text-center">
                                                            <Image 
                                                              src={getCountryFlag(trade.country_id)} 
                                                              alt={`${getCountryName(trade.country_id)} flag`}
                                                              className="w-5 h-3 mx-auto rounded"
                                                              width={20}
                                                              height={16}
                                                              onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                              }}
                                                            />
                                                          </td>
                                                        </tr>
                                                      )
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </>
                                )
                              })()}
                            </div>
                            
                            {/* Stock Summary Pagination */}
                            {(() => {
                              const groupedTrades = groupTradesByTicker(state.results?.stock_pl_trades || [])
                              const totalPages = Math.ceil(groupedTrades.length / STOCKS_PER_PAGE)
                              
                              return totalPages > 1 ? (
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-700">
                                    Page {stockSummaryPage} of {totalPages}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setStockSummaryPage(prev => Math.max(1, prev - 1))}
                                      disabled={stockSummaryPage === 1}
                                    >
                                      Previous
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setStockSummaryPage(prev => Math.min(totalPages, prev + 1))}
                                      disabled={stockSummaryPage === totalPages}
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No stock transactions found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Right Column: Dividends and Download Reports */}
                    <div className="flex flex-col space-y-6 h-full">
                      {/* Dividends by Country Table */}
                      <Card className="shadow-sm flex-1 flex flex-col">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-green-600" />
                            {t?.t('submission.dividendsByCountry') || 'Dividends by Country'}
                          </CardTitle>
                          <CardDescription>
                            {t?.t('submission.totalDividendsByCountry') || 'Total dividends received by country'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          {state.results.year_dividends_by_country && state.results.year_dividends_by_country.length > 0 ? (
                            <div className="flex flex-col space-y-4 flex-1">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left p-3 font-medium text-gray-300">Country</th>
                                      <th className="text-right p-3 font-medium text-gray-300">Total Dividends (€)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const startIndex = (dividendsPage - 1) * DIVIDENDS_PER_PAGE
                                      const endIndex = startIndex + DIVIDENDS_PER_PAGE
                                      const paginatedDividends = state.results.year_dividends_by_country.slice(startIndex, endIndex)
                                      
                                      return paginatedDividends.map((dividend, index) => (
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
                                      ))
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Dividends Pagination */}
                              {(() => {
                                const totalPages = Math.ceil((state.results?.year_dividends_by_country?.length || 0) / DIVIDENDS_PER_PAGE)
                                
                                if (totalPages > 1) {
                                  return (
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm text-gray-700">
                                        Page {dividendsPage} of {totalPages}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setDividendsPage(prev => Math.max(1, prev - 1))}
                                          disabled={dividendsPage === 1}
                                        >
                                          Previous
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setDividendsPage(prev => Math.min(totalPages, prev + 1))}
                                          disabled={dividendsPage === totalPages}
                                        >
                                          Next
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })()}
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
                            {t?.t('submission.downloadReports') || 'Download Reports'}
                          </CardTitle>
                          <CardDescription>
                            {t?.t('submission.generatedReports') || 'Generated tax reports and documents'}
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
                  </div>
                  <SubmissionWarning />
                </div>
              )}
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

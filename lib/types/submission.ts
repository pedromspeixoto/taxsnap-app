export interface UploadedFile {
  id: string
  name: string
  uploadedAt: string
}
  
export interface Platform {
  id: string
  name: string
  color: string
  files: UploadedFile[]
} 
  
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

export enum SubmissionTier {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM'
}

export interface Submission {
  id: string
  userId: string
  status: SubmissionStatus
  tier: SubmissionTier
  title: string
  baseIrsPath?: string
  submissionType?: string
  fiscalNumber?: string
  year?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubmissionRequest {
  userId: string
  userPackId?: string
  title: string
  tier?: SubmissionTier
  baseIrsPath?: string
  submissionType?: string
  fiscalNumber?: string
  year?: number
}

export interface UpdateSubmissionRequest {
  title?: string
  status?: SubmissionStatus
  baseIrsPath?: string
}

export interface SubmissionFile {
  id: string
  brokerName: string
  fileType: string
  filePath: string
  createdAt: Date
}

export interface SubmissionResponse {
  id: string
  userId?: string
  status: SubmissionStatus
  tier: SubmissionTier
  title: string
  baseIrsPath?: string
  submissionType?: string
  fiscalNumber?: string
  year?: number
  createdAt: Date
  updatedAt: Date
  files?: SubmissionFile[]
  platforms?: Platform[]
}

export interface SubmissionUpdate {
  title?: string
  status?: SubmissionStatus
  baseIrsPath?: string
  updatedAt?: Date
}

export interface GetSubmissionsQuery {
  userId?: string
  status?: SubmissionStatus
  limit?: number
  offset?: number
}

export interface StockTrade {
  ticker: string
  buy_day: number
  buy_year: number
  buy_month: number
  buy_amount: number
  country_id: string
  realized_day: number
  realized_year: number
  realized_month: number
  trade_expenses: number
  realized_amount: number
}

export interface DividendsByCountry {
  total_tax_paid: number
  total_dividends: number
  dividend_country_code: string
  dividend_tax_revenue_code: string
}

export interface StockSummary {
  ticker: string
  totalBuys: number
  totalSells: number
  realizedPL: number
}

export interface SubmissionResults {
  status: string
  error_message: string
  stock_pl_trades: StockTrade[]
  year_dividends_by_country: DividendsByCountry[]
  total_stocks_pl: number
  total_stocks_aquisition_amount: number
  total_stocks_realized_amount: number
  total_stocks_trade_expenses_amount: number
  total_dividends_gross_amount: number
  total_dividends_taxes_amount: number
  stocks_pl_file_details_url: string
  dividends_file_details_url: string
  irs_tax_report_annex_j_url: string
  irs_tax_report_full_report_url: string
}
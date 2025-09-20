'use server'

import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api/client'
import { SubmissionResponse, SubmissionResults } from '@/lib/types/submission'
import { Broker } from '@/lib/types/broker'
import { submissionService } from '@/lib/services/submission-service'

// Action state types
export interface ActionState {
  submissionId?: string
  error?: string
  success?: boolean
  message?: string
}

// Get submission action state
export interface GetSubmissionActionState extends ActionState {
  submission?: SubmissionResponse
}

// Get submission results action state  
export interface GetSubmissionResultsActionState extends ActionState {
  results?: SubmissionResults
}

// Get submissions list action state
export interface GetSubmissionsActionState extends ActionState {
  submissions?: SubmissionResponse[]
}

export interface GetBrokersActionState extends ActionState {
  brokers?: Broker[]
}

// Get submission by ID
export async function getSubmissionAction(
  submissionId: string,
  accessToken: string
): Promise<GetSubmissionActionState> {
  try {
    if (!submissionId || submissionId === 'new') {
      return { submission: undefined }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const submission = await apiClient.getSubmission(submissionId, accessToken)

    return { 
      success: true, 
      submission 
    }
  } catch (error) {
    console.error('[ACTION] getSubmissionAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to load submission' 
    }
  }
}

// Get submission with results for details view
export async function getSubmissionWithResultsAction(
  submissionId: string,
  accessToken: string
): Promise<GetSubmissionActionState> {
  try {
    if (!submissionId) {
      return { error: 'Invalid submission ID' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const submission = await apiClient.getSubmission(submissionId, accessToken)

    return { 
      success: true, 
      submission 
    }
  } catch (error) {
    console.error('[ACTION] getSubmissionWithResultsAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to load submission details' 
    }
  }
}

// Get submission results
export async function getSubmissionResultsAction(
  submissionId: string,
  accessToken: string
): Promise<GetSubmissionResultsActionState> {
  try {
    if (!submissionId) {
      return { error: 'Invalid submission ID' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const results = await apiClient.getSubmissionResults(submissionId, accessToken)

    return { 
      success: true, 
      results: results as unknown as SubmissionResults
    }
  } catch (error) {
    console.error('[ACTION] getSubmissionResultsAction:', error)
    // Return fallback mock data for completed submissions if results fetch fails
    return {
      success: true,
      results: {
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
}

// Get all submissions for dashboard
export async function getSubmissionsAction(
  accessToken: string
): Promise<GetSubmissionsActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const submissions = await apiClient.getSubmissions(accessToken)

    return { 
      success: true, 
      submissions 
    }
  } catch (error) {
    console.error('[ACTION] getSubmissionsAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to load submissions' 
    }
  }
}

// Step 1: Create or update submission
export async function createOrUpdateSubmissionAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try { 
    const submissionName = formData.get('submissionName') as string
    const submissionYear = Number(formData.get('submissionYear')) 
    const submissionType = formData.get('submissionType') as string
    const fiscalNumber = formData.get('fiscalNumber') as string
    const submissionId = formData.get('submissionId') as string
    const accessToken = formData.get('accessToken') as string
    const isPremium = formData.get('isPremium') === 'true'

    // Validation
    if (!submissionName.trim()) {
      return { error: 'Submission name is required' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    if (submissionId === 'new') {
      // Create new submission
      const submission = await apiClient.createSubmission(
        submissionName,
        submissionType,
        fiscalNumber || '123456789',
        submissionYear,
        isPremium,
        accessToken
      )
      
      revalidatePath('/dashboard')
      return {
        success: true,
        submissionId: submission.id
      }
    } else {
      // Update existing submission
      await apiClient.updateSubmission(
        submissionId,
        { title: submissionName },
        accessToken
      )
      
      revalidatePath('/dashboard')
      return {
        success: true,
        submissionId: submissionId
      }
    }
  } catch (error) {
    console.error('[ACTION] createOrUpdateSubmissionAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to process submission' 
    }
  }
}

// Step 2: Upload broker files
export async function uploadBrokerFilesAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const submissionId = formData.get('submissionId') as string
    const platformId = formData.get('platformId') as string
    const accessToken = formData.get('accessToken') as string
    const files = formData.getAll('files') as File[]

    if (!submissionId || !platformId || files.length === 0) {
      return { error: 'Missing required fields' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    // Call service directly to avoid re-encoding files through our API route
    await submissionService.uploadBrokerFiles(submissionId, platformId, files)

    revalidatePath(`/dashboard/new-submission/${submissionId}/brokers`)
    
    return { 
      success: true, 
      message: `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully` 
    }
  } catch (error) {
    console.error('[ACTION] uploadBrokerFilesAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to upload files' 
    }
  }
}

// Step 2: Delete submission file
export async function deleteSubmissionFileAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const fileId = formData.get('fileId') as string
    const submissionId = formData.get('submissionId') as string
    const accessToken = formData.get('accessToken') as string

    if (!fileId || !submissionId) {
      return { error: 'Missing required fields' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    await apiClient.deleteSubmissionFile(submissionId, fileId, accessToken)

    revalidatePath(`/dashboard/new-submission/${submissionId}/brokers`)
    
    return { 
      success: true, 
      message: 'File deleted successfully' 
    }
  } catch (error) {
    console.error('[ACTION] deleteSubmissionFileAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to delete file' 
    }
  }
}

// Step 2: Delete all submission files for a broker
export async function deleteAllSubmissionFilesAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const submissionId = formData.get('submissionId') as string
    const brokerId = formData.get('brokerId') as string
    const accessToken = formData.get('accessToken') as string

    if (!submissionId || !brokerId) {
      return { error: 'Missing required fields' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    await apiClient.deleteAllSubmissionFiles(submissionId, brokerId, accessToken)

    revalidatePath(`/dashboard/new-submission/${submissionId}/brokers`)

    return { 
      success: true, 
      message: 'All files deleted successfully' 
    }
  } catch (error) {
    console.error('[ACTION] deleteAllSubmissionFilesAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to delete all files' 
    }
  }
}

// Step 2: Navigate to next step
export async function navigateToReviewAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const submissionId = formData.get('submissionId') as string
    
    if (!submissionId) {
      return { error: 'Missing submission ID' }
    }

    return {
      success: true,
      submissionId: submissionId
    }
  } catch (error) {
    console.error('[ACTION] navigateToReviewAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to navigate' 
    }
  }
}

// Step 3: Calculate taxes and submit
export async function calculateTaxesAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const submissionId = formData.get('submissionId') as string
    const accessToken = formData.get('accessToken') as string

    if (!submissionId) {
      return { error: 'Missing submission ID' }
    }

    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    await apiClient.calculateTaxes(submissionId, accessToken)

    revalidatePath('/dashboard')
    return {
      success: true,
      submissionId: submissionId
    }
  } catch (error) {
    console.error('[ACTION] calculateTaxesAction:', error)

    revalidatePath('/dashboard')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate taxes'
    }
  }
}

// Helper action to get manual log template
export async function downloadManualLogTemplateAction(
  accessToken: string
): Promise<ActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }
    
    const response = await apiClient.getManualLogTemplate(accessToken)
    
    return { 
      success: true, 
      message: response.template_path || 'https://storage.googleapis.com/taxsnap-public-data/templates/manual_log_template.csv'
    }
  } catch (error) {
    console.error('[ACTION] downloadManualLogTemplateAction:', error)
    return { 
      success: true, 
      message: 'https://storage.googleapis.com/taxsnap-public-data/templates/manual_log_template.csv' 
    }
  }
}

// Get available brokers
export async function getBrokersAction(
  accessToken: string
): Promise<GetBrokersActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const response = await apiClient.getBrokers(accessToken)

    return { 
      success: true, 
      brokers: response.brokers
    }

  } catch (error) {
    console.error('[ACTION] getBrokersAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to fetch brokers'
    }
  }
} 
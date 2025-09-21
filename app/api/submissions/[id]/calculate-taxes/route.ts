import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest, forbidden, conflict } from '@/lib/api/utils';
import { SubmissionStatus } from '@/lib/types/submission';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id: submissionId } = await params;

    console.log('Calculate taxes request:', { submissionId });

    if (!submissionId) {
      return badRequest('Missing required fields');
    }

    // Get submission from database
    const submission = await submissionService.getSubmission(submissionId);

    if (!submission) {
      return badRequest('Submission not found');
    }

    // Check if user has access to submission
    if (submission.userId !== user.userId) {
      return forbidden('User does not have access to submission');
    }

    // Check if submission is already processing
    if (submission.status === SubmissionStatus.PROCESSING) {
      return conflict('Submission is already processing');
    }

    const result = await submissionService.calculateTaxes({
      user_id: submissionId,
      nif: submission.fiscalNumber,
      p_l_analysis_year: submission.year,
      p_l_calculation_type: submission.submissionType as "pl_average_weighted" | "pl_detailed",
    });

    return ok(result);
  } catch (error) {
    console.error('[API] POST /submissions/[id]/calculate-taxes', error);
    return handleError(error);
  }
} 
import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest, notFound } from '@/lib/api/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: submissionId } = await params;

    // Check if submission exists and user owns it
    const existingSubmission = await submissionService.getSubmission(submissionId);
    if (!existingSubmission || existingSubmission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    const results = await submissionService.getSubmissionResults(submissionId);
    return ok(results);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: submissionId } = await params;
    const { results } = await request.json();

    if (!submissionId || !results) {
      return badRequest('Missing required fields');
    }

    // Check if submission exists and user owns it
    const existingSubmission = await submissionService.getSubmission(submissionId);
    if (!existingSubmission || existingSubmission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    await submissionService.storeSubmissionResults(submissionId, results);
    return ok({ message: 'Results stored successfully' });
  } catch (error) {
    return handleError(error);
  }
} 
import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest, notFound } from '@/lib/api/utils';
import { SubmissionStatus } from '@/lib/types/submission';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: submissionId } = await params;
    const { status } = await request.json();

    if (!submissionId || !status) {
      return badRequest('Missing required fields');
    }

    // Validate status
    if (!Object.values(SubmissionStatus).includes(status)) {
      return badRequest('Invalid status value');
    }

    // Check if submission exists and user owns it
    const existingSubmission = await submissionService.getSubmission(submissionId);
    if (!existingSubmission || existingSubmission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    await submissionService.updateSubmissionStatus(submissionId, status);
    return ok({ message: 'Status updated successfully' });
  } catch (error) {
    return handleError(error);
  }
} 
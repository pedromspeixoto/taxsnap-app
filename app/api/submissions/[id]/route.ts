import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, notFound, badRequest } from '@/lib/api/utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;

    const submission = await submissionService.getSubmission(id);
    
    if (!submission) {
      return notFound('Submission not found');
    }

    // Verify ownership
    if (submission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    return ok(submission);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest,{ params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const { title } = await request.json();

    if (!title?.trim()) {
      return badRequest('Title is required');
    }

    // Check if submission exists and user owns it
    const existingSubmission = await submissionService.getSubmission(id);
    if (!existingSubmission || existingSubmission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    const updatedSubmission = await submissionService.updateSubmission(id, { title });
    return ok(updatedSubmission);
  } catch (error) {
    return handleError(error);
  }
}
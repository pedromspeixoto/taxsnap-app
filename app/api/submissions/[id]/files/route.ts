import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, notFound, badRequest } from '@/lib/api/utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    
    // parse the body
    const body = await request.json();
    const brokerId = body.broker_id;

    if (!brokerId) {
      return badRequest('Broker ID is required');
    }

    if (!id) {
      return badRequest('Submission ID is required');
    }

    const submission = await submissionService.getSubmission(id);
    if (!submission || submission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    await submissionService.deleteAllSubmissionFiles(id, brokerId);
    return ok({ message: 'All files deleted successfully' });
  } catch (error) {
    console.error('[API] DELETE /submissions/[id]/files/[id]:', error);
    return handleError(error);
  }
} 
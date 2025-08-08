import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, notFound } from '@/lib/api/utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, fileId: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: submissionId, fileId: fileId } = await params;

    if (!submissionId || !fileId) {
      return notFound('File ID is required');
    }

    const submission = await submissionService.getSubmission(submissionId);
    if (!submission || submission.userId !== user.userId) {
      return notFound('Submission not found');
    }

    await submissionService.deleteSubmissionFile(fileId);
    return ok({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('[API] DELETE /submissions/[id]/files/[id]:', error);
    return handleError(error);
  }
} 
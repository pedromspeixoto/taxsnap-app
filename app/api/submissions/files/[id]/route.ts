import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, notFound } from '@/lib/api/utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);
    const { id: fileId } = await params;

    if (!fileId) {
      return notFound('File ID is required');
    }

    await submissionService.deleteSubmissionFile(fileId);
    return ok({ message: 'File deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
} 
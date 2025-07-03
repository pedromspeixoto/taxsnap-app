import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    
    const submissions = await submissionService.getSubmissions(user.userId);
    return ok(submissions);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { title } = await request.json();

    if (!title?.trim()) {
      return Response.json({ message: 'Title is required' }, { status: 400 });
    }

    const submission = await submissionService.createSubmission({
      userId: user.userId,
      title: title.trim(),
    });

    return ok(submission);
  } catch (error) {
    return handleError(error);
  }
} 
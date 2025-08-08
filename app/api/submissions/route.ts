import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest } from '@/lib/api/utils';

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
    const { title, submissionType, fiscalNumber, year } = await request.json();

    if (!title?.trim()) {
      return badRequest('Title is required');
    }

    if (!submissionType?.trim()) {
      return badRequest('Submission type is required');
    }

    if (!fiscalNumber?.trim()) {
      return badRequest('Fiscal number is required');
    }

    if (!year) {
      return badRequest('Year is required');
    }

    // Validate year is a number
    if (isNaN(year)) {
      return badRequest('Year must be a number');
    }

    // Validate year is a valid year
    if (year < 2020) {
      return badRequest('Year must be greater than 2020');
    }

    const submission = await submissionService.createSubmission({
      userId: user.userId,
      title: title.trim(),
      submissionType,
      fiscalNumber,
      year,
    });

    return ok(submission);
  } catch (error) {
    return handleError(error);
  }
} 
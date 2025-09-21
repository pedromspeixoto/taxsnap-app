import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const brokers = await submissionService.getBrokers();
    return ok(brokers);
  } catch (error) {
    console.error('Error fetching brokers', error);
    return handleError(error);
  }
} 
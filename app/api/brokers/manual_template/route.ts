import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const template = await submissionService.getManualLogTemplate();
    return ok(template);
  } catch (error) {
    console.error('[API] GET /brokers/manual_template', error);
    return handleError(error);
  }
} 
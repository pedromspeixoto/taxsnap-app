import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest } from '@/lib/api/utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { nif, p_l_analysis_year, p_l_calculation_type } = await request.json();
    const { id: submissionId } = await params;

    console.log('Calculate taxes request:', { submissionId, nif, p_l_analysis_year, p_l_calculation_type });

    if (!submissionId || p_l_analysis_year === undefined || !p_l_calculation_type) {
      return badRequest('Missing required fields');
    }

    // Validate p_l_calculation_type enum
    if (p_l_calculation_type !== "pl_average_weighted" && p_l_calculation_type !== "pl_detailed") {
      return badRequest('Invalid p_l_calculation_type. Must be "pl_average_weighted" or "pl_detailed"');
    }

    const result = await submissionService.calculateTaxes({
      user_id: submissionId,
      // hardcode nif for now
      nif: "123456789",
      p_l_analysis_year,
      p_l_calculation_type,
    });

    return ok(result);
  } catch (error) {
    console.error('Error calculating taxes', error);
    return handleError(error);
  }
} 
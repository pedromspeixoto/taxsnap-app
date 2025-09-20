import { NextRequest } from 'next/server';
import { requireAuth, ok, handleError } from '@/lib/api/utils';
import { paymentService } from '@/lib/services/payment-service';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const paymentHistory = await paymentService.getUserPaymentHistory(user.userId);
    return ok(paymentHistory);
  } catch (error) {
    return handleError(error);
  }
}

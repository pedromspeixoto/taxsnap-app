import { NextRequest } from 'next/server';
import { requireAuth, notFound, ok, handleError } from '@/lib/api/utils';
import { paymentService } from '@/lib/services/payment-service';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    requireAuth(request); // Ensure user is authenticated
    const { paymentId } = await params;

    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      return notFound('Payment not found');
    }

    return ok(payment);
  } catch (error) {
    return handleError(error);
  }
}

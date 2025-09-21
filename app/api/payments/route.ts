import { NextRequest } from 'next/server';
import { requireAuth, badRequest, created, handleError } from '@/lib/api/utils';
import { paymentService } from '@/lib/services/payment-service';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { packId, paymentMethod } = await request.json();

    if (!packId?.trim()) {
      return badRequest('Pack ID is required');
    }

    if (!paymentMethod?.trim()) {
      return badRequest('Payment method is required');
    }

    const payment = await paymentService.createPayment(user.userId, {
      packId: packId.trim(),
      paymentMethod: paymentMethod.trim(),
    });

    return created(payment);
  } catch (error) {
    return handleError(error);
  }
}

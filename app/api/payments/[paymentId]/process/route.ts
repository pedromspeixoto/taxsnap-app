import { NextRequest } from 'next/server';
import { requireAuth, badRequest, ok, handleError } from '@/lib/api/utils';
import { paymentService } from '@/lib/services/payment-service';

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    requireAuth(request); // Ensure user is authenticated
    const { paymentId } = await params;
    const { cardNumber, expiryMonth, expiryYear, cvv, cardHolderName } = await request.json();

    // Validate required fields
    if (!cardNumber?.trim()) {
      return badRequest('Card number is required');
    }

    if (!expiryMonth?.trim()) {
      return badRequest('Expiry month is required');
    }

    if (!expiryYear?.trim()) {
      return badRequest('Expiry year is required');
    }

    if (!cvv?.trim()) {
      return badRequest('CVV is required');
    }

    if (!cardHolderName?.trim()) {
      return badRequest('Card holder name is required');
    }

    const processedPayment = await paymentService.processPayment({
      paymentId,
      cardNumber: cardNumber.trim(),
      expiryMonth: expiryMonth.trim(),
      expiryYear: expiryYear.trim(),
      cvv: cvv.trim(),
      cardHolderName: cardHolderName.trim(),
    });

    return ok(processedPayment);
  } catch (error) {
    return handleError(error);
  }
}

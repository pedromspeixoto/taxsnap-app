import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api/utils';
import { paymentService } from '@/lib/services/payment-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const purchaseOnly = searchParams.get('purchase_only') === 'true';
    
    const packs = purchaseOnly 
      ? await paymentService.getPacksForPurchase()
      : await paymentService.getAllPacks();

    return ok(packs);
  } catch (error) {
    return handleError(error);
  }
}

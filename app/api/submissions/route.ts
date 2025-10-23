import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest, forbidden } from '@/lib/api/utils';
import { paymentService } from '@/lib/services/payment-service';
import { SubmissionTier } from '@/lib/types/submission';
import { notifyProductEvent } from '@/lib/slack';

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
    const { title, submissionType, fiscalNumber, year, isPremium } = await request.json();

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

    // Check if user can create a submission (payment logic)
    const submissionCapability = await paymentService.canUserCreateSubmission(user.userId);
    if (!submissionCapability.canCreate) {
      return forbidden('No available submissions remaining. Please purchase a pack to continue.');
    }

    // Validate premium request
    const requestedPremium = isPremium === true || isPremium === 'true';
    if (requestedPremium && submissionCapability.tier !== 'PREMIUM') {
      return forbidden('Premium processing requested but no premium subscriptions available.');
    }

    // Determine final tier based on user choice and availability
    const finalTier = requestedPremium ? SubmissionTier.PREMIUM : SubmissionTier.STANDARD;

    // Get the appropriate subscription for the requested tier
    const targetSubscription = await paymentService.getNextAvailableSubscription(
      user.userId, 
      requestedPremium
    );
    
    if (!targetSubscription) {
      return forbidden(`No ${requestedPremium ? 'premium' : 'standard'} subscriptions available.`);
    }

    const submission = await submissionService.createSubmission({
      userId: user.userId,
      userPackId: targetSubscription.id, // Link to the UserPack that provided this submission
      title: title.trim(),
      submissionType,
      fiscalNumber,
      year,
      tier: finalTier,
    });

    // Consume a submission from the appropriate subscription
    await paymentService.consumeSubmissionFromSubscription(user.userId, targetSubscription.id);

    notifyProductEvent({
      event: 'Submission Created',
      userId: user.userId,
      metadata: {
        submissionId: submission.id,
        status: submission.status,
      },
    })

    return ok(submission);
  } catch (error) {
    return handleError(error);
  }
} 
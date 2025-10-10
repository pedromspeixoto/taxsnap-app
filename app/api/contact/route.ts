import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userEmail = request.headers.get('x-user-email');
    const userId = request.headers.get('x-user-id');

    if (!userEmail || !userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const category = formData.get('category') as string;
    const message = formData.get('message') as string;
    const files = formData.getAll('files') as File[];

    // Validation
    if (!subject || !category || !message) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert files to base64 for email attachments
    const attachments = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        return {
          filename: file.name,
          content: buffer.toString('base64'),
          contentType: file.type,
          size: file.size,
        };
      })
    );

    // Send email via email service
    await emailService.sendContactFormEmail({
      userEmail,
      userId,
      subject,
      category,
      message,
      attachments,
    });

    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


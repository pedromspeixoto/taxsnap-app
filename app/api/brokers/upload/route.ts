import { NextRequest } from 'next/server';
import { submissionService, handleError, ok, requireAuth, badRequest } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    const formData = await request.formData();
    
    const user_id = formData.get('user_id') as string;
    const broker_id = formData.get('broker_id') as string;
    
    // Extract files from FormData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('files[') && value instanceof File) {
        files.push(value);
      }
    }

    if (!user_id || !broker_id || files.length === 0) {
      return badRequest('Missing required fields');
    }

    await submissionService.uploadBrokerFiles(user_id, broker_id, files);
    return ok('Files uploaded successfully');
  } catch (error) {
    console.error('Error uploading broker files', error);
    return handleError(error);
  }
} 
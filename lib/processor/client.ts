import { UploadBrokerFilesRequest, CalculateTaxesRequest, CalculateTaxesResponse, UploadBrokerFilesResponse, BrokerResponse } from '../types/broker';

const API_BASE_URL = process.env.PROCESSOR_BASE_URL || 'https://taxsnap-app-661634892388.europe-west1.run.app';
const PROCESSOR_API_TOKEN = process.env.PROCESSOR_API_TOKEN || '';

export class ProcessorClient {
  private static instance: ProcessorClient;

  private constructor() {}

  static getInstance(): ProcessorClient {
    if (!ProcessorClient.instance) {
      ProcessorClient.instance = new ProcessorClient();
    }
    return ProcessorClient.instance;
  }

  // Core request method - pure HTTP client
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type if not using FormData (let browser set it for FormData with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (PROCESSOR_API_TOKEN) {
      headers.Authorization = `Bearer ${PROCESSOR_API_TOKEN}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[CLIENT] ProcessorClient.request', error);
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async getBrokers(): Promise<BrokerResponse> {
    return this.request(`/supported_brokers`, {
      method: 'GET',
    });
  }

  async getManualLogTemplate(): Promise<{ message: string; template_path: string }> {
    return this.request(`/download_manual_trades_upoad_template`, {
      method: 'GET',
    });
  }

  async uploadBrokerFiles(request: UploadBrokerFilesRequest): Promise<UploadBrokerFilesResponse> {
    const formData = new FormData();
    
    // Add required fields
    formData.append('user_id', request.user_id);
    formData.append('broker_id', request.broker_id);
    
    // Add files directly to FormData (FastAPI expects multipart/form-data with actual files)
    request.files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    const response = await this.request(`/upload_broker_documents`, {
      method: 'POST',
      body: formData,
    });

    console.log('[CLIENT] ProcessorClient.uploadBrokerFiles', response);

    return response as UploadBrokerFilesResponse;
  }

  async deleteSubmissionFile(submissionId: string, brokerId: string, fileType: string, fileName: string): Promise<void> {
    return this.request(`/delete_user_broker_documents`, {
      method: 'POST',
      body: JSON.stringify({ user_id: submissionId, broker_id: brokerId, document_type: fileType, document_name: fileName }),
    });
  }

  async deleteAllSubmissionFiles(submissionId: string, brokerId: string): Promise<void> {
    return this.request(`/delete_user_broker_documents`, {
      method: 'POST',
      body: JSON.stringify({ user_id: submissionId, broker_id: brokerId, document_type: '', document_name: '' }),
    });
  }

  async calculateTaxes(request: CalculateTaxesRequest): Promise<CalculateTaxesResponse> {
    return this.request(`/calculate_taxes`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Export instance
export const processorClient = ProcessorClient.getInstance();
import { SupportedBrokersResponse, UploadBrokerFilesRequest, CalculateTaxesRequest, CalculateTaxesResponse } from '../types/broker';

const API_BASE_URL = process.env.PROCESSOR_BASE_URL || 'https://taxsnap-app-661634892388.europe-west1.run.app';

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
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type if not using FormData (let browser set it for FormData with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Client error', error);
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async getBrokers(): Promise<SupportedBrokersResponse> {
    return this.request(`/supported_brokers`, {
      method: 'GET',
    });
  }

  async uploadBrokerFiles(request: UploadBrokerFilesRequest): Promise<void> {
    const formData = new FormData();
    
    // Add required fields
    formData.append('user_id', request.user_id);
    formData.append('broker_id', request.broker_id);
    
    // Add files directly to FormData (FastAPI expects multipart/form-data with actual files)
    request.files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.request(`/upload_broker_documents`, {
      method: 'POST',
      body: formData,
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
import { BrokerResponse, CalculateTaxesResponse } from '../types/broker';
import { SubmissionResponse } from '../types/submission';
import { 
  RegisterUserRequest, 
  UserResponse, 
  MessageResponse, 
  SetPasswordRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ClientUser
} from '../types/user';
import type { 
  Pack, 
  CreatePaymentRequest, 
  CreatePaymentResponse, 
  ProcessPaymentRequest,
  PaymentResponse,
  UserPaymentSummary
} from '../types/payment';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Core request method - pure HTTP client
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
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
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Public API methods - no authentication logic here
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<ClientUser> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verify(token: string): Promise<AuthResponse> {
    return this.request('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    return this.request('/health');
  }

  // User registration and verification
  async registerUser(data: RegisterUserRequest): Promise<UserResponse> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string, locale?: string): Promise<MessageResponse> {
    return this.request('/users/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email, locale }),
    });
  }

  // Authenticated user management methods - require accessToken
  async getUserById(userId: string, accessToken: string): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {}, accessToken);
  }

  async updateUser(userId: string, data: UpdateUserRequest, accessToken: string): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, accessToken);
  }

  async deleteUser(userId: string, accessToken: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    }, accessToken);
  }

  // Password management
  async setPassword(userId: string, data: SetPasswordRequest, accessToken: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, accessToken);
  }

  async changePassword(userId: string, data: ChangePasswordRequest, accessToken: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, accessToken);
  }

  // Broker methods
  async getBrokers(accessToken: string): Promise<BrokerResponse> {
    return this.request('/brokers', {
      method: 'GET',
    }, accessToken);
  }

  async getManualLogTemplate(accessToken: string): Promise<{ message: string; template_path: string }> {
    return this.request('/brokers/manual_template', {
      method: 'GET',
    }, accessToken);
  }

  async uploadBrokerFiles(submissionId: string, brokerId: string, files: File[], accessToken: string): Promise<void> {
    const formData = new FormData();
    formData.append('user_id', submissionId);
    formData.append('broker_id', brokerId);
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file, file.name);
    });

    return this.request(`/brokers/upload`, {
      method: 'POST',
      body: formData,
      // Remove Content-Type header to let browser set it with boundary for FormData
      headers: {},
    }, accessToken);
  }

  async deleteSubmissionFile(submissionId: string, fileId: string, accessToken: string): Promise<void> {
    return this.request(`/submissions/${submissionId}/files/${fileId}`, {
      method: 'DELETE',
    }, accessToken);
  }

  async deleteAllSubmissionFiles(submissionId: string, brokerId: string, accessToken: string): Promise<void> {
    return this.request(`/submissions/${submissionId}/files`, {
      method: 'DELETE',
      body: JSON.stringify({ broker_id: brokerId }),
    }, accessToken);
  }

  // Submission methods
  async createSubmission(title: string, submissionType: string, fiscalNumber: string, year: number, isPremium: boolean, accessToken: string): Promise<SubmissionResponse> {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ title, submissionType, fiscalNumber, year, isPremium }),
    }, accessToken);
  }

  async getSubmissions(accessToken: string): Promise<SubmissionResponse[]> {
    return this.request('/submissions', {
      method: 'GET',
    }, accessToken);
  }

  async getSubmission(id: string, accessToken: string): Promise<SubmissionResponse> {
    return this.request(`/submissions/${id}`, {
      method: 'GET',
    }, accessToken);
  }

  async updateSubmission(id: string, data: { title?: string }, accessToken: string): Promise<SubmissionResponse> {
    return this.request(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, accessToken);
  }

  async updateSubmissionStatus(id: string, status: string, accessToken: string): Promise<void> {
    return this.request(`/submissions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }, accessToken);
  }

  async storeSubmissionResults(id: string, results: Record<string, unknown>, accessToken: string): Promise<void> {
    return this.request(`/submissions/${id}/results`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    }, accessToken);
  }

  async getSubmissionResults(id: string, accessToken: string): Promise<Record<string, unknown> | null> {
    return this.request(`/submissions/${id}/results`, {
      method: 'GET',
    }, accessToken);
  }

  async calculateTaxes(
    submissionId: string,
    accessToken: string
  ): Promise<CalculateTaxesResponse> {
    return this.request(`/submissions/${submissionId}/calculate-taxes`, {
      method: 'POST',
    }, accessToken);
  }

  // Payment-related methods
  async getPacks(purchaseOnly: boolean = false): Promise<Pack[]> {
    const params = purchaseOnly ? '?purchase_only=true' : '';
    return this.request(`/packs${params}`);
  }

  async createPayment(
    request: CreatePaymentRequest,
    accessToken: string
  ): Promise<CreatePaymentResponse> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(request),
    }, accessToken);
  }

  async getPayment(paymentId: string, accessToken: string): Promise<PaymentResponse> {
    return this.request(`/payments/${paymentId}`, {
      method: 'GET',
    }, accessToken);
  }

  async processPayment(
    paymentId: string,
    request: ProcessPaymentRequest,
    accessToken: string
  ): Promise<PaymentResponse> {
    return this.request(`/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, accessToken);
  }

  async getUserPaymentSummary(accessToken: string): Promise<UserPaymentSummary> {
    return this.request('/users/me/payment-summary', {
      method: 'GET',
    }, accessToken);
  }

  async getUserPaymentHistory(accessToken: string): Promise<UserPaymentSummary> {
    return this.request('/users/me/payment-history', {
      method: 'GET',
    }, accessToken);
  }
}

// Export instance
export const apiClient = ApiClient.getInstance();
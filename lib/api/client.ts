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

  async resendVerification(email: string): Promise<MessageResponse> {
    return this.request('/users/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
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

  async deleteSubmissionFile(fileId: string, accessToken: string): Promise<void> {
    return this.request(`/submissions/files/${fileId}`, {
      method: 'DELETE',
    }, accessToken);
  }

  // Submission methods
  async createSubmission(title: string, accessToken: string): Promise<SubmissionResponse> {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ title }),
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
    data: { nif?: string; p_l_analysis_year: number; p_l_calculation_type: "pl_average_weighted" | "pl_detailed" }, 
    accessToken: string
  ): Promise<CalculateTaxesResponse> {
    return this.request(`/submissions/${submissionId}/calculate-taxes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, accessToken);
  }
}

// Export instance
export const apiClient = ApiClient.getInstance();
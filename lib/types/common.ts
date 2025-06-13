export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

export interface ErrorResponse {
  message: string;
  error?: string;
}

export interface OkResponse {
  message: string;
} 
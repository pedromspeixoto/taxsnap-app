export interface SlackConfig {
  token: string;
  defaultChannel?: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  thread_ts?: string;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text: string;
  }>;
  accessory?: unknown;
}

export interface ErrorNotification {
  error: Error | string;
  context?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductNotification {
  event: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

export interface SubmissionNotification {
  submissionId: string;
  userId: string;
  userEmail?: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentNotification {
  paymentId: string;
  userId: string;
  userEmail?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, unknown>;
}


// Main exports
export { SlackClient, createSlackClient, getSlackClient } from './client';
export {
  formatErrorNotification,
  formatProductNotification,
  formatSubmissionNotification,
  formatPaymentNotification,
} from './formatters';
export {
  notifyError,
  notifyProductEvent,
  notifySubmission,
  notifyPayment,
  sendSlackMessage,
} from './notifications';

// Type exports
export type {
  SlackConfig,
  SlackMessage,
  SlackBlock,
  ErrorNotification,
  ProductNotification,
  SubmissionNotification,
  PaymentNotification,
} from './types';


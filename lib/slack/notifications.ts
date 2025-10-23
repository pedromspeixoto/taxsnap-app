import { getSlackClient } from './client';
import {
  formatErrorNotification,
  formatProductNotification,
  formatSubmissionNotification,
  formatPaymentNotification,
} from './formatters';
import type {
  ErrorNotification,
  ProductNotification,
  SubmissionNotification,
  PaymentNotification,
} from './types';

/**
 * Send an error notification to Slack (fire-and-forget, non-blocking)
 */
export function notifyError(
  notification: ErrorNotification,
  channelId?: string
): void {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_ERROR_CHANNEL || client.getDefaultChannel();
  const message = formatErrorNotification(notification, channel);

  // Fire and forget - don't await
  client.sendMessage(message).catch((error) => {
    console.error('Failed to send error notification to Slack:', error);
  });
}

/**
 * Send a product event notification to Slack (fire-and-forget, non-blocking)
 */
export function notifyProductEvent(
  notification: ProductNotification,
  channelId?: string
): void {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_PRODUCT_CHANNEL || client.getDefaultChannel();
  const message = formatProductNotification(notification, channel);

  // Fire and forget - don't await
  client.sendMessage(message).catch((error) => {
    console.error('Failed to send product notification to Slack:', error);
  });
}

/**
 * Send a submission notification to Slack (fire-and-forget, non-blocking)
 */
export function notifySubmission(
  notification: SubmissionNotification,
  channelId?: string
): void {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_SUBMISSION_CHANNEL || client.getDefaultChannel();
  const message = formatSubmissionNotification(notification, channel);

  // Fire and forget - don't await
  client.sendMessage(message).catch((error) => {
    console.error('Failed to send submission notification to Slack:', error);
  });
}

/**
 * Send a payment notification to Slack (fire-and-forget, non-blocking)
 */
export function notifyPayment(
  notification: PaymentNotification,
  channelId?: string
): void {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_PAYMENT_CHANNEL || client.getDefaultChannel();
  const message = formatPaymentNotification(notification, channel);

  // Fire and forget - don't await
  client.sendMessage(message).catch((error) => {
    console.error('Failed to send payment notification to Slack:', error);
  });
}

/**
 * Send a simple text message to a Slack channel (fire-and-forget, non-blocking)
 */
export function sendSlackMessage(
  text: string,
  channelId?: string
): void {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || client.getDefaultChannel();
  
  // Fire and forget - don't await
  client.sendText(channel, text).catch((error) => {
    console.error('Failed to send text message to Slack:', error);
  });
}


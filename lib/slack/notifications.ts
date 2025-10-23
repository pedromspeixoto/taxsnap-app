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
 * Send an error notification to Slack
 */
export async function notifyError(
  notification: ErrorNotification,
  channelId?: string
): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_ERROR_CHANNEL || client.getDefaultChannel();
  const message = formatErrorNotification(notification, channel);

  await client.sendMessage(message);
}

/**
 * Send a product event notification to Slack (e.g., user sign-up, sign-in)
 */
export async function notifyProductEvent(
  notification: ProductNotification,
  channelId?: string
): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_PRODUCT_CHANNEL || client.getDefaultChannel();
  const message = formatProductNotification(notification, channel);

  await client.sendMessage(message);
}

/**
 * Send a submission notification to Slack
 */
export async function notifySubmission(
  notification: SubmissionNotification,
  channelId?: string
): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_SUBMISSION_CHANNEL || client.getDefaultChannel();
  const message = formatSubmissionNotification(notification, channel);

  await client.sendMessage(message);
}

/**
 * Send a payment notification to Slack
 */
export async function notifyPayment(
  notification: PaymentNotification,
  channelId?: string
): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || process.env.SLACK_PAYMENT_CHANNEL || client.getDefaultChannel();
  const message = formatPaymentNotification(notification, channel);

  await client.sendMessage(message);
}

/**
 * Send a simple text message to a Slack channel
 */
export async function sendSlackMessage(
  text: string,
  channelId?: string
): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  const channel = channelId || client.getDefaultChannel();
  await client.sendText(channel, text);
}


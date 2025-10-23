import type {
  ErrorNotification,
  ProductNotification,
  SubmissionNotification,
  PaymentNotification,
  SlackMessage,
  SlackBlock,
} from './types';

/**
 * Format an error notification for Slack
 */
export function formatErrorNotification(
  notification: ErrorNotification,
  channel: string
): SlackMessage {
  const errorMessage =
    notification.error instanceof Error
      ? notification.error.message
      : notification.error;

  const errorStack =
    notification.error instanceof Error
      ? notification.error.stack
      : undefined;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 Error Alert',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Error:*\n${errorMessage}`,
        },
        ...(notification.context
          ? [
              {
                type: 'mrkdwn',
                text: `*Context:*\n${notification.context}`,
              },
            ]
          : []),
      ],
    },
  ];

  // Add user info if available
  if (notification.userId) {
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*User ID:*\n${notification.userId}`,
        },
      ],
    });
  }

  // Add metadata if available
  if (notification.metadata && Object.keys(notification.metadata).length > 0) {
    const metadataText = Object.entries(notification.metadata)
      .map(([key, value]) => `*${key}:* ${JSON.stringify(value)}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Metadata:*\n${metadataText}`,
      },
    });
  }

  // Add stack trace if available
  if (errorStack) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Stack Trace:*\n\`\`\`${errorStack.substring(0, 2000)}\`\`\``,
      },
    });
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
      },
    ],
  });

  return {
    channel,
    text: `Error: ${errorMessage}`, // Fallback text
    blocks,
  };
}

/**
 * Format a product notification for Slack (e.g., user sign-in, sign-up)
 */
export function formatProductNotification(
  notification: ProductNotification,
  channel: string
): SlackMessage {
  const emoji = getEventEmoji(notification.event);

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${notification.event}`,
        emoji: true,
      },
    },
  ];

  // Add user details
  const userFields: Array<{ type: string; text: string }> = [];

  if (notification.userName) {
    userFields.push({
      type: 'mrkdwn',
      text: `*Name:*\n${notification.userName}`,
    });
  }

  if (notification.userEmail) {
    userFields.push({
      type: 'mrkdwn',
      text: `*Email:*\n${notification.userEmail}`,
    });
  }

  if (notification.userId) {
    userFields.push({
      type: 'mrkdwn',
      text: `*User ID:*\n${notification.userId}`,
    });
  }

  if (userFields.length > 0) {
    blocks.push({
      type: 'section',
      fields: userFields,
    });
  }

  // Add metadata if available
  if (notification.metadata && Object.keys(notification.metadata).length > 0) {
    const metadataFields = Object.entries(notification.metadata).map(
      ([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${formatValue(value)}`,
      })
    );

    blocks.push({
      type: 'section',
      fields: metadataFields,
    });
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
      },
    ],
  });

  return {
    channel,
    text: `${notification.event}${notification.userName ? ` - ${notification.userName}` : ''}`,
    blocks,
  };
}

/**
 * Format a submission notification for Slack
 */
export function formatSubmissionNotification(
  notification: SubmissionNotification,
  channel: string
): SlackMessage {
  const emoji = getSubmissionStatusEmoji(notification.status);

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} Submission ${notification.status}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Submission ID:*\n${notification.submissionId}`,
        },
        {
          type: 'mrkdwn',
          text: `*User ID:*\n${notification.userId}`,
        },
        ...(notification.userEmail
          ? [
              {
                type: 'mrkdwn',
                text: `*Email:*\n${notification.userEmail}`,
              },
            ]
          : []),
        {
          type: 'mrkdwn',
          text: `*Status:*\n${notification.status}`,
        },
      ],
    },
  ];

  // Add metadata if available
  if (notification.metadata && Object.keys(notification.metadata).length > 0) {
    const metadataFields = Object.entries(notification.metadata).map(
      ([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${formatValue(value)}`,
      })
    );

    blocks.push({
      type: 'section',
      fields: metadataFields,
    });
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
      },
    ],
  });

  return {
    channel,
    text: `Submission ${notification.status}: ${notification.submissionId}`,
    blocks,
  };
}

/**
 * Format a payment notification for Slack
 */
export function formatPaymentNotification(
  notification: PaymentNotification,
  channel: string
): SlackMessage {
  const emoji = getPaymentStatusEmoji(notification.status);

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} Payment ${notification.status}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Payment ID:*\n${notification.paymentId}`,
        },
        {
          type: 'mrkdwn',
          text: `*User ID:*\n${notification.userId}`,
        },
        ...(notification.userEmail
          ? [
              {
                type: 'mrkdwn',
                text: `*Email:*\n${notification.userEmail}`,
              },
            ]
          : []),
        {
          type: 'mrkdwn',
          text: `*Amount:*\n${notification.amount} ${notification.currency.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Status:*\n${notification.status}`,
        },
      ],
    },
  ];

  // Add metadata if available
  if (notification.metadata && Object.keys(notification.metadata).length > 0) {
    const metadataFields = Object.entries(notification.metadata).map(
      ([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${formatValue(value)}`,
      })
    );

    blocks.push({
      type: 'section',
      fields: metadataFields,
    });
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
      },
    ],
  });

  return {
    channel,
    text: `Payment ${notification.status}: ${notification.amount} ${notification.currency.toUpperCase()}`,
    blocks,
  };
}

/**
 * Helper: Get emoji for event type
 */
function getEventEmoji(event: string): string {
  const emojiMap: Record<string, string> = {
    'User Sign Up': '🎉',
    'User Sign In': '👋',
    'User Logout': '👋',
    'Email Verified': '✅',
    'Password Reset': '🔑',
    'Profile Updated': '✏️',
  };

  return emojiMap[event] || '📢';
}

/**
 * Helper: Get emoji for submission status
 */
function getSubmissionStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    created: '🆕',
    processing: '⚙️',
    completed: '✅',
    failed: '❌',
    pending: '⏳',
  };

  return emojiMap[status.toLowerCase()] || '📄';
}

/**
 * Helper: Get emoji for payment status
 */
function getPaymentStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    succeeded: '✅',
    pending: '⏳',
    failed: '❌',
    refunded: '↩️',
    canceled: '🚫',
  };

  return emojiMap[status.toLowerCase()] || '💳';
}

/**
 * Helper: Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}


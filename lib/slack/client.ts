import type { SlackConfig, SlackMessage } from './types';

export class SlackClient {
  private token: string;
  private defaultChannel?: string;
  private baseUrl = 'https://slack.com/api';

  constructor(config: SlackConfig) {
    this.token = config.token;
    this.defaultChannel = config.defaultChannel;
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data.error);
        throw new Error(`Slack API error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      // Don't throw - we don't want Slack failures to break the app
    }
  }

  /**
   * Send a simple text message
   */
  async sendText(channel: string, text: string): Promise<void> {
    await this.sendMessage({
      channel,
      text,
    });
  }

  /**
   * Get the default channel or throw if not set
   */
  getDefaultChannel(): string {
    if (!this.defaultChannel) {
      throw new Error('No default channel configured');
    }
    return this.defaultChannel;
  }
}

/**
 * Create a Slack client instance from environment variables
 */
export function createSlackClient(): SlackClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL;

  if (!token) {
    console.warn('SLACK_BOT_TOKEN not configured');
    return null;
  }

  return new SlackClient({
    token,
    defaultChannel,
  });
}

// Singleton instance
let slackClientInstance: SlackClient | null | undefined;

/**
 * Get the global Slack client instance
 */
export function getSlackClient(): SlackClient | null {
  if (slackClientInstance === undefined) {
    slackClientInstance = createSlackClient();
  }
  return slackClientInstance;
}


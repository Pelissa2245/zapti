import { SocketIOServer } from 'socket.io';
import { WEBSOCKET_EVENTS } from '../constants';
import axios from 'axios';

declare global {
  var io: SocketIOServer | undefined;
}

export interface WebSocketPayload {
  [key: string]: any;
}

export function broadcastToWebsocket(
  io: SocketIOServer | undefined,
  event: string,
  data: WebSocketPayload,
  room: string
): void {
  const socketServer = io || global.io;

  if (!socketServer) {
    console.warn('WebSocket server not initialized, skipping broadcast');
    return;
  }

  try {
    socketServer.to(room).emit(event, data);
  } catch (error) {
    console.error('WebSocket broadcast error:', error);
  }
}

export function broadcastToUser(
  io: SocketIOServer | undefined,
  event: string,
  data: WebSocketPayload,
  userId: string
): void {
  broadcastToWebsocket(io, event, data, `user:${userId}`);
}

export function broadcastToTenant(
  io: SocketIOServer | undefined,
  event: string,
  data: WebSocketPayload,
  tenantId: string
): void {
  broadcastToWebsocket(io, event, data, `tenant:${tenantId}`);
}

export function broadcastToConversation(
  io: SocketIOServer | undefined,
  event: string,
  data: WebSocketPayload,
  conversationId: string
): void {
  broadcastToWebsocket(io, event, data, `conversation:${conversationId}`);
}

// Webhook delivery with retry
export async function sendWebhookWithRetry(
  url: string,
  payload: any,
  secret?: string,
  maxRetries: number = 3
): Promise<{ success: boolean; attempts: number; error?: string }> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ZapTI-Webhook/1.0',
      };

      if (secret) {
        const crypto = await import('crypto');
        const signature = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-ZapTI-Signature'] = `sha256=${signature}`;
      }

      const response = await axios.post(url, payload, {
        headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        return { success: true, attempts: attempt };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
    } catch (error: any) {
      lastError = error.message;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, attempts: maxRetries, error: lastError };
}

// Notification types
export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(
  io: SocketIOServer | undefined,
  notification: NotificationPayload,
  target: { userId?: string; tenantId?: string; conversationId?: string }
): Promise<void> {
  const event = WEBSOCKET_EVENTS.NOTIFICATION;

  if (target.userId) {
    broadcastToUser(io, event, notification, target.userId);
  }

  if (target.tenantId) {
    broadcastToTenant(io, event, notification, target.tenantId);
  }

  if (target.conversationId) {
    broadcastToConversation(io, event, notification, target.conversationId);
  }
}

// Email notification integration
export async function sendNotificationEmail(
  email: string,
  notification: NotificationPayload,
  emailTemplates: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // This would use the email module
  // Import dynamically to avoid circular dependency
  const { sendEmail, emailTemplates: templates } = await import('../email');

  const template = templates.notification(notification.title, notification.message, notification.actionUrl);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
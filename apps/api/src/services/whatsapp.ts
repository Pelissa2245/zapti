import { PrismaClient, MessageType, MessageStatus, MessageDirection } from '@zapti/database';
import { config } from '@zapti/shared/config';

const prisma = new PrismaClient();

export interface WhatsAppMessagePayload {
  conversation: any;
  message: any;
  tenantId: string;
}

export async function sendWhatsAppMessage(
  conversation: any,
  message: any,
  tenantId: string
): Promise<void> {
  const cfg = config();

  // Determine which integration to use
  const integration = await prisma.integration.findFirst({
    where: { tenantId, type: { in: ['EVOLUTION_API', 'WHATSAPP_BUSINESS'] }, status: 'CONNECTED' },
  });

  if (!integration) {
    console.warn(`No connected WhatsApp integration found for tenant ${tenantId}`);
    await markMessageFailed(message.id, 'No WhatsApp integration configured');
    return;
  }

  try {
    if (integration.type === 'EVOLUTION_API') {
      await sendViaEvolutionAPI(integration, conversation, message);
    } else if (integration.type === 'WHATSAPP_BUSINESS') {
      await sendViaWhatsAppBusinessAPI(integration, conversation, message);
    }
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error);
    await markMessageFailed(message.id, error.message);
  }
}

async function sendViaEvolutionAPI(
  integration: any,
  conversation: any,
  message: any
): Promise<void> {
  const config = integration.config as any;
  const apiUrl = config.apiUrl || 'http://localhost:8080';
  const instanceName = config.instanceName;
  const apiKey = config.apiKey;

  const phone = conversation.contact.phone;
  const messageType = getEvolutionMessageType(message.type);

  const payload: any = {
    number: phone,
    ...buildEvolutionMessagePayload(message, messageType),
  };

  const url = `${apiUrl}/message/send${messageType === 'text' ? 'Text' : messageType === 'media' ? 'Media' : ''}/${instanceName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  // Update message with external ID
  await prisma.message.update({
    where: { id: message.id },
    data: {
      externalId: result.key?.id || result.id,
      status: 'SENT',
    },
  });
}

async function sendViaWhatsAppBusinessAPI(
  integration: any,
  conversation: any,
  message: any
): Promise<void> {
  const config = integration.config as any;
  const phoneNumberId = config.phoneNumberId;
  const accessToken = config.accessToken;

  const phone = conversation.contact.phone;

  const payload = buildWhatsAppBusinessPayload(message, phone);

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp Business API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const result = await response.json();

  // Update message with external ID
  await prisma.message.update({
    where: { id: message.id },
    data: {
      externalId: result.messages?.[0]?.id,
      status: 'SENT',
    },
  });
}

function getEvolutionMessageType(type: MessageType): string {
  switch (type) {
    case 'TEXT':
    case 'TEMPLATE':
      return 'text';
    case 'IMAGE':
    case 'VIDEO':
    case 'AUDIO':
    case 'DOCUMENT':
      return 'media';
    case 'STICKER':
      return 'sticker';
    case 'LOCATION':
      return 'location';
    case 'CONTACT':
      return 'contact';
    case 'INTERACTIVE':
      return 'interactive';
    default:
      return 'text';
  }
}

function buildEvolutionMessagePayload(message: any, messageType: string): any {
  switch (messageType) {
    case 'text':
      return { text: message.content };
    case 'media':
      return {
        mediaMessage: {
          mediatype: getEvolutionMediaType(message.type),
          media: message.mediaUrl,
          caption: message.content,
          fileName: message.metadata?.fileName,
        },
      };
    case 'sticker':
      return {
        stickerMessage: {
          sticker: message.mediaUrl,
        },
      };
    case 'location':
      return {
        locationMessage: {
          degreesLatitude: message.metadata?.latitude,
          degreesLongitude: message.metadata?.longitude,
          name: message.metadata?.name,
          address: message.metadata?.address,
        },
      };
    case 'contact':
      return {
        contactMessage: {
          contacts: message.metadata?.contacts,
        },
      };
    case 'interactive':
      return {
        interactiveMessage: message.metadata?.interactive,
      };
    default:
      return { text: message.content };
  }
}

function getEvolutionMediaType(type: MessageType): string {
  switch (type) {
    case 'IMAGE': return 'image';
    case 'VIDEO': return 'video';
    case 'AUDIO': return 'audio';
    case 'DOCUMENT': return 'document';
    default: return 'document';
  }
}

function buildWhatsAppBusinessPayload(message: any, phone: string): any {
  const basePayload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: getWhatsAppBusinessType(message.type),
  };

  switch (message.type) {
    case 'TEXT':
    case 'TEMPLATE':
      if (message.type === 'TEMPLATE' && message.templateId) {
        // Template messages handled separately
        return {
          ...basePayload,
          type: 'template',
          template: {
            name: message.template?.name || 'unknown',
            language: { code: message.template?.language || 'pt_BR' },
            components: buildTemplateComponents(message.metadata?.variables),
          },
        };
      }
      return {
        ...basePayload,
        type: 'text',
        text: { body: message.content },
      };
    case 'IMAGE':
      return {
        ...basePayload,
        type: 'image',
        image: {
          link: message.mediaUrl,
          caption: message.content,
        },
      };
    case 'VIDEO':
      return {
        ...basePayload,
        type: 'video',
        video: {
          link: message.mediaUrl,
          caption: message.content,
        },
      };
    case 'AUDIO':
      return {
        ...basePayload,
        type: 'audio',
        audio: { link: message.mediaUrl },
      };
    case 'DOCUMENT':
      return {
        ...basePayload,
        type: 'document',
        document: {
          link: message.mediaUrl,
          caption: message.content,
          filename: message.metadata?.fileName,
        },
      };
    case 'STICKER':
      return {
        ...basePayload,
        type: 'sticker',
        sticker: { link: message.mediaUrl },
      };
    case 'LOCATION':
      return {
        ...basePayload,
        type: 'location',
        location: {
          latitude: message.metadata?.latitude,
          longitude: message.metadata?.longitude,
          name: message.metadata?.name,
          address: message.metadata?.address,
        },
      };
    case 'CONTACT':
      return {
        ...basePayload,
        type: 'contacts',
        contacts: message.metadata?.contacts,
      };
    case 'INTERACTIVE':
      return {
        ...basePayload,
        type: 'interactive',
        interactive: message.metadata?.interactive,
      };
    default:
      return {
        ...basePayload,
        type: 'text',
        text: { body: message.content },
      };
  }
}

function getWhatsAppBusinessType(type: MessageType): string {
  switch (type) {
    case 'TEXT': return 'text';
    case 'TEMPLATE': return 'template';
    case 'IMAGE': return 'image';
    case 'VIDEO': return 'video';
    case 'AUDIO': return 'audio';
    case 'DOCUMENT': return 'document';
    case 'STICKER': return 'sticker';
    case 'LOCATION': return 'location';
    case 'CONTACT': return 'contacts';
    case 'INTERACTIVE': return 'interactive';
    default: return 'text';
  }
}

function buildTemplateComponents(variables?: Record<string, string>): any[] {
  if (!variables) return [];

  return [{
    type: 'body',
    parameters: Object.entries(variables).map(([key, value]) => ({
      type: 'text',
      text: value,
    })),
  }];
}

async function markMessageFailed(messageId: string, error: string): Promise<void> {
  await prisma.message.update({
    where: { id: messageId },
    data: {
      status: 'FAILED',
      metadata: { error, failedAt: new Date().toISOString() },
    },
  });
}

export async function markMessageDelivered(externalId: string, tenantId: string): Promise<void> {
  await prisma.message.updateMany({
    where: { tenantId, externalId, status: 'SENT' },
    data: { status: 'DELIVERED' },
  });
}

export async function markMessageRead(externalId: string, tenantId: string): Promise<void> {
  await prisma.message.updateMany({
    where: { tenantId, externalId, status: { in: ['SENT', 'DELIVERED'] } },
    data: { status: 'READ' },
  });
}

export async function markMessageFailedByExternalId(externalId: string, tenantId: string, error: string): Promise<void> {
  await prisma.message.updateMany({
    where: { tenantId, externalId, status: { in: ['SENT', 'DELIVERED'] } },
    data: {
      status: 'FAILED',
      metadata: { error, failedAt: new Date().toISOString() },
    },
  });
}

export async function processWhatsAppWebhook(body: any, request: any): Promise<void> {
  console.log('Processing WhatsApp webhook:', JSON.stringify(body, null, 2));
  // TODO: Implement WhatsApp Business API webhook processing
}

export async function processEvolutionWebhook(event: string, data: any, tenantId: string): Promise<void> {
  console.log(`Processing Evolution API webhook: ${event}`, JSON.stringify(data, null, 2));

  try {
    switch (event) {
      case 'messages.upsert':
        await processEvolutionMessageUpsert(data, tenantId);
        break;
      case 'messages.update':
        await processEvolutionMessageUpdate(data, tenantId);
        break;
      case 'connection.update':
        await processEvolutionConnectionUpdate(data, tenantId);
        break;
      case 'qrcode.updated':
        // QR code updated - could notify frontend
        console.log('QR code updated for tenant:', tenantId);
        break;
      default:
        console.log('Unhandled Evolution event:', event);
    }
  } catch (error: any) {
    console.error('Error processing Evolution webhook:', error);
  }
}

async function processEvolutionMessageUpsert(data: any, tenantId: string): Promise<void> {
  const { messages } = data;
  for (const msg of messages) {
    // Find or create conversation
    // Find or create contact
    // Create message record
    console.log('Processing message upsert:', msg.key?.id);
  }
}

async function processEvolutionMessageUpdate(data: any, tenantId: string): Promise<void> {
  const { messages } = data;
  for (const msg of messages) {
    // Update message status (delivered, read, etc.)
    console.log('Processing message update:', msg.key?.id, 'status:', msg.status);
  }
}

async function processEvolutionConnectionUpdate(data: any, tenantId: string): Promise<void> {
  // Update integration status based on connection state
  console.log('Connection update:', data.state);
}
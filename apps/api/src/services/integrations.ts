import { config } from '@zapti/shared/config';
import { testEvolutionConnection, getEvolutionQRCode } from './whatsapp';

/**
 * Test integration connection
 */
export async function testIntegration(integration: any): Promise<{ success: boolean; message: string; details?: any }> {
  switch (integration.type) {
    case 'EVOLUTION_API':
      return await testEvolutionConnection(integration);

    case 'WHATSAPP_BUSINESS':
      return await testWhatsAppBusinessConnection(integration);

    case 'SMTP':
      return await testSMTPConnection(integration);

    case 'WEBHOOK':
      return await testWebhookConnection(integration);

    default:
      return { success: false, message: `Unknown integration type: ${integration.type}` };
  }
}

/**
 * Test WhatsApp Business API connection
 */
async function testWhatsAppBusinessConnection(integration: any): Promise<{ success: boolean; message: string }> {
  const { phoneNumberId, accessToken } = integration.config;

  if (!phoneNumberId || !accessToken) {
    return { success: false, message: 'Phone Number ID and Access Token required' };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Failed to connect' };
    }

    const data = await response.json();
    return { success: true, message: `Connected to ${data.name || 'WhatsApp Business'}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Test SMTP connection
 */
async function testSMTPConnection(integration: any): Promise<{ success: boolean; message: string }> {
  // In production, use nodemailer to test SMTP
  // For now, return success if config is present
  const { host, port, user, pass } = integration.config;

  if (!host || !port || !user || !pass) {
    return { success: false, message: 'SMTP configuration incomplete' };
  }

  return { success: true, message: 'SMTP configuration valid (not tested)' };
}

/**
 * Test webhook connection
 */
async function testWebhookConnection(integration: any): Promise<{ success: boolean; message: string }> {
  const { url } = integration.config;

  if (!url) {
    return { success: false, message: 'Webhook URL required' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
    });

    return {
      success: response.ok,
      message: response.ok ? 'Webhook responded successfully' : `Webhook returned ${response.status}`
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Get Evolution API QR Code (exported from whatsapp.ts)
 */
export { getEvolutionQRCode };
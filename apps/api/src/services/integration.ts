import { PrismaClient, IntegrationType, IntegrationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function testIntegration(integration: any): Promise<TestResult> {
  switch (integration.type) {
    case IntegrationType.EVOLUTION_API:
      return testEvolutionAPI(integration.config);
    case IntegrationType.WHATSAPP_BUSINESS:
      return testWhatsAppBusinessAPI(integration.config);
    case IntegrationType.WEBHOOK:
      return testWebhook(integration.config);
    case IntegrationType.CRM:
      return testCRM(integration.config);
    case IntegrationType.EMAIL:
      return testEmail(integration.config);
    case IntegrationType.PAYMENT:
      return testPayment(integration.config);
    default:
      return { success: false, message: `Unknown integration type: ${integration.type}` };
  }
}

async function testEvolutionAPI(config: any): Promise<TestResult> {
  const { apiUrl, instanceName, apiKey } = config;

  if (!apiUrl || !instanceName || !apiKey) {
    return { success: false, message: 'Missing required configuration' };
  }

  try {
    const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': apiKey },
    });

    if (!response.ok) {
      return { success: false, message: `API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: 'Connection successful', data };
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}

async function testWhatsAppBusinessAPI(config: any): Promise<TestResult> {
  const { phoneNumberId, accessToken } = config;

  if (!phoneNumberId || !accessToken) {
    return { success: false, message: 'Missing required configuration' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      return { success: false, message: `API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: 'Connection successful', data };
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}

async function testWebhook(config: any): Promise<TestResult> {
  const { url, secret } = config;

  if (!url) {
    return { success: false, message: 'Missing webhook URL' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Webhook-Secret': secret } : {}),
      },
      body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
    });

    return {
      success: response.ok,
      message: response.ok ? 'Webhook test successful' : `Webhook returned ${response.status}`,
      data: { status: response.status }
    };
  } catch (error: any) {
    return { success: false, message: `Webhook test failed: ${error.message}` };
  }
}

async function testCRM(config: any): Promise<TestResult> {
  const { provider, apiKey, baseUrl } = config;

  if (!provider || !apiKey) {
    return { success: false, message: 'Missing required configuration' };
  }

  try {
    let url: string;
    let headers: any = { 'Authorization': `Bearer ${apiKey}` };

    switch (provider) {
      case 'PIPEDRIVE':
        url = `${baseUrl || 'https://api.pipedrive.com/v1'}/users/me`;
        break;
      case 'HUBSPOT':
        url = 'https://api.hubapi.com/integrations/v1/me';
        break;
      case 'SALESFORCE':
        url = `${baseUrl || 'https://api.salesforce.com'}/services/data/v58.0/sobjects/User`;
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      default:
        return { success: false, message: `Unknown CRM provider: ${provider}` };
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { success: false, message: `CRM API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: 'CRM connection successful', data };
  } catch (error: any) {
    return { success: false, message: `CRM connection failed: ${error.message}` };
  }
}

async function testEmail(config: any): Promise<TestResult> {
  const { provider, apiKey, fromEmail } = config;

  if (!provider || !apiKey || !fromEmail) {
    return { success: false, message: 'Missing required configuration' };
  }

  try {
    let url: string;
    let headers: any;
    let body: any;

    switch (provider) {
      case 'SENDGRID':
        url = 'https://api.sendgrid.com/v3/user/profile';
        headers = { 'Authorization': `Bearer ${apiKey}` };
        break;
      case 'MAILGUN':
        url = 'https://api.mailgun.net/v3/domains';
        headers = { 'Authorization': `Basic ${btoa(`api:${apiKey}`)}` };
        break;
      case 'AWS_SES':
        // AWS SES requires different auth
        return { success: false, message: 'AWS SES test not implemented' };
      case 'SMTP':
        // SMTP test would require a different approach
        return { success: false, message: 'SMTP test not implemented' };
      default:
        return { success: false, message: `Unknown email provider: ${provider}` };
    }

    const response = await fetch(url, { headers, body: body ? JSON.stringify(body) : undefined });

    if (!response.ok) {
      return { success: false, message: `Email API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: 'Email connection successful', data };
  } catch (error: any) {
    return { success: false, message: `Email connection failed: ${error.message}` };
  }
}

async function testPayment(config: any): Promise<TestResult> {
  const { provider, publicKey, secretKey } = config;

  if (!provider || !secretKey) {
    return { success: false, message: 'Missing required configuration' };
  }

  try {
    let url: string;
    let headers: any;

    switch (provider) {
      case 'MERCADO_PAGO':
        url = 'https://api.mercadopago.com/users/me';
        headers = { 'Authorization': `Bearer ${secretKey}` };
        break;
      case 'STRIPE':
        url = 'https://api.stripe.com/v1/account';
        headers = { 'Authorization': `Bearer ${secretKey}` };
        break;
      case 'PAYPAL':
        // PayPal requires OAuth token
        return { success: false, message: 'PayPal test not implemented' };
      default:
        return { success: false, message: `Unknown payment provider: ${provider}` };
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { success: false, message: `Payment API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: 'Payment connection successful', data };
  } catch (error: any) {
    return { success: false, message: `Payment connection failed: ${error.message}` };
  }
}

export async function syncIntegration(integration: any): Promise<any> {
  switch (integration.type) {
    case IntegrationType.CRM:
      return syncCRM(integration);
    default:
      return { synced: 0, message: 'Sync not implemented for this integration type' };
  }
}

async function syncCRM(integration: any): Promise<any> {
  const { provider, apiKey, baseUrl } = integration.config;

  // This is a placeholder for CRM sync logic
  // Would pull contacts, deals, etc. from CRM and create/update in Zapti

  return { synced: 0, message: `CRM sync for ${provider} not fully implemented` };
}
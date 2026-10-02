// ZapTI Shared — Email Service
import { config } from './config.js';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email templates
const templates: Record<string, (data: Record<string, any>) => { html: string; text: string }> = {
  invitation: (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ZapTI</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Convite para ${data.tenantName}</h2>
            <p>Olá ${data.ownerName || 'Usuário'},</p>
            <p>Você foi convidado para fazer parte do <strong>${data.tenantName}</strong> no ZapTI.</p>
            <p>Sua senha temporária é: <strong style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.tempPassword}</strong></p>
            <p>Por favor, faça login e altere sua senha no primeiro acesso.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar ZapTI</a>
            </div>
            <p style="color: #666; font-size: 14px;">Se você não solicitou este convite, pode ignorar este e-mail.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Equipe ZapTI</p>
          </div>
        </body>
      </html>
    `,
    text: `Convite para ${data.tenantName}\n\nOlá ${data.ownerName || 'Usuário'},\n\nVocê foi convidado para fazer parte do ${data.tenantName} no ZapTI.\nSua senha temporária é: ${data.tempPassword}\nPor favor, faça login e altere sua senha no primeiro acesso.\n\nAcesse: ${data.loginUrl}\n\nEquipe ZapTI`,
  }),

  'tenant-created': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ZapTI</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Seu tenant foi criado!</h2>
            <p>Olá ${data.ownerName},</p>
            <p>Seu tenant <strong>${data.tenantName}</strong> foi criado com sucesso no ZapTI.</p>
            <p>Sua senha inicial é: <strong style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</strong></p>
            <p>Por favor, faça login e altere sua senha.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar ZapTI</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Equipe ZapTI</p>
          </div>
        </body>
      </html>
    `,
    text: `Seu tenant foi criado!\n\nOlá ${data.ownerName},\n\nSeu tenant ${data.tenantName} foi criado com sucesso no ZapTI.\nSua senha inicial é: ${data.password}\nPor favor, faça login e altere sua senha.\n\nAcesse: ${data.loginUrl}\n\nEquipe ZapTI`,
  }),

  'password-reset': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ZapTI</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Redefinição de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
            </div>
            <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
            <p style="color: #666; font-size: 14px;">Se você não solicitou isso, pode ignorar este e-mail.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Equipe ZapTI</p>
          </div>
        </body>
      </html>
    `,
    text: `Redefinição de Senha\n\nOlá,\n\nRecebemos uma solicitação para redefinir sua senha.\nClique no link abaixo para criar uma nova senha:\n${data.resetUrl}\n\nEste link expira em 1 hora.\n\nEquipe ZapTI`,
  }),

  'sla-breach': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Alerta de SLA</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">SLA Violado</h2>
            <p>Uma conversa ou ticket excedeu o tempo de SLA configurado.</p>
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #EF4444; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Tipo:</strong> ${data.type}</p>
              <p style="margin: 5px 0;"><strong>ID:</strong> ${data.resourceId}</p>
              <p style="margin: 5px 0;"><strong>Tempo decorrido:</strong> ${data.elapsedTime}</p>
              <p style="margin: 5px 0;"><strong>SLA configurado:</strong> ${data.slaTime}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.url}" style="background: #EF4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Detalhes</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Sistema de Monitoramento ZapTI</p>
          </div>
        </body>
      </html>
    `,
    text: `⚠️ Alerta de SLA - SLA Violado\n\nUma conversa ou ticket excedeu o tempo de SLA configurado.\n\nTipo: ${data.type}\nID: ${data.resourceId}\nTempo decorrido: ${data.elapsedTime}\nSLA configurado: ${data.slaTime}\n\nVer detalhes: ${data.url}\n\nSistema de Monitoramento ZapTI`,
  }),

  'daily-report': (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📊 Relatório Diário</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Resumo do dia ${data.date}</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Conversas novas</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.newConversations}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Mensagens trocadas</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.totalMessages}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Tickets criados</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.newTickets}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Tickets resolvidos</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.resolvedTickets}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Tempo médio resposta</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${data.avgResponseTime}</td></tr>
              <tr><td style="padding: 10px;"><strong>Satisfação média</strong></td><td style="padding: 10px; text-align: right;">${data.avgSatisfaction}/5</td></tr>
            </table>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Dashboard Completo</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">ZapTI Analytics</p>
          </div>
        </body>
      </html>
    `,
    text: `📊 Relatório Diário - ${data.date}\n\nConversas novas: ${data.newConversations}\nMensagens trocadas: ${data.totalMessages}\nTickets criados: ${data.newTickets}\nTickets resolvidos: ${data.resolvedTickets}\nTempo médio resposta: ${data.avgResponseTime}\nSatisfação média: ${data.avgSatisfaction}/5\n\nVer Dashboard: ${data.dashboardUrl}\n\nZapTI Analytics`,
  }),
};

let emailTransporter: any = null;

async function getTransporter() {
  if (emailTransporter) return emailTransporter;

  // In production, use nodemailer with real SMTP
  // For now, we'll use a mock that logs to console
  if (config.env === 'development' || config.env === 'test') {
    return {
      sendMail: async (options: any) => {
        console.log('📧 [MOCK EMAIL] To:', options.to);
        console.log('📧 [MOCK EMAIL] Subject:', options.subject);
        console.log('📧 [MOCK EMAIL] Text:', options.text?.substring(0, 200));
        return { messageId: `mock-${Date.now()}`, response: 'OK' };
      },
    };
  }

  // Production: use nodemailer
  try {
    const nodemailer = await import('nodemailer');
    emailTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: { user: config.email.user, pass: config.email.pass },
    });
    return emailTransporter;
  } catch {
    // Fallback to mock
    return {
      sendMail: async (options: any) => {
        console.log('📧 [MOCK EMAIL] To:', options.to);
        console.log('📧 [MOCK EMAIL] Subject:', options.subject);
        return { messageId: `mock-${Date.now()}`, response: 'OK' };
      },
    };
  }
}

export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const template = templates[options.template];

    if (!template) {
      return { success: false, error: `Template "${options.template}" não encontrado` };
    }

    const { html, text } = template(options.data);

    const result = await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text,
      html,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBulkEmail(emails: EmailOptions[]): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return results;
}

export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}
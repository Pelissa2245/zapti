// ZapTI API — Email Service
import { env } from '../utils/env';
import nodemailer from 'nodemailer';

// ============================================
// EMAIL TRANSPORT
// ============================================

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('Configuração SMTP incompleta');
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for 465, false for 587
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
  });

  return transporter;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const baseTemplate = (content: string, companyName: string = 'ZapTI') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        ${companyName} - Painel de Atendimento WhatsApp
      </td>
    </tr>
  </table>
</body>
</html>
`;

const buttonStyle = 'display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;';

// ============================================
// EMAIL FUNCTIONS
// ============================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();

    await transport.sendMail({
      from: `"${env.SMTP_FROM_NAME ?? 'ZapTI'}" <${env.SMTP_FROM ?? 'noreply@zapti.app'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string, companyName: string, loginUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Bem-vindo ao ${companyName} - ZapTI`,
    html: baseTemplate(`
      <h1 style="color: #1e293b; margin: 0 0 16px;">Bem-vindo, ${name}!</h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Sua conta de administrador foi criada para a empresa <strong>${companyName}</strong>.</p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Acesse o painel para começar a configurar seu atendimento WhatsApp:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="${buttonStyle}">Acessar ${companyName}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">Recomendamos:</p>
      <ul style="color: #64748b; font-size: 13px; margin: 8px 0 0; padding-left: 20px;">
        <li>Alterar sua senha no primeiro acesso</li>
        <li>Ativar a autenticação de dois fatores (2FA)</li>
        <li>Configurar seu número WhatsApp</li>
      </ul>
    `, companyName),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string, companyName: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Redefinição de senha - ${companyName}`,
    html: baseTemplate(`
      <h1 style="color: #1e293b; margin: 0 0 16px;">Redefinição de senha</h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Olá ${name}, você solicitou a redefinição de sua senha.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="${buttonStyle}">Redefinir senha</a>
      </p>
      <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Ou copie este link no navegador:</p>
      <p style="color: #3b82f6; font-size: 13px; word-break: break-all; margin: 0 0 24px;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #ef4444; font-size: 13px; margin: 0;">Este link expira em 1 hora.</p>
      <p style="color: #64748b; font-size: 13px; margin: 8px 0 0;">Se não foi você, ignore este e-mail.</p>
    `, companyName),
  });
}

export async function sendForcePasswordResetEmail(to: string, name: string, temporaryPassword: string, companyName: string, loginUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Sua senha foi redefinida - ${companyName}`,
    html: baseTemplate(`
      <h1 style="color: #1e293b; margin: 0 0 16px;">Senha redefinida pelo administrador</h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Olá ${name}, um administrador redefiniu sua senha.</p>
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #92400e; font-size: 13px;">Senha temporária:</p>
        <p style="margin: 0; font-family: monospace; font-size: 16px; font-weight: 600; color: #1e293b;">${temporaryPassword}</p>
      </div>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="${buttonStyle}">Fazer login</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #ef4444; font-size: 13px; margin: 0;">Por segurança, altere sua senha imediatamente após o login.</p>
    `, companyName),
  });
}

export async function sendInviteEmail(to: string, name: string, companyName: string, loginUrl: string, temporaryPassword: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Convite para acessar ${companyName} - ZapTI`,
    html: baseTemplate(`
      <h1 style="color: #1e293b; margin: 0 0 16px;">Você foi convidado!</h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Olá ${name}, você foi convidado para acessar o <strong>${companyName}</strong> no ZapTI.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="${buttonStyle}">Acessar ${companyName}</a>
      </p>
      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #166534; font-size: 13px;">Credenciais de acesso:</p>
        <p style="margin: 0 0 4px; font-size: 13px; color: #1e293b;"><strong>Email:</strong> ${to}</p>
        <p style="margin: 0; font-family: monospace; font-size: 14px; font-weight: 600; color: #1e293b;"><strong>Senha:</strong> ${temporaryPassword}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #ef4444; font-size: 13px; margin: 0;">Por segurança, altere sua senha no primeiro acesso.</p>
    `, companyName),
  });
}

export async function send2FASetupEmail(to: string, name: string, companyName: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Autenticação de dois fatores ativada - ${companyName}`,
    html: baseTemplate(`
      <h1 style="color: #1e293b; margin: 0 0 16px;">2FA ativado com sucesso</h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Olá ${name}, a autenticação de dois fatores foi ativada na sua conta.</p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Sua conta agora está mais segura. Guarde seus códigos de recuperação em local seguro.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">Se não foi você, entre em contato com o administrador imediatamente.</p>
    `, companyName),
  });
}

export async function sendWhatsAppDisconnectedEmail(to: string, name: string, instanceName: string, companyName: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `⚠️ WhatsApp desconectado - ${instanceName}`,
    html: baseTemplate(`
      <h1 style="color: #ef4444; margin: 0 0 16px;">WhatsApp desconectado</h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Olá ${name}, a instância <strong>${instanceName}</strong> foi desconectada.</p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Mensagens não serão recebidas até que a conexão seja restabelecida.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${env.FRONTEND_URL}/settings/whatsapp" style="${buttonStyle}">Reconectar</a>
      </p>
    `, companyName),
  });
}

export async function sendBackupStatusEmail(
  to: string,
  name: string,
  companyName: string,
  status: 'completed' | 'failed',
  backupName: string,
  error?: string
): Promise<boolean> {
  const isSuccess = status === 'completed';
  return sendEmail({
    to,
    subject: `${isSuccess ? '✅' : '❌'} Backup ${isSuccess ? 'concluído' : 'falhou'} - ${companyName}`,
    html: baseTemplate(`
      <h1 style="color: ${isSuccess ? '#22c55e' : '#ef4444'}; margin: 0 0 16px;">
        Backup ${isSuccess ? 'concluído com sucesso' : 'falhou'}
      </h1>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">Olá ${name}, o backup <strong>${backupName}</strong> ${isSuccess ? 'foi concluído' : 'falhou'}.</p>
      ${!isSuccess && error ? `
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #991b1b; font-size: 13px;">Erro:</p>
          <p style="margin: 0; font-family: monospace; font-size: 12px; color: #991b1b;">${error}</p>
        </div>
      ` : ''}
    `, companyName),
  });
}

// ============================================
// SMTP TEST
// ============================================

export async function testSmtpConnection(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const testTransport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10000,
    });

    await testTransport.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testCurrentSmtp(): Promise<{ success: boolean; error?: string }> {
  if (!env.SMTP_HOST) return { success: false, error: 'SMTP não configurado' };
  return testSmtpConnection({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false,
    user: env.SMTP_USER ?? '',
    pass: env.SMTP_PASS ?? '',
  });
}
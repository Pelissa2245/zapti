// ZapTI Shared — Notification Service
import nodemailer from 'nodemailer';

// Cooldown tracking
const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface NotificationOptions {
  type: 'decision' | 'info_needed' | 'authorization' | 'error' | 'blocked' | 'completion';
  title: string;
  summary: string;
  context: string;
  actionRequired?: string;
  options?: string[];
  deduplicationKey?: string;
}

function getDedupKey(options: NotificationOptions): string {
  return options.deduplicationKey || `${options.type}:${options.title}`;
}

function isInCooldown(key: string): boolean {
  const lastSent = cooldownMap.get(key);
  if (!lastSent) return false;
  return Date.now() - lastSent < COOLDOWN_MS;
}

function markSent(key: string): void {
  cooldownMap.set(key, Date.now());
}

// ============================================
// EMAIL TRANSPORT
// ============================================

let notificationTransporter: nodemailer.Transporter | null = null;

function getNotificationTransporter(): nodemailer.Transporter {
  if (notificationTransporter) return notificationTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER || 'matheusserver75@gmail.com';
  const pass = process.env.ZAPTI_SMTP_PASSWORD;

  if (!pass) {
    throw new Error('ZAPTI_SMTP_PASSWORD environment variable not set');
  }

  notificationTransporter = nodemailer.createTransport({
    host,
    port,
    secure: true, // true for 465 (SSL/TLS)
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });

  return notificationTransporter;
}

// ============================================
// NOTIFICATION EMAIL TEMPLATE
// ============================================

const notificationTemplate = (options: NotificationOptions) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 style="color: #1e293b; margin: 0; font-size: 20px;">${options.title}</h1>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Tipo:</strong> ${getTypeLabel(options.type)}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Resumo</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0;">${options.summary}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Contexto</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${options.context}</p>
        </div>

        ${options.actionRequired ? `
        <div style="margin-bottom: 24px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #1e40af; font-size: 16px; margin: 0 0 8px;">Ação Necessária</h2>
          <p style="color: #1e40af; margin: 0;">${options.actionRequired}</p>
        </div>
        ` : ''}

        ${options.options && options.options.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h2 style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Opções</h2>
          <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
            ${options.options.map(opt => `<li>${opt}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">ZapTI - Sistema de Notificações Automáticas</p>
        <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0;">Este e-mail foi enviado automaticamente. Não responda diretamente.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    decision: '🤔 Decisão Necessária',
    info_needed: '📋 Informação Necessária',
    authorization: '🔐 Autorização Necessária',
    error: '❌ Erro Bloqueante',
    blocked: '⏳ Aguardando Intervenção',
    completion: '✅ Tarefa Concluída',
  };
  return labels[type] || type;
}

// ============================================
// MAIN NOTIFICATION FUNCTION
// ============================================

export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  const dedupKey = getDedupKey(options);

  // Check cooldown
  if (isInCooldown(dedupKey)) {
    console.log(`[Notification] Cooldown ativo para: ${dedupKey}`);
    return false;
  }

  try {
    const transporter = getNotificationTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'matheusserver75@gmail.com';
    const to = process.env.NOTIFICATION_EMAIL_TO || 'matheus.b.pelissari@gmail.com';

    await transporter.sendMail({
      from,
      to,
      subject: `[ZapTi] Atenção necessária: ${options.title}`,
      html: notificationTemplate(options),
    });

    markSent(dedupKey);
    console.log(`[Notification] E-mail enviado: ${options.title}`);
    return true;
  } catch (error) {
    console.error('[Notification] Falha ao enviar e-mail:', error);
    return false;
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function notifyDecision(
  title: string,
  summary: string,
  context: string,
  options: string[],
  dedupKey?: string
): Promise<boolean> {
  return sendNotification({
    type: 'decision',
    title,
    summary,
    context,
    options,
    actionRequired: `Responda no terminal com uma das opções: ${options.join(', ')}`,
    deduplicationKey: dedupKey,
  });
}

export async function notifyInfoNeeded(
  title: string,
  summary: string,
  context: string,
  infoNeeded: string,
  dedupKey?: string
): Promise<boolean> {
  return sendNotification({
    type: 'info_needed',
    title,
    summary,
    context,
    actionRequired: `Forneça: ${infoNeeded}`,
    deduplicationKey: dedupKey,
  });
}

export async function notifyAuthorization(
  title: string,
  summary: string,
  context: string,
  action: string,
  dedupKey?: string
): Promise<boolean> {
  return sendNotification({
    type: 'authorization',
    title,
    summary,
    context,
    actionRequired: `Confirme para prosseguir com: ${action}`,
    deduplicationKey: dedupKey,
  });
}

export async function notifyError(
  title: string,
  summary: string,
  context: string,
  dedupKey?: string
): Promise<boolean> {
  return sendNotification({
    type: 'error',
    title,
    summary,
    context,
    actionRequired: 'Intervenção necessária para resolver o erro',
    deduplicationKey: dedupKey,
  });
}

export async function notifyBlocked(
  title: string,
  summary: string,
  context: string,
  waitingFor: string,
  dedupKey?: string
): Promise<boolean> {
  return sendNotification({
    type: 'blocked',
    title,
    summary,
    context,
    actionRequired: `Aguardando: ${waitingFor}`,
    deduplicationKey: dedupKey,
  });
}

export async function notifyCompletion(
  title: string,
  summary: string,
  context: string,
  dedupKey?: string
): Promise<boolean> {
  return sendNotification({
    type: 'completion',
    title,
    summary,
    context,
    deduplicationKey: dedupKey,
  });
}

// ============================================
// TEST FUNCTION
// ============================================

export async function testNotification(): Promise<boolean> {
  return sendNotification({
    type: 'completion',
    title: 'Teste de Notificação',
    summary: 'Teste do sistema de notificações por e-mail',
    context: 'Este é um e-mail de teste para verificar se o sistema de notificações SMTP está funcionando corretamente.',
  });
}
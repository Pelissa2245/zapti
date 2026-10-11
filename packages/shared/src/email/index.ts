import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { config } from '../config/index.js';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: SendMailOptions['attachments'];
}

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const cfg = config();

  if (!cfg.SMTP_HOST || !cfg.SMTP_PORT || !cfg.SMTP_USER || !cfg.SMTP_PASS || !cfg.SMTP_FROM) {
    throw new Error('SMTP configuration not complete');
  }

  transporter = nodemailer.createTransport({
    host: cfg.SMTP_HOST,
    port: cfg.SMTP_PORT,
    secure: cfg.SMTP_PORT === 465,
    auth: {
      user: cfg.SMTP_USER,
      pass: cfg.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getTransporter();
    const cfg = config();

    const info = await transporter.sendMail({
      from: cfg.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string, loginUrl: string) => ({
    subject: 'Bem-vindo ao ZapTI!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Bem-vindo ao ZapTI, ${name}!</h1>
        <p>Sua conta foi criada com sucesso. Clique no botão abaixo para acessar sua conta:</p>
        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">Acessar ZapTI</a>
        <p style="margin-top: 24px; color: #666;">Se você não criou esta conta, por favor ignore este email.</p>
      </div>
    `,
    text: `Bem-vindo ao ZapTI, ${name}! Acesse sua conta em: ${loginUrl}`,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Redefinição de senha - ZapTI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Redefinição de senha</h1>
        <p>Olá ${name},</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">Redefinir senha</a>
        <p style="margin-top: 24px; color: #666;">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
    text: `Redefinição de senha para ${name}. Acesse: ${resetUrl} (expira em 1 hora)`,
  }),

  conversationAssigned: (agentName: string, contactName: string, conversationUrl: string) => ({
    subject: 'Nova conversa atribuída - ZapTI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Nova conversa atribuída</h1>
        <p>Olá ${agentName},</p>
        <p>Uma nova conversa com <strong>${contactName}</strong> foi atribuída a você.</p>
        <a href="${conversationUrl}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">Ver conversa</a>
      </div>
    `,
    text: `Nova conversa atribuída a ${agentName} com ${contactName}. Acesse: ${conversationUrl}`,
  }),

  ticketAssigned: (agentName: string, ticketTitle: string, ticketUrl: string) => ({
    subject: 'Novo ticket atribuído - ZapTI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Novo ticket atribuído</h1>
        <p>Olá ${agentName},</p>
        <p>Um novo ticket <strong>${ticketTitle}</strong> foi atribuído a você.</p>
        <a href="${ticketUrl}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">Ver ticket</a>
      </div>
    `,
    text: `Novo ticket atribuído a ${agentName}: ${ticketTitle}. Acesse: ${ticketUrl}`,
  }),

  notification: (title: string, message: string, actionUrl?: string) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">${title}</h1>
        <p>${message}</p>
        ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">Ver detalhes</a>` : ''}
      </div>
    `,
    text: `${title}\n\n${message}\n\n${actionUrl || ''}`,
  }),
};
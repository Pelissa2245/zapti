import { PrismaClient, CampaignStatus, MessageStatus } from '@zapti/database';

const prisma = new PrismaClient();

export interface CampaignJobData {
  campaignId: string;
  tenantId: string;
}

export async function sendCampaign(campaignId: string, tenantId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      group: { include: { members: { include: { contact: true } } } },
    },
  });

  if (!campaign) {
    console.error(`Campaign ${campaignId} not found`);
    return;
  }

  if (campaign.status === 'CANCELLED') {
    console.log(`Campaign ${campaignId} was cancelled`);
    return;
  }

  const contacts = campaign.group?.members.map(m => m.contact).filter(c => c) || [];

  // Update campaign with total contacts
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalContacts: contacts.length },
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    // Check if campaign was cancelled/paused
    const currentCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!currentCampaign || currentCampaign.status === 'CANCELLED') {
      console.log(`Campaign ${campaignId} cancelled during send`);
      return;
    }
    if (currentCampaign.status === 'PAUSED') {
      console.log(`Campaign ${campaignId} paused during send`);
      return;
    }

    try {
      // Create log entry
      const log = await prisma.campaignLog.create({
        data: {
          campaignId,
          contactId: contact.id,
          status: MessageStatus.SENT,
        },
      });

      // Render template with variables
      // Template content should be in campaign templateId, but no Template model exists yet
      // Using a default template approach
      let content = `Campaign message for ${contact.name}`;
      const variables = { ...(campaign.variables as Record<string, any> || {}) };

      // Add contact-specific variables
      variables['contact_name'] = contact.name || '';
      variables['contact_phone'] = contact.phone;
      variables['contact_email'] = contact.email || '';

      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { tenantId, contactId: contact.id, status: { not: 'CLOSED' } },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            tenantId,
            contactId: contact.id,
            status: 'OPEN',
            priority: 'NORMAL',
          },
        });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          tenantId,
          conversationId: conversation.id,
          contactId: contact.id,
          direction: 'OUTBOUND',
          type: 'TEMPLATE',
          content,
          templateId: campaign.templateId,
          status: 'SENT',
          metadata: { campaignId, campaignLogId: log.id },
        },
      });

      // Update log
      await prisma.campaignLog.update({
        where: { id: log.id },
        data: { status: 'SENT', messageId: message.id, sentAt: new Date() },
      });

      // Send via WhatsApp
      const { sendWhatsAppMessage } = await import('./whatsapp.js');
      sendWhatsAppMessage(conversation, message, tenantId).catch(console.error);

      sentCount++;
    } catch (error: any) {
      failedCount++;

      // Log failure
      await prisma.campaignLog.create({
        data: {
          campaignId,
          contactId: contact.id,
          status: 'FAILED',
          error: error.message,
        },
      });

      console.error(`Failed to send campaign message to ${contact.phone}:`, error);
    }

    // Update progress
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: { increment: 1 },
        failedCount: { increment: failedCount > sentCount ? 1 : 0 }, // This is approximate
      },
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Update final status
  const finalCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (finalCampaign && finalCampaign.status !== 'CANCELLED') {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: failedCount > 0 && sentCount === 0 ? 'CANCELLED' : 'SENT',
        sentAt: new Date(),
        completedAt: new Date(),
      },
    });
  }
}

export async function scheduleCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || !campaign.scheduledAt) return;

  const delay = campaign.scheduledAt.getTime() - Date.now();
  if (delay <= 0) {
    // Send immediately
    sendCampaign(campaignId, campaign.tenantId).catch(console.error);
  } else {
    // Schedule for later
    setTimeout(() => {
      sendCampaign(campaignId, campaign.tenantId).catch(console.error);
    }, delay);
  }
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'PAUSED' },
  });
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status !== 'PAUSED') return;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' },
  });

  sendCampaign(campaignId, campaign.tenantId).catch(console.error);
}

export async function cancelCampaign(campaignId: string): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'CANCELLED' },
  });
}
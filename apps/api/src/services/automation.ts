import { PrismaClient, AutomationTrigger } from '@prisma/client';

const prisma = new PrismaClient();

export type { AutomationTrigger };

export interface AutomationContext {
  trigger: AutomationTrigger;
  triggerData: any;
  tenantId: string;
}

export async function triggerAutomations(
  trigger: AutomationTrigger,
  triggerData: any,
  tenantId: string
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      tenantId,
      trigger,
      isActive: true,
    },
  });

  for (const automation of automations) {
    await executeAutomation(automation.id, tenantId, triggerData);
  }
}

export async function executeAutomation(
  automationId: string,
  tenantId: string,
  triggerData: any
): Promise<void> {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
  });

  if (!automation || !automation.isActive) {
    console.log(`Automation ${automationId} not found or inactive`);
    return;
  }

  // Check conditions
  if (!evaluateConditions(automation.conditions as any, triggerData)) {
    console.log(`Automation ${automationId} conditions not met`);
    return;
  }

  // Create execution record
  const execution = await prisma.automationExecution.create({
    data: {
      automationId,
      trigger: automation.trigger,
      triggerData,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    // Execute actions
    for (const action of automation.actions as any[]) {
      await executeAction(action, { trigger: automation.trigger, triggerData, tenantId });
    }

    // Mark success
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: 'SUCCESS', completedAt: new Date() },
    });
  } catch (error: any) {
    console.error(`Automation ${automationId} execution failed:`, error);

    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', error: error.message, completedAt: new Date() },
    });
  }
}

function evaluateConditions(conditions: any, triggerData: any): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Simple condition evaluation
  for (const [key, expectedValue] of Object.entries(conditions)) {
    const actualValue = triggerData[key];

    if (typeof expectedValue === 'object' && expectedValue !== null) {
      // Handle operators like $eq, $ne, $in, $gt, $lt, etc.
      for (const [operator, value] of Object.entries(expectedValue)) {
        if (!evaluateOperator(actualValue, operator, value)) {
          return false;
        }
      }
    } else {
      // Simple equality
      if (actualValue !== expectedValue) {
        return false;
      }
    }
  }

  return true;
}

function evaluateOperator(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case '$eq': return actual === expected;
    case '$ne': return actual !== expected;
    case '$in': return Array.isArray(expected) && expected.includes(actual);
    case '$nin': return Array.isArray(expected) && !expected.includes(actual);
    case '$gt': return actual > expected;
    case '$gte': return actual >= expected;
    case '$lt': return actual < expected;
    case '$lte': return actual <= expected;
    case '$contains': return String(actual).includes(String(expected));
    case '$startsWith': return String(actual).startsWith(String(expected));
    case '$endsWith': return String(actual).endsWith(String(expected));
    case '$regex': return new RegExp(expected).test(String(actual));
    default: return false;
  }
}

async function executeAction(action: { type: string; config: any }, context: AutomationContext): Promise<void> {
  switch (action.type) {
    case 'SEND_MESSAGE':
      await executeSendMessage(action.config, context);
      break;
    case 'CREATE_TICKET':
      await executeCreateTicket(action.config, context);
      break;
    case 'ASSIGN_CONVERSATION':
      await executeAssignConversation(action.config, context);
      break;
    case 'ADD_TAG':
      await executeAddTag(action.config, context);
      break;
    case 'UPDATE_CONTACT':
      await executeUpdateContact(action.config, context);
      break;
    case 'WEBHOOK':
      await executeWebhook(action.config, context);
      break;
    case 'DELAY':
      await executeDelay(action.config);
      break;
    case 'CONDITION':
      await executeCondition(action.config, context);
      break;
    default:
      console.warn(`Unknown automation action: ${action.type}`);
  }
}

async function executeSendMessage(config: any, context: AutomationContext): Promise<void> {
  const { conversationId, contactId, templateId, content, variables } = config;

  let contentToSend = content;
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      contentToSend = contentToSend.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
  }

  if (templateId) {
    // Template message - use content from config if templateId provided but no template model exists
    // In a real implementation, you might fetch from external template service
    console.log(`Template ${templateId} referenced but no template model exists`);
  }

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: context.tenantId },
      include: { contact: true },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          tenantId: context.tenantId,
          conversationId: conversation.id,
          contactId: conversation.contactId,
          direction: 'OUTBOUND',
          type: templateId ? 'TEMPLATE' : 'TEXT',
          content: contentToSend,
          templateId,
          status: 'SENT',
          metadata: { automationId: context.triggerData.automationId },
        },
      });

      const { sendWhatsAppMessage } = await import('./whatsapp.js');
      sendWhatsAppMessage(conversation, message, context.tenantId).catch(console.error);
    }
  }
}

async function executeCreateTicket(config: any, context: AutomationContext): Promise<void> {
  const { title, description, priority, conversationId, assignedToId } = config;

  if (!conversationId) {
    console.warn('No conversationId found for ticket creation');
    return;
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, tenantId: context.tenantId },
  });

  if (!conversation) {
    console.warn('Conversation not found for ticket creation');
    return;
  }

  await prisma.ticket.create({
    data: {
      tenantId: context.tenantId,
      title: title || 'Automated Ticket',
      description: description || '',
      priority: priority || 'NORMAL',
      conversationId: conversation.id,
      assignedToId,
      createdById: context.triggerData.userId || conversation.contactId,
    },
  });
}

async function executeAssignConversation(config: any, context: AutomationContext): Promise<void> {
  const { conversationId, agentId } = config;

  if (!conversationId || !agentId) return;

  const agent = await prisma.user.findFirst({
    where: { id: agentId, tenantId: context.tenantId, isActive: true },
  });

  if (!agent) {
    console.warn(`Agent ${agentId} not found or inactive`);
    return;
  }

  await prisma.conversation.update({
    where: { id: conversationId, tenantId: context.tenantId },
    data: { assignedToId: agent.id, status: 'OPEN' },
  });
}

async function executeAddTag(config: any, context: AutomationContext): Promise<void> {
  const { entityType, entityId, tag } = config;

  if (entityType === 'contact' && entityId) {
    const contact = await prisma.contact.findFirst({
      where: { id: entityId, tenantId: context.tenantId },
    });
    if (contact) {
      const tags = contact.tags || [];
      if (!tags.includes(tag)) {
        tags.push(tag);
        await prisma.contact.update({
          where: { id: entityId },
          data: { tags },
        });
      }
    }
  }
}

async function executeUpdateContact(config: any, context: AutomationContext): Promise<void> {
  const { contactId, updates } = config;

  if (!contactId) return;

  await prisma.contact.update({
    where: { id: contactId, tenantId: context.tenantId },
    data: updates,
  });
}

async function executeWebhook(config: any, context: AutomationContext): Promise<void> {
  const { url, method = 'POST', headers = {}, body } = config;

  const payload = {
    ...body,
    trigger: context.trigger,
    triggerData: context.triggerData,
    timestamp: new Date().toISOString(),
  };

  await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
}

async function executeDelay(config: any): Promise<void> {
  const { milliseconds = 1000 } = config;
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function executeCondition(config: any, context: AutomationContext): Promise<void> {
  // This would be used for branching logic in complex automations
  // For now, we just evaluate and continue if true
  const { conditions, actionsIfTrue, actionsIfFalse } = config;

  const result = evaluateConditions(conditions, context.triggerData);

  const actionsToExecute = result ? actionsIfTrue : actionsIfFalse;

  if (actionsToExecute) {
    for (const action of actionsToExecute) {
      await executeAction(action, context);
    }
  }
}
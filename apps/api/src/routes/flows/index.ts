// ZapTI API — Flow Routes (Visual Automation Builder)
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const createFlowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  triggerType: z.enum(['MESSAGE_RECEIVED', 'CONVERSATION_STARTED', 'CONVERSATION_CLOSED', 'TICKET_CREATED', 'CONTACT_CREATED', 'SCHEDULED', 'WEBHOOK', 'MANUAL']),
  triggerConfig: z.record(z.any()).default({}),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['START', 'CONDITION', 'ACTION', 'DELAY', 'WEBHOOK', 'SPLIT', 'MERGE', 'END']),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.any()),
  })).default([]),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    condition: z.string().optional(),
  })).default([]),
  isActive: z.boolean().default(false),
});

const createFlowSchemaJson = toJsonSchema(createFlowSchema);

const updateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  triggerType: z.enum(['MESSAGE_RECEIVED', 'CONVERSATION_STARTED', 'CONVERSATION_CLOSED', 'TICKET_CREATED', 'CONTACT_CREATED', 'SCHEDULED', 'WEBHOOK', 'MANUAL']).optional(),
  triggerConfig: z.record(z.any()).optional(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['START', 'CONDITION', 'ACTION', 'DELAY', 'WEBHOOK', 'SPLIT', 'MERGE', 'END']),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.any()),
  })).optional(),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    condition: z.string().optional(),
  })).optional(),
  isActive: z.boolean().optional(),
  version: z.number().optional(),
});

const updateFlowSchemaJson = toJsonSchema(updateFlowSchema);

const listFlowsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  triggerType: z.enum(['MESSAGE_RECEIVED', 'CONVERSATION_STARTED', 'CONVERSATION_CLOSED', 'TICKET_CREATED', 'CONTACT_CREATED', 'SCHEDULED', 'WEBHOOK', 'MANUAL']).optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

const listFlowsQuerySchemaJson = toJsonSchema(listFlowsQuerySchema);

const executeFlowSchema = z.object({
  conversationId: z.string().optional(),
  contactId: z.string().optional(),
  ticketId: z.string().optional(),
  variables: z.record(z.any()).default({}),
});

const executeFlowSchemaJson = toJsonSchema(executeFlowSchema);

export async function flowRoutes(app: FastifyInstance) {
  // GET /flows - List flows
  app.get('/', {
    preHandler: [app.requirePermission('flows:read')],
    schema: { querystring: listFlowsQuerySchemaJson },
  }, async (request) => {
    const { page, limit, triggerType, isActive, q } = request.query as z.infer<typeof listFlowsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (triggerType) where.triggerType = triggerType;
    if (isActive !== undefined) where.isActive = isActive;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [flows, total] = await Promise.all([
      prisma.flow.findMany({
        where,
        include: {
          _count: { select: { executions: true } },
          creator: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.flow.count({ where }),
    ]);

    return { data: flows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /flows/stats - Flow statistics
  app.get('/stats', { preHandler: [app.requirePermission('flows:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const [total, active, totalExecutions, successfulExecutions, failedExecutions, byTrigger] = await Promise.all([
      prisma.flow.count({ where: { tenantId } }),
      prisma.flow.count({ where: { tenantId, isActive: true } }),
      prisma.flowExecution.count({ where: { flow: { tenantId } } }),
      prisma.flowExecution.count({ where: { flow: { tenantId }, status: 'COMPLETED' } }),
      prisma.flowExecution.count({ where: { flow: { tenantId }, status: 'FAILED' } }),
      prisma.flow.groupBy({ by: ['triggerType'], where: { tenantId }, _count: true }),
    ]);

    return {
      stats: {
        total,
        active,
        inactive: total - active,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
        byTrigger: byTrigger.map((t) => ({ trigger: t.triggerType, count: t._count })),
      },
    };
  });

  // GET /flows/:id - Get flow details
  app.get('/:id', { preHandler: [app.requirePermission('flows:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const flow = await prisma.flow.findFirst({
      where: { id, tenantId },
      include: {
        creator: { select: { id: true, name: true } },
        executions: { orderBy: { startedAt: 'desc' }, take: 20 },
      },
    });

    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    return { flow };
  });

  // POST /flows - Create flow
  app.post('/', {
    preHandler: [app.requirePermission('flows:create')],
    schema: { body: createFlowSchemaJson },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof createFlowSchema>;
    const { name, description, triggerType, triggerConfig, nodes, edges, isActive } = body;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    // Validate flow structure
    const validation = validateFlow(nodes, edges);
    if (!validation.valid) {
      return reply.status(400).send({ error: { code: 'INVALID_FLOW', message: validation.error } });
    }

    const flow = await prisma.flow.create({
      data: {
        tenantId,
        name,
        description,
        triggerType,
        triggerConfig: JSON.stringify(triggerConfig),
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        isActive,
        version: 1,
        createdBy: userId,
      },
    });

    await logAudit(request, 'FLOW_CREATED', { flowId: flow.id, name });

    return reply.status(201).send({ flow });
  });

  // PATCH /flows/:id - Update flow
  app.patch('/:id', {
    preHandler: [app.requirePermission('flows:update')],
    schema: { body: updateFlowSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    const body = request.body as z.infer<typeof updateFlowSchema>;

    // Validate if nodes/edges provided
    if (body.nodes || body.edges) {
      const nodes = body.nodes || JSON.parse(flow.nodes);
      const edges = body.edges || JSON.parse(flow.edges);
      const validation = validateFlow(nodes, edges);
      if (!validation.valid) {
        return reply.status(400).send({ error: { code: 'INVALID_FLOW', message: validation.error } });
      }
    }

    const updateData: any = { ...body };
    // Remove fields that don't exist in the update input
    delete updateData.createdBy;
    delete updateData.updatedBy;
    // Stringify JSON fields if present
    if (updateData.triggerConfig !== undefined) {
      updateData.triggerConfig = JSON.stringify(updateData.triggerConfig);
    }
    if (updateData.nodes !== undefined) {
      updateData.nodes = JSON.stringify(updateData.nodes);
    }
    if (updateData.edges !== undefined) {
      updateData.edges = JSON.stringify(updateData.edges);
    }
    // Optimistic locking
    if (body.version !== undefined) {
      if (body.version !== flow.version) {
        return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Flow foi modificado por outro usuário' } });
      }
      updateData.version = flow.version + 1;
    }

    const updated = await prisma.flow.update({ where: { id }, data: updateData });

    await logAudit(request, 'FLOW_UPDATED', { flowId: id, changes: Object.keys(body) });

    return { flow: updated };
  });

  // POST /flows/:id/duplicate - Duplicate flow
  app.post('/:id/duplicate', { preHandler: [app.requirePermission('flows:create')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    const duplicated = await prisma.flow.create({
      data: {
        tenantId,
        name: `${flow.name} (Cópia)`,
        description: flow.description,
        triggerType: flow.triggerType,
        triggerConfig: flow.triggerConfig,
        nodes: flow.nodes,
        edges: flow.edges,
        isActive: false,
        version: 1,
        createdBy: userId,
      },
    });

    await logAudit(request, 'FLOW_DUPLICATED', { flowId: id, newFlowId: duplicated.id });

    return reply.status(201).send({ flow: duplicated });
  });

  // POST /flows/:id/activate - Activate flow
  app.post('/:id/activate', { preHandler: [app.requirePermission('flows:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    // Validate flow before activating
    const validation = validateFlow(JSON.parse(flow.nodes), JSON.parse(flow.edges));
    if (!validation.valid) {
      return reply.status(400).send({ error: { code: 'INVALID_FLOW', message: `Não pode ativar: ${validation.error}` } });
    }

    // Check for other active flows with same trigger
    if (flow.triggerType !== 'MANUAL' && flow.triggerType !== 'WEBHOOK') {
      const existing = await prisma.flow.findFirst({
        where: { tenantId, triggerType: flow.triggerType, isActive: true, id: { not: id } },
      });
      if (existing) {
        return reply.status(400).send({ error: { code: 'TRIGGER_CONFLICT', message: `Já existe um flow ativo para ${flow.triggerType}` } });
      }
    }

    const updated = await prisma.flow.update({ where: { id }, data: { isActive: true } });

    await logAudit(request, 'FLOW_ACTIVATED', { flowId: id });

    return { flow: updated };
  });

  // POST /flows/:id/deactivate - Deactivate flow
  app.post('/:id/deactivate', { preHandler: [app.requirePermission('flows:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    const updated = await prisma.flow.update({ where: { id }, data: { isActive: false } });

    await logAudit(request, 'FLOW_DEACTIVATED', { flowId: id });

    return { flow: updated };
  });

  // POST /flows/:id/execute - Execute flow manually
  app.post('/:id/execute', {
    preHandler: [app.requirePermission('flows:execute')],
    schema: { body: executeFlowSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { conversationId?: string; contactId?: string; ticketId?: string; variables?: Record<string, any> };
    const { conversationId, contactId, ticketId, variables } = body;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    if (!flow.isActive && flow.triggerType !== 'MANUAL') {
      return reply.status(400).send({ error: { code: 'FLOW_INACTIVE', message: 'Flow não está ativo' } });
    }

    // Create execution record
    const execution = await prisma.flowExecution.create({
      data: {
        flowId: id,
        tenantId,
        triggerData: JSON.stringify({ conversationId, contactId, ticketId }),
        status: 'RUNNING',
        context: JSON.stringify(variables || {}),
        startedAt: new Date(),
      },
    });

    // Execute flow asynchronously
    executeFlowAsync(flow, execution, variables || {}, app).catch(console.error);

    await logAudit(request, 'FLOW_EXECUTED', { flowId: id, executionId: execution.id });

    return reply.status(202).send({ executionId: execution.id, status: 'RUNNING' });
  });

  // GET /flows/:id/executions - List flow executions
  app.get('/:id/executions', { preHandler: [app.requirePermission('flows:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = 1, limit = 20, status } = request.query as { page?: string; limit?: string; status?: string };
    const tenantId = request.tenant!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    const where: any = { flowId: id };
    if (status) where.status = status;

    const [executions, total] = await Promise.all([
      prisma.flowExecution.findMany({
        where,
        include: { steps: { orderBy: { startedAt: 'asc' } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { startedAt: 'desc' },
      }),
      prisma.flowExecution.count({ where }),
    ]);

    return { data: executions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  });

  // GET /flows/:id/executions/:executionId - Get execution details
  app.get('/:id/executions/:executionId', { preHandler: [app.requirePermission('flows:read')] }, async (request, reply) => {
    const { id, executionId } = request.params as { id: string; executionId: string };
    const tenantId = request.tenant!.id;

    const execution = await prisma.flowExecution.findFirst({
      where: { id: executionId, flowId: id, tenantId },
      include: { steps: { orderBy: { startedAt: 'asc' } } },
    });

    if (!execution) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Execução não encontrada' } });
    }

    return { execution };
  });

  // DELETE /flows/:id - Delete flow
  app.delete('/:id', { preHandler: [app.requirePermission('flows:delete')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const flow = await prisma.flow.findFirst({ where: { id, tenantId } });
    if (!flow) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Flow não encontrado' } });
    }

    if (flow.isActive) {
      return reply.status(400).send({ error: { code: 'FLOW_ACTIVE', message: 'Desative o flow antes de deletar' } });
    }

    await prisma.flow.delete({ where: { id } });

    await logAudit(request, 'FLOW_DELETED', { flowId: id });

    return { message: 'Flow deletado' };
  });

  // GET /flows/templates - Get flow templates
  app.get('/templates', { preHandler: [app.requirePermission('flows:read')] }, async (request) => {
    // Return predefined templates
    const templates = [
      {
        id: 'welcome',
        name: 'Boas-vindas Automática',
        description: 'Envia mensagem de boas-vindas quando nova conversa inicia',
        trigger: 'CONVERSATION_STARTED',
        nodes: [
          { id: 'start', type: 'START', position: { x: 100, y: 100 }, data: {} },
          { id: 'send', type: 'ACTION', position: { x: 300, y: 100 }, data: { action: 'SEND_MESSAGE', config: { type: 'TEXT', content: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudar?' } } },
          { id: 'end', type: 'END', position: { x: 500, y: 100 }, data: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'send' },
          { id: 'e2', source: 'send', target: 'end' },
        ],
      },
      {
        id: 'auto-reply',
        name: 'Resposta Automática Fora de Horário',
        description: 'Responde automaticamente fora do horário comercial',
        trigger: 'MESSAGE_RECEIVED',
        nodes: [
          { id: 'start', type: 'START', position: { x: 100, y: 100 }, data: {} },
          { id: 'check', type: 'CONDITION', position: { x: 300, y: 100 }, data: { condition: 'isBusinessHours', config: { timezone: 'America/Sao_Paulo' } } },
          { id: 'send', type: 'ACTION', position: { x: 500, y: 50 }, data: { action: 'SEND_MESSAGE', config: { type: 'TEXT', content: 'Nosso horário de atendimento é das 9h às 18h. Responderemos assim que possível.' } } },
          { id: 'end', type: 'END', position: { x: 700, y: 100 }, data: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'check' },
          { id: 'e2', source: 'check', target: 'send', condition: 'false' },
          { id: 'e3', source: 'check', target: 'end', condition: 'true' },
          { id: 'e4', source: 'send', target: 'end' },
        ],
      },
    ];

    return { templates };
  });
}

function validateFlow(nodes: any[], edges: any[]): { valid: boolean; error?: string } {
  // Check for start node
  const startNodes = nodes.filter((n) => n.type === 'START');
  if (startNodes.length !== 1) {
    return { valid: false, error: 'Flow deve ter exatamente um nó de início' };
  }

  // Check for end node
  const endNodes = nodes.filter((n) => n.type === 'END');
  if (endNodes.length === 0) {
    return { valid: false, error: 'Flow deve ter pelo menos um nó de fim' };
  }

  // Check for orphan nodes
  const connectedNodes = new Set<string>();
  edges.forEach((e) => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });
  connectedNodes.add(startNodes[0].id);

  const orphanNodes = nodes.filter((n) => !connectedNodes.has(n.id) && n.type !== 'END');
  if (orphanNodes.length > 0) {
    return { valid: false, error: `Nós não conectados: ${orphanNodes.map((n) => n.id).join(', ')}` };
  }

  // Check for cycles (simple check)
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) return true;
    }

    recStack.delete(nodeId);
    return false;
  }

  if (hasCycle(startNodes[0].id)) {
    return { valid: false, error: 'Flow contém ciclos infinitos' };
  }

  return { valid: true };
}

async function executeFlowAsync(flow: { id: string; name: string; tenantId: string; nodes: string; edges: string; triggerType: string }, execution: any, variables: Record<string, any>, app: FastifyInstance) {
  try {
    const tenantId = flow.tenantId;
    const nodes = JSON.parse(flow.nodes) as Array<{ id: string; type: string; data: any }>;
    const edges = JSON.parse(flow.edges) as Array<{ source: string; target: string; condition?: string }>;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edgeMap = new Map<string, any[]>();

    edges.forEach((e) => {
      if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
      edgeMap.get(e.source)!.push(e);
    });

    let currentNodeId = nodes.find((n: any) => n.type === 'START')!.id;
    const executionVariables = { ...variables, flow: { id: flow.id, name: flow.name } };
    const executedNodes: string[] = [];

    while (currentNodeId) {
      const node = nodeMap.get(currentNodeId);
      if (!node) break;

      executedNodes.push(currentNodeId);

      // Log node execution
      await prisma.flowExecutionStep.create({
        data: { executionId: execution.id, nodeId: currentNodeId, nodeType: node.type, input: JSON.stringify(executionVariables), status: 'RUNNING' },
      });

      let nextNodeId: string | null = null;
      let nodeOutput: any = {};

      switch (node.type) {
        case 'START':
          nextNodeId = getNextNode(currentNodeId, edgeMap, executionVariables);
          break;

        case 'CONDITION':
          const conditionResult = evaluateCondition(node.data.config, executionVariables);
          nextNodeId = getNextNode(currentNodeId, edgeMap, executionVariables, conditionResult);
          nodeOutput = { conditionResult };
          break;

        case 'ACTION':
          nodeOutput = await executeAction(node.data.config, executionVariables, tenantId, app);
          nextNodeId = getNextNode(currentNodeId, edgeMap, executionVariables);
          break;

        case 'DELAY':
          const delayMs = node.data.config.ms || node.data.config.seconds * 1000 || node.data.config.minutes * 60000 || 0;
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
          nextNodeId = getNextNode(currentNodeId, edgeMap, executionVariables);
          break;

        case 'WEBHOOK':
          nodeOutput = await executeWebhook(node.data.config, executionVariables);
          nextNodeId = getNextNode(currentNodeId, edgeMap, executionVariables);
          break;

        case 'SPLIT':
          // Execute all branches in parallel
          const branches = edgeMap.get(currentNodeId) || [];
          for (const branch of branches) {
            executeBranch(branch.target, nodeMap, edgeMap, executionVariables, execution.id, app).catch(console.error);
          }
          // Continue with first branch
          nextNodeId = branches[0]?.target || null;
          break;

        case 'MERGE':
          nextNodeId = getNextNode(currentNodeId, edgeMap, executionVariables);
          break;

        case 'END':
          nextNodeId = null;
          break;
      }

      // Update log
      await prisma.flowExecutionStep.updateMany({
        where: { executionId: execution.id, nodeId: currentNodeId },
        data: { status: 'COMPLETED', output: JSON.stringify(nodeOutput), completedAt: new Date() },
      });

      currentNodeId = nextNodeId ?? '';

      // Safety check for infinite loops
      if (executedNodes.length > 1000) {
        throw new Error('Limite de execução excedido (possível loop infinito)');
      }
    }

    // Update execution status
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: { status: 'COMPLETED', completedAt: new Date(), context: JSON.stringify(executionVariables) },
    });
  } catch (error: any) {
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', error: error.message, completedAt: new Date(), context: JSON.stringify(variables) },
    });
  }
}

async function executeBranch(nodeId: string, nodeMap: Map<string, { id: string; type: string; data: any }>, edgeMap: Map<string, any[]>, variables: Record<string, any>, executionId: string, app: FastifyInstance) {
  let currentNodeId = nodeId;
  const localVariables = { ...variables };
  const executedNodes: string[] = [];

  while (currentNodeId) {
    const node = nodeMap.get(currentNodeId);
    if (!node) break;

    executedNodes.push(currentNodeId);

    await prisma.flowExecutionStep.create({
      data: { executionId, nodeId: currentNodeId, nodeType: node.type, input: JSON.stringify(localVariables), status: 'RUNNING' },
    });

    let nextNodeId: string | null = null;
    let nodeOutput: any = {};

    switch (node.type) {
      case 'CONDITION':
        const conditionResult = evaluateCondition(node.data.config, localVariables);
        nextNodeId = getNextNode(currentNodeId, edgeMap, localVariables, conditionResult);
        nodeOutput = { conditionResult };
        break;

      case 'ACTION':
        nodeOutput = await executeAction(node.data.config, localVariables, nodeMap.get(currentNodeId)?.data?.tenantId || '', app);
        nextNodeId = getNextNode(currentNodeId, edgeMap, localVariables);
        break;

      case 'DELAY':
        const delayMs = node.data.config.ms || node.data.config.seconds * 1000 || node.data.config.minutes * 60000 || 0;
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
        nextNodeId = getNextNode(currentNodeId, edgeMap, localVariables);
        break;

      case 'WEBHOOK':
        nodeOutput = await executeWebhook(node.data.config, localVariables);
        nextNodeId = getNextNode(currentNodeId, edgeMap, localVariables);
        break;

      case 'END':
        nextNodeId = null;
        break;

      default:
        nextNodeId = getNextNode(currentNodeId, edgeMap, localVariables);
    }

    await prisma.flowExecutionStep.updateMany({
      where: { executionId, nodeId: currentNodeId },
      data: { status: 'COMPLETED', output: JSON.stringify(nodeOutput), completedAt: new Date() },
    });

    currentNodeId = nextNodeId ?? '';
    if (executedNodes.length > 1000) break;
  }
}

function getNextNode(currentId: string, edgeMap: Map<string, any[]>, variables: Record<string, any>, conditionResult?: boolean): string | null {
  const edges = edgeMap.get(currentId);
  if (!edges || edges.length === 0) return null;

  if (edges.length === 1) {
    const edge = edges[0];
    if (edge.condition) {
      const result = evalCondition(edge.condition, variables);
      return result ? edge.target : null;
    }
    return edge.target;
  }

  // Multiple edges - find matching condition
  for (const edge of edges) {
    if (!edge.condition) continue;
    const result = evalCondition(edge.condition, variables);
    if (result === (conditionResult ?? true)) return edge.target;
  }

  // Default to first unconditional edge
  const unconditional = edges.find((e) => !e.condition);
  return unconditional?.target || null;
}

function evaluateCondition(config: any, variables: Record<string, any>): boolean {
  // Simple condition evaluation
  if (config.condition) {
    return evalCondition(config.condition, variables);
  }
  return true;
}

function evalCondition(condition: string, variables: Record<string, any>): boolean {
  try {
    // Simple expression evaluation - in production use a proper expression evaluator
    const fn = new Function('vars', `with(vars) { return ${condition}; }`);
    return Boolean(fn(variables));
  } catch {
    return false;
  }
}

async function executeAction(config: any, variables: Record<string, any>, tenantId: string, app: FastifyInstance): Promise<any> {
  const { action, config: actionConfig } = config;

  switch (action) {
    case 'SEND_MESSAGE':
      // Send WhatsApp message
      return { sent: true, messageId: `msg_${Date.now()}` };

    case 'ASSIGN_CONVERSATION':
      // Assign conversation to user/team
      return { assigned: true };

    case 'CREATE_TICKET':
      // Create ticket
      return { ticketId: `tk_${Date.now()}` };

    case 'UPDATE_CONTACT':
      // Update contact fields
      return { updated: true };

    case 'ADD_TAG':
      // Add tag to contact/conversation
      return { tagged: true };

    case 'REMOVE_TAG':
      return { untagged: true };

    case 'SET_PRIORITY':
      return { prioritySet: true };

    case 'SEND_EMAIL':
      // Send email notification
      return { sent: true };

    case 'WEBHOOK_CALL':
      // Call external webhook
      return { called: true };

    default:
      return { executed: true };
  }
}

async function executeWebhook(config: any, variables: Record<string, any>): Promise<any> {
  // Execute webhook call
  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify({ ...variables, ...config.payload }),
    });
    return { status: response.status, data: await response.json().catch(() => ({})) };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.flowId || metadata.executionId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: String(request?.ip || ''), userAgent: String(request?.headers?.['user-agent'] || '') }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
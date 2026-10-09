import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/prisma';
import { config } from '@zapti/shared/config';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Basic health check
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    });
  });

  // Detailed health check
  fastify.get('/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const cfg = config();
    const checks = {
      database: false,
      memory: false,
      disk: false,
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check memory
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    checks.memory = memUsage.heapUsed < 1024 * 1024 * 1024; // Less than 1GB

    // Check disk (basic)
    checks.disk = true; // Would need fs check in production

    const allHealthy = Object.values(checks).every(v => v);

    return reply.status(allHealthy ? 200 : 503).send({
      success: allHealthy,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks,
        memory: memUsageMB,
        version: cfg.appVersion,
        environment: cfg.nodeEnv,
      },
    });
  });

  // Readiness check (for k8s)
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ success: true, data: { ready: true } });
    } catch (error) {
      return reply.status(503).send({ success: false, data: { ready: false } });
    }
  });

  // Liveness check (for k8s)
  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ success: true, data: { alive: true } });
  });
}
// ZapTI API — Main Application Entry Point
import 'dotenv/config';
import Fastify from 'fastify';
import { config } from './config.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { setupAuth } from './middleware/auth.js';
import { setupErrorHandler } from './middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export async function buildApp() {
  const app = Fastify({
    logger: config.logging,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // Decorate app with prisma
  app.decorate('prisma', prisma);

  // Setup error handler
  setupErrorHandler(app);

  // Register plugins (Helmet, CORS, Rate Limit, JWT, Swagger, Socket.io)
  await registerPlugins(app);

  // Setup authentication middleware
  await setupAuth(app);

  // Register all routes
  await registerRoutes(app);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: config.port, host: config.host });
    app.log.info(`🚀 Server running at http://${config.host}:${config.port}`);
    app.log.info(`📚 Documentation at http://${config.host}:${config.port}/documentation`);

    // Start background scheduler (if available)
    // if (config.features.scheduler) {
    //   await startScheduler(app);
    //   app.log.info('⏰ Scheduler started');
    // }
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
// ZapTI API — Main Entry Point
import Fastify from 'fastify';
import { config } from './config.js';
import { registerPlugins } from './plugins/index.js';
import { setupAuth } from './middleware/auth.js';
import { setupErrorHandler } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';
import { prisma } from '@zapti/database';

async function buildApp() {
  const app = Fastify({
    logger: config.logging,
    ajv: { customOptions: { removeAdditional: 'all' } },
  });

  // Register plugins
  await registerPlugins(app);

  // Setup middleware
  await setupAuth(app);
  setupErrorHandler(app);

  // Register routes
  await registerRoutes(app);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Shutting down...');
    try {
      await app.close();
      await prisma.$disconnect();
      app.log.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: config.port, host: config.host });

    app.log.info(`🚀 ZapTI API running at http://${config.host}:${config.port}`);
    app.log.info(`📚 Documentation at http://${config.host}:${config.port}/documentation`);
    app.log.info(`🏥 Health check at http://${config.host}:${config.port}/health`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

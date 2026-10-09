import { FastifyPluginAsync } from 'fastify';

const loggingPlugin: FastifyPluginAsync = async (app) => {
  // Request logging
  app.addHook('onRequest', async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }, 'Incoming request');
  });

  // Response logging
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });

  // Error logging
  app.addHook('onError', async (request, reply, error) => {
    request.log.error({
      method: request.method,
      url: request.url,
      error: error.message,
      stack: error.stack,
      statusCode: reply.statusCode,
    }, 'Request error');
  });
};

export default loggingPlugin;
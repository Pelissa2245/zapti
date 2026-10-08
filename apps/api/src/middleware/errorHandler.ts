// ZapTI API — Error Handler Middleware
import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { config } from '../config.js';

export function setupErrorHandler(app: FastifyInstance) {
  // Global error handler
  app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log error
    request.log.error({ err: error, url: request.url, method: request.method }, 'Request error');

    // Zod validation errors
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          issues,
        },
      });
    }

    // Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          {
            const target = (error.meta?.target as string[])?.join(', ') || 'campo';
            return reply.status(409).send({
              error: { code: 'DUPLICATE_ENTRY', message: target + ' já está em uso' },
            });
          }
        case 'P2003': // Foreign key constraint violation
          return reply.status(400).send({
            error: { code: 'INVALID_REFERENCE', message: 'Referência inválida' },
          });
        case 'P2025': // Record not found
          return reply.status(404).send({
            error: { code: 'NOT_FOUND', message: 'Registro não encontrado' },
          });
      }
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          issues: error.validation.map((v) => ({
            field: v.instancePath.replace('/', ''),
            message: v.message,
            code: 'VALIDATION',
          })),
        },
      });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return reply.status(401).send({ error: { code: 'TOKEN_INVALID', message: 'Token inválido' } });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({ error: { code: 'TOKEN_EXPIRED', message: 'Token expirado' } });
    }

    // Rate limit error
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: { code: 'RATE_LIMITED', message: 'Muitas requisições, tente novamente mais tarde' },
      });
    }

    // Default error
    const statusCode = error.statusCode || 500;
    const message = config.env === 'production' && statusCode === 500
      ? 'Erro interno do servidor'
      : error.message;

    return reply.status(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message,
        ...(config.env !== 'production' && { stack: error.stack }),
      },
    });
  });

  // Not found handler
  app.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      error: { code: 'NOT_FOUND', message: 'Rota ' + request.method + ' ' + request.url + ' não encontrada' },
    });
  });

  // Bad request handler
  app.setSchemaErrorFormatter((errors) => {
    const formattedErrors = errors.map((e) => ({
      field: e.instancePath.replace('/', '') || e.schemaPath.split('/').pop(),
      message: e.message || 'Valor inválido',
      code: e.keyword?.toUpperCase() || 'VALIDATION',
    }));

    const error = new Error('Validation failed');
    (error as any).validation = formattedErrors;
    return error;
  });
}

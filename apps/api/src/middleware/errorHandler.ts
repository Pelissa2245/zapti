import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@zapti/shared/constants';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Log error
  request.log.error({
    err: error,
    method: request.method,
    url: request.url,
    user: (request as any).user?.sub,
    tenant: (request as any).tenant?.id,
  }, 'Unhandled error');

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return reply.status(409).send({
          success: false,
          error: {
            code: ERROR_CODES.CONFLICT,
            message: 'A record with this value already exists',
            field: (error.meta?.target as string[])?.join(', '),
          },
        });
      case 'P2025':
        return reply.status(404).send({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Record not found',
          },
        });
      case 'P2003':
        return reply.status(400).send({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Foreign key constraint failed',
            field: error.meta?.field_name as string,
          },
        });
      default:
        return reply.status(500).send({
          success: false,
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Database error',
          },
        });
    }
  }

  // Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.validation.map(v => ({
          field: v.instancePath || v.schemaPath,
          message: v.message,
        })),
      },
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_INVALID,
        message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
      },
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;

  return reply.status(statusCode).send({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}
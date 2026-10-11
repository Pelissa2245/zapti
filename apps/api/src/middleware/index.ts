import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/prisma';
import { config } from '@zapti/shared/config';
import { ERROR_CODES } from '@zapti/shared/constants';
import { JWTPayload, verifyToken } from '@zapti/shared/auth';
import crypto from 'crypto';

export function registerMiddleware(app: FastifyInstance): void {
  // Request ID
  app.addHook('onRequest', async (request, reply) => {
    request.id = request.headers['x-request-id'] as string || crypto.randomUUID();
    reply.header('x-request-id', request.id);
  });

  // Tenant resolution
  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/health') || request.url.startsWith('/documentation')) {
      return;
    }

    const tenantSlug = request.headers['x-tenant-slug'] as string;
    const tenantDomain = request.headers['x-tenant-domain'] as string;
    const host = request.headers.host;

    let tenant = null;

    if (tenantSlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    } else if (tenantDomain) {
      tenant = await prisma.tenant.findUnique({ where: { domain: tenantDomain } });
    } else if (host) {
      const domain = host.split(':')[0];
      tenant = await prisma.tenant.findUnique({ where: { domain } });
    }

    if (!tenant) {
      // Try to get from JWT token
      try {
        const decoded = await request.jwtVerify<{ tenantId: string }>();
        tenant = await prisma.tenant.findUnique({ where: { id: decoded.tenantId } });
      } catch {
        // No valid token
      }
    }

    if (!tenant || !tenant.isActive) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.TENANT_NOT_FOUND,
          message: 'Tenant not found or inactive',
        },
      });
    }

    request.tenant = {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive,
      slug: tenant.slug,
      domain: tenant.domain,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
      fontFamily: tenant.fontFamily,
    };
  });

  // Authentication - handled by auth plugin
  app.decorateRequest('tenant', null);

  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/health') ||
        request.url.startsWith('/documentation') ||
        request.url.startsWith('/auth/login') ||
        request.url.startsWith('/auth/register') ||
        request.url.startsWith('/auth/refresh') ||
        request.url.startsWith('/auth/forgot-password') ||
        request.url.startsWith('/auth/reset-password') ||
        request.url.startsWith('/webhooks/')) {
      return;
    }

    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Authorization header required',
          },
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return reply.status(401).send({
          success: false,
          error: {
            code: ERROR_CODES.TOKEN_INVALID,
            message: 'Invalid or expired token',
          },
        });
      }

      if (payload.tenantId !== request.tenant!.id) {
        return reply.status(403).send({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Token does not belong to this tenant',
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || !user.isActive || !user.tenant.isActive) {
        return reply.status(401).send({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'User not found or inactive',
          },
        });
      }

      // Attach user with only needed fields to match JWTPayload
      request.user = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: {
          code: ERROR_CODES.TOKEN_INVALID,
          message: 'Invalid or expired token',
        },
      });
    }
  });

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, 'Request error');

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: error.validation,
        },
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: error.message || 'Too many requests',
        },
      });
    }

    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: {
            code: ERROR_CODES.CONFLICT,
            message: 'A record with this value already exists',
          },
        });
      }
      if (prismaError.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Record not found',
          },
        });
      }
    }

    // Send error notification in production
    if (config().NODE_ENV === 'production') {
      const { sendErrorNotification } = await import('@zapti/shared/notification');
      const user = request.user as JWTPayload | undefined;
      await sendErrorNotification({
        error: error instanceof Error ? error : new Error(String(error)),
        context: { requestId: request.id, url: request.url, method: request.method },
        tenantId: request.tenant?.id,
        userId: user?.sub,
      });
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: config().NODE_ENV === 'production'
          ? 'An internal server error occurred'
          : error.message,
      },
    });
  });

  // Not found handler
  app.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });
}
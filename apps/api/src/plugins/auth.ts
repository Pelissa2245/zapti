import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JWTPayload } from '@zapti/shared/auth';
import { config } from '@zapti/shared/config';

// Declare module augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    tenant?: {
      id: string;
      name: string;
      isActive: boolean;
      slug: string;
      domain: string | null;
      logo: string | null;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      fontFamily: string | null;
    };
  }
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  // JWT verification
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authorization header required' },
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return reply.status(401).send({
          success: false,
          error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' },
        });
      }

      // Verify user still exists and is active
      const { prisma } = await import('../services/prisma.js');
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || !user.isActive || !user.tenant.isActive) {
        return reply.status(401).send({
          success: false,
          error: { code: 'TOKEN_INVALID', message: 'User not found or inactive' },
        });
      }

      request.user = payload;
      request.tenant = {
        id: user.tenant.id,
        name: user.tenant.name,
        isActive: user.tenant.isActive,
        slug: user.tenant.slug,
        domain: user.tenant.domain,
        logo: user.tenant.logo,
        primaryColor: user.tenant.primaryColor,
        secondaryColor: user.tenant.secondaryColor,
        accentColor: user.tenant.accentColor,
        fontFamily: user.tenant.fontFamily,
      };
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication failed' },
      });
    }
  });

  // Optional authentication (doesn't fail if no token)
  app.decorate('optionalAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        if (payload) {
          const { prisma } = await import('../services/prisma.js');
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: { tenant: true },
          });

          if (user && user.isActive && user.tenant.isActive) {
            request.user = payload;
            request.tenant = {
              id: user.tenant.id,
              name: user.tenant.name,
              isActive: user.tenant.isActive,
              slug: user.tenant.slug,
              domain: user.tenant.domain,
              logo: user.tenant.logo,
              primaryColor: user.tenant.primaryColor,
              secondaryColor: user.tenant.secondaryColor,
              accentColor: user.tenant.accentColor,
              fontFamily: user.tenant.fontFamily,
            };
          }
        }
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
  });
};

export default authPlugin;
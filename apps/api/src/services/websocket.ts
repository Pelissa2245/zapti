import { Server as SocketIOServer, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { verifyToken, JWTPayload } from '@zapti/shared/auth';

interface AuthenticatedSocket extends Socket {
  user?: JWTPayload;
  tenantId?: string;
}

let io: SocketIOServer | null = null;

export function setupWebSocket(app: FastifyInstance): void {
  io = new SocketIOServer(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.user = payload;
    socket.tenantId = payload.tenantId;
    next();
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const { user, tenantId } = socket;

    console.log(`Client connected: ${user?.email} (${tenantId})`);

    // Join tenant room
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
    }

    // Join user room
    if (user?.sub) {
      socket.join(`user:${user.sub}`);
    }

    // Join conversation rooms if provided
    if (socket.handshake.query.conversationId) {
      socket.join(`conversation:${socket.handshake.query.conversationId}`);
    }

    // Handle conversation join
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Handle conversation leave
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId: user?.sub,
        userName: user?.email,
        conversationId: data.conversationId,
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId: user?.sub,
        conversationId: data.conversationId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${user?.email} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${user?.email}:`, error);
    });
  });

  // Make io globally accessible for broadcasting
  (global as any).io = io;

  console.log('WebSocket server initialized');
}

export function getIO(): SocketIOServer | null {
  return io;
}
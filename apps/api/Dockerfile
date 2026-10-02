# ZapTI API — Multi-stage Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package*.json ./
COPY packages/database/package*.json packages/database/
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json apps/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/database/prisma packages/database/prisma
COPY packages/database/src packages/database/src
COPY packages/database/tsconfig.json packages/database/
COPY packages/shared/src packages/shared/src
COPY packages/shared/tsconfig.json packages/shared/
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/
COPY tsconfig.json .

# Generate Prisma client
RUN npm run db:generate --workspace=packages/database

# Build shared and database packages
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/database

# Build API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init wget openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY packages/database/package*.json packages/database/
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json apps/api/

# Install production dependencies only
RUN npm ci --omit=dev --workspaces --if-present

# Copy built files
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/database/dist packages/database/dist
COPY --from=builder /app/packages/database/prisma packages/database/prisma
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma node_modules/@prisma

# Create data directories
RUN mkdir -p /data/zapti/media /data/zapti/backups /data/zapti/logs && \
    chown -R nodejs:nodejs /app /data

USER nodejs

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "apps/api/dist/index.js"]
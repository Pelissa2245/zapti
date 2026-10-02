# ZapTI Web — Multi-stage Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time environment variable for API URL (used in next.config.js rewrites)
ARG NEXT_PUBLIC_API_URL=http://api:3000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install build dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY packages/database/package*.json packages/database/
COPY apps/web/package*.json apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared/src packages/shared/src
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/database/prisma packages/database/prisma
COPY packages/database/tsconfig.json packages/database/
COPY apps/web/src apps/web/src
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/next.config.js apps/web/
COPY apps/web/tailwind.config.ts apps/web/
COPY apps/web/postcss.config.js apps/web/
COPY tsconfig.json .

# Build shared package
RUN npm run build --workspace=packages/shared

# Build web
RUN npm run build --workspace=apps/web

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY packages/database/package*.json packages/database/
COPY apps/web/package*.json apps/web/

# Install production dependencies only
RUN npm ci --omit=dev --workspaces --if-present

# Copy built files
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static apps/web/.next/static

# Create data directories
RUN mkdir -p /data/zapti/media && \
    chown -R nodejs:nodejs /app /data

USER nodejs

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "apps/web/server.js"]
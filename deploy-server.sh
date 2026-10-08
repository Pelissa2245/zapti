#!/bin/bash
# ZapTI Deployment Script for Server
# Run on the server via SSH

set -e

echo "=== ZapTI Server Deployment ==="

# 1. Pull latest code
echo "1. Pulling latest code..."
cd /opt/zapti 2>/dev/null || git clone https://github.com/your-repo/zapti.git /opt/zapti && cd /opt/zapti
git pull origin master

# 2. Copy production env if not exists
echo "2. Setting up environment..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "⚠️  IMPORTANT: Edit .env with production secrets before continuing!"
    echo "   Required: JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, WEBHOOK_SECRET"
    exit 1
fi

# 3. Build and start containers
echo "3. Building and starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Wait for services to be healthy
echo "4. Waiting for services to be healthy..."
sleep 15

# 5. Run database migrations if needed
echo "5. Running database migrations..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# 6. Check status
echo "6. Checking service status..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo "=== Deployment Complete ==="
echo "Access the application at: http://192.168.1.193:3001"
echo ""
echo "If this is the first deployment, the onboarding wizard will be available at:"
echo "http://192.168.1.193:3001/auth/onboarding/wizard"

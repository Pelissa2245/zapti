#!/bin/bash
# ZapTI Server Deployment Script
# Run this script ON THE SERVER (192.168.1.193) to deploy the application

set -e

echo "🚀 Starting ZapTI deployment on server..."

# Configuration
REPO_URL="https://github.com/Pelissa2245/zapti.git"
APP_DIR="/opt/zapti"
BRANCH="master"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Install Docker and Docker Compose if not present
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_info "Installing Docker Compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Create app directory
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull repository
if [ -d ".git" ]; then
    log_info "Repository exists, pulling latest changes..."
    git fetch origin
    git reset --hard origin/$BRANCH
else
    log_info "Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
fi

# Create production environment file if not exists
if [ ! -f ".env.production" ]; then
    log_warn "Creating .env.production template - PLEASE EDIT WITH REAL VALUES!"
    cat > .env.production << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:CHANGE_ME@localhost:5432/zapti?schema=public"
POSTGRES_PASSWORD="CHANGE_ME"
POSTGRES_DB="zapti"
POSTGRES_USER="postgres"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="CHANGE_ME_USE_STRONG_RANDOM_STRING"
JWT_REFRESH_SECRET="CHANGE_ME_USE_STRONG_RANDOM_STRING"

# App
NODE_ENV="production"
PORT="3000"
API_URL="http://192.168.1.193:3000/api/v1"

# Frontend
NEXT_PUBLIC_API_URL="http://192.168.1.193:3000/api/v1"
CORS_ORIGIN="http://192.168.1.193:3001"
FRONTEND_URL="http://192.168.1.193:3001"

# WhatsApp Evolution API (optional)
EVOLUTION_API_URL=""
EVOLUTION_API_KEY=""
EOF
    log_error "⚠️  IMPORTANT: Edit .env.production with your actual values before continuing!"
    exit 1
fi

# Stop existing containers
log_info "Stopping existing containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build and start containers
log_info "Building Docker images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

log_info "Starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be healthy
log_info "Waiting for services to become healthy..."
sleep 10

# Check health
log_info "Checking API health..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        log_info "API is healthy!"
        break
    fi
    echo -n "."
    sleep 2
done

# Run database migrations
log_info "Running database migrations..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Check if bootstrap is needed
log_info "Checking bootstrap status..."
BOOTSTRAP=$(curl -s http://localhost:3000/api/v1/auth/bootstrap-status)
echo $BOOTSTRAP

if echo "$BOOTSTRAP" | grep -q '"needsBootstrap":true'; then
    log_info "Bootstrap needed - creating admin user..."
    curl -X POST http://localhost:3000/api/v1/auth/bootstrap \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@zapti.com","password":"admin123","name":"Admin User","tenantName":"ZapTI"}'
    echo ""
fi

log_info "✅ Deployment complete!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend: http://192.168.1.193:3001"
echo "   API:      http://192.168.1.193:3000"
echo "   Health:   http://192.168.1.193:3000/health"
echo ""
echo "🔑 Default login:"
echo "   Email:    admin@zapti.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Remember to change the default password after first login!"
#!/bin/bash
# ZapTI Local to Server Deployment Script
# Run this script FROM YOUR LOCAL MACHINE to deploy to server via SSH

set -e

# Configuration - EDIT THESE VALUES
SERVER_IP="192.168.1.193"           # Your server's local IP
SERVER_USER="root"                  # SSH user on server
SSH_KEY="~/.ssh/id_ed25519"         # Path to your SSH private key
REPO_URL="https://github.com/Pelissa2245/zapti.git"
APP_DIR="/opt/zapti"                # Deployment directory on server
BRANCH="master"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🚀 ZapTI Deployment Script"
echo "=========================="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "App Dir: $APP_DIR"
echo "Branch: $BRANCH"
echo ""

# Check if SSH key exists
if [ ! -f "${SSH_KEY/#\~/$HOME}" ]; then
    log_error "SSH key not found at $SSH_KEY"
    exit 1
fi

# Test SSH connection
log_info "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
    log_error "Cannot connect to server via SSH. Please ensure:"
    echo "  1. SSH key is authorized on server (ssh-copy-id $SERVER_USER@$SERVER_IP)"
    echo "  2. Server allows SSH key authentication"
    echo "  3. Server IP is correct: $SERVER_IP"
    exit 1
fi
log_info "SSH connection successful!"

# Push latest changes to GitHub
log_info "Pushing latest changes to GitHub..."
git add -A
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || log_warn "No changes to commit"
git push origin $BRANCH

# Deploy on server
log_info "Deploying on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
set -e

APP_DIR="/opt/zapti"
REPO_URL="https://github.com/Pelissa2245/zapti.git"
BRANCH="master"

cd $APP_DIR

# Pull latest code
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/$BRANCH

# Stop and rebuild
echo "Rebuilding containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for health
echo "Waiting for API to be healthy..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "API is healthy!"
        break
    fi
    echo -n "."
    sleep 2
done

# Run migrations
echo "Running database migrations..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# Check bootstrap
echo "Checking bootstrap status..."
curl -s http://localhost:3000/api/v1/auth/bootstrap-status

echo "Deployment complete!"
ENDSSH

log_info "✅ Deployment complete!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend: http://$SERVER_IP:3001"
echo "   API:      http://$SERVER_IP:3000"
echo "   Health:   http://$SERVER_IP:3000/health"
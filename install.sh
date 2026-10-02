#!/bin/bash

# ZapTI Installation Script
# This script sets up the complete ZapTI environment on a fresh server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ZapTI"
DATA_DIR="/data/zapti"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

generate_secret() {
    openssl rand -hex 32
}

generate_password() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-20
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        return 1
    fi
}

# Print banner
echo -e "${BLUE}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗██████╗ ███████╗ ██████╗ ███████╗████████╗██╗    ║
║   ██╔════╝██╔══██╗██╔════╝██╔═══██╗██╔════╝╚══██╔══╝██║    ║
║   ███████╗██████╔╝█████╗  ██║   ██║███████╗   ██║   ██║    ║
║   ╚════██║██╔═══╝ ██╔══╝  ██║   ██║╚════██║   ██║   ██║    ║
║   ███████║██║     ███████╗╚██████╔╝███████║   ██║   ██║    ║
║   ╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝    ║
║                                                              ║
║   Self-hosted WhatsApp Helpdesk Platform                     ║
║   Installation Script                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
log_info "Checking prerequisites..."

check_command docker || exit 1
check_command docker-compose || { check_command docker-compose-v2 || exit 1; }
check_command openssl || exit 1

log_success "All prerequisites found"

# Check if .env already exists
if [[ -f "$ENV_FILE" ]]; then
    log_warning ".env file already exists"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Keeping existing .env file"
    else
        log_info "Generating new .env file..."
        OVERWRITE_ENV=true
    fi
else
    OVERWRITE_ENV=true
fi

# Generate .env file
if [[ "${OVERWRITE_ENV:-false}" == "true" ]]; then
    log_info "Generating secure secrets..."

    JWT_SECRET=$(generate_secret)
    JWT_REFRESH_SECRET=$(generate_secret)
    ENCRYPTION_KEY=$(generate_secret)
    WEBHOOK_SECRET=$(generate_secret)
    POSTGRES_PASSWORD=$(generate_password)
    REDIS_PASSWORD=$(generate_password)

    log_info "Creating .env file from template..."

    # Read .env.example and replace placeholders
    sed -e "s|your-super-secret-jwt-key-change-in-production-min-32-chars|$JWT_SECRET|g" \
        -e "s|your-super-secret-refresh-key-change-in-production|$JWT_REFRESH_SECRET|g" \
        -e "s|your-32-byte-encryption-key-64-hex-chars-here|$ENCRYPTION_KEY|g" \
        -e "s|your-webhook-secret-min-32-chars|$WEBHOOK_SECRET|g" \
        -e "s|postgres:postgres@localhost:5432|postgres:$POSTGRES_PASSWORD@postgres:5432|g" \
        -e "s|redis://localhost:6379|redis://:$REDIS_PASSWORD@redis:6379|g" \
        "$ENV_EXAMPLE" > "$ENV_FILE"

    # Add generated secrets to .env
    cat >> "$ENV_FILE" << EOF

# ============================================
# GENERATED SECRETS (Do not share!)
# ============================================
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
WEBHOOK_SECRET=$WEBHOOK_SECRET
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
EOF

    log_success ".env file created with secure random secrets"
fi

# Create data directories
log_info "Creating data directories..."
mkdir -p "$DATA_DIR/media" "$DATA_DIR/backups" "$DATA_DIR/logs"
chmod 755 "$DATA_DIR"
log_success "Data directories created at $DATA_DIR"

# Pull Docker images
log_info "Pulling Docker images..."
docker-compose pull
log_success "Docker images pulled"

# Start services
log_info "Starting services..."
docker-compose up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Check service health
MAX_RETRIES=30
RETRY=0
while [[ $RETRY -lt $MAX_RETRIES ]]; do
    if docker-compose ps | grep -q "unhealthy"; then
        log_warning "Some services are still starting... (attempt $((RETRY+1))/$MAX_RETRIES)"
        sleep 5
        RETRY=$((RETRY+1))
    else
        break
    fi
done

# Run database migrations
log_info "Running database migrations..."
docker-compose exec -T api npm run db:migrate --workspace=packages/database

# Seed database
log_info "Seeding database..."
docker-compose exec -T api npm run db:seed --workspace=packages/database

log_success "Installation complete!"
echo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ZapTI is now running!                                       ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  🌐 Web Interface:  http://localhost:3001                   ║${NC}"
echo -e "${GREEN}║  🔧 API:            http://localhost:3000                   ║${NC}"
echo -e "${GREEN}║  📚 API Docs:       http://localhost:3000/documentation     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  Next steps:                                                 ║${NC}"
echo -e "${GREEN}║  1. Open http://localhost:3001 in your browser              ║${NC}"
echo -e "${GREEN}║  2. Complete the onboarding wizard                          ║${NC}"
echo -e "${GREEN}║  3. Configure SMTP for email notifications                  ║${NC}"
echo -e "${GREEN}║  4. Connect your WhatsApp via Evolution API                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${YELLOW}Important:${NC} Save your .env file securely! It contains all secrets."
echo -e "${YELLOW}To stop: ${NC}docker-compose down"
echo -e "${YELLOW}To view logs: ${NC}docker-compose logs -f"
#!/bin/bash
# ZapTI Server Initial Setup Script
# Run this ON THE SERVER (192.168.1.193) as root to prepare for deployment

set -e

echo "🔧 ZapTI Server Initial Setup"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# 1. Update system
log_info "Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install required packages
log_info "Installing required packages..."
apt-get install -y \
    curl \
    git \
    docker.io \
    docker-compose-plugin \
    ufw \
    fail2ban

# 3. Enable and start Docker
log_info "Enabling Docker service..."
systemctl enable docker
systemctl start docker

# 4. Configure firewall
log_info "Configuring firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # API (optional, for direct access)
ufw allow 3001/tcp    # Frontend (optional, for direct access)
ufw allow 5432/tcp    # PostgreSQL (optional, for direct access)
ufw allow 6379/tcp    # Redis (optional, for direct access)
ufw --force enable

# 5. Configure fail2ban for SSH protection
log_info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# 6. Create deployment user (optional, for non-root deployment)
log_info "Creating deployment user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    mkdir -p /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    touch /home/deploy/.ssh/authorized_keys
    chmod 600 /home/deploy/.ssh/authorized_keys
    chown -R deploy:deploy /home/deploy/.ssh
    log_info "Created 'deploy' user. Add SSH keys to /home/deploy/.ssh/authorized_keys"
else
    log_warn "User 'deploy' already exists"
fi

# 7. Create app directory
log_info "Creating app directory..."
mkdir -p /opt/zapti
chown -R deploy:deploy /opt/zapti

# 8. Generate secure secrets
log_info "Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

echo ""
echo "🔐 Generated Secrets (SAVE THESE!):"
echo "==================================="
echo "JWT_SECRET: $JWT_SECRET"
echo "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo ""

# 9. Create .env.production template
log_info "Creating .env.production template..."
cat > /opt/zapti/.env.production << EOF
# Database
DATABASE_URL="postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/zapti?schema=public"
POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
POSTGRES_DB="zapti"
POSTGRES_USER="postgres"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"

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

chown deploy:deploy /opt/zapti/.env.production
chmod 600 /opt/zapti/.env.production

# 10. Setup SSH key for deploy user
log_info "Setting up SSH access for deploy user..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

echo ""
echo "✅ Server setup complete!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. ADD YOUR SSH PUBLIC KEY TO SERVER:"
echo "   On your LOCAL machine, run:"
echo "   ssh-copy-id -i ~/.ssh/id_ed25519.pub root@192.168.1.193"
echo "   OR manually add your public key to /root/.ssh/authorized_keys"
echo ""
echo "2. VERIFY .env.production:"
echo "   Edit /opt/zapti/.env.production if needed"
echo "   (The generated secrets above are already in the file)"
echo ""
echo "3. RUN DEPLOYMENT:"
echo "   On your LOCAL machine, run:"
echo "   ./deploy-from-local.sh"
echo ""
echo "   OR on the SERVER directly:"
echo "   cd /opt/zapti && ./deploy-server.sh"
echo ""
echo "🔐 IMPORTANT: Save the generated secrets above in a secure location!"
echo "   They are also stored in /opt/zapti/.env.production"
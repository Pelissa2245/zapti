# ZapTI Deployment Guide

## Current Status
- ✅ Local development environment running (Docker containers healthy)
- ✅ Code committed and pushed to GitHub (https://github.com/Pelissa2245/zapti.git)
- ⚠️  SSH key not authorized on target server (192.168.1.193 / 100.72.106.32)

## Server Setup Required

### Option 1: Run Server Setup Script (Recommended)
1. **Copy the setup script to the server:**
   ```bash
   # From your local machine, copy via SCP (requires password auth first time)
   scp /d/zapti-new/server-setup.sh root@192.168.1.193:/root/
   ```

2. **On the server, run as root:**
   ```bash
   ssh root@192.168.1.193
   chmod +x /root/server-setup.sh
   /root/server-setup.sh
   ```

3. **The script will:**
   - Install Docker, Docker Compose, Git
   - Configure firewall (UFW) and fail2ban
   - Create deployment user
   - Generate secure secrets
   - Create `/opt/zapti/.env.production` with all configuration

### Option 2: Manual Server Setup
```bash
# On the server as root:
apt-get update && apt-get install -y docker.io docker-compose-plugin git ufw fail2ban
systemctl enable docker && systemctl start docker

# Configure firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 3000/tcp && ufw allow 3001/tcp
ufw --force enable

# Create app directory
mkdir -p /opt/zapti
cd /opt/zapti

# Generate secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Create .env.production
cat > .env.production << 'ENVEOF'
DATABASE_URL="postgresql://postgres:POSTGRES_PASSWORD@localhost:5432/zapti?schema=public"
POSTGRES_PASSWORD="POSTGRES_PASSWORD"
POSTGRES_DB="zapti"
POSTGRES_USER="postgres"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="JWT_SECRET"
JWT_REFRESH_SECRET="JWT_REFRESH_SECRET"
NODE_ENV="production"
PORT="3000"
API_URL="http://192.168.1.193:3000/api/v1"
NEXT_PUBLIC_API_URL="http://192.168.1.193:3000/api/v1"
CORS_ORIGIN="http://192.168.1.193:3001"
FRONTEND_URL="http://192.168.1.193:3001"
EVOLUTION_API_URL=""
EVOLUTION_API_KEY=""
ENVEOF

# Replace placeholder with actual values
sed -i "s/POSTGRES_PASSWORD/$POSTGRES_PASSWORD/g" .env.production
sed -i "s/JWT_SECRET/$JWT_SECRET/g" .env.production
sed -i "s/JWT_REFRESH_SECRET/$JWT_REFRESH_SECRET/g" .env.production
```

## Authorize SSH Key
After server setup, authorize your SSH key:
```bash
# From your LOCAL machine:
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@192.168.1.193
# OR if using Tailscale:
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@100.72.106.32
```

## Deploy Application

### From Local Machine (Automated):
```bash
cd /d/zapti-new
chmod +x deploy-from-local.sh
./deploy-from-local.sh
```

### On Server Directly:
```bash
ssh root@192.168.1.193
cd /opt/zapti
# Copy deploy-server.sh to server first, then:
chmod +x deploy-server.sh
./deploy-server.sh
```

## Post-Deployment
- Frontend: http://192.168.1.193:3001
- API: http://192.168.1.193:3000
- Health: http://192.168.1.193:3000/health
- Default login: admin@zapti.com / admin123

## Troubleshooting

### SSH Connection Issues:
```bash
# Test connection with verbose output
ssh -v root@192.168.1.193

# Check if SSH service is running on server
ssh root@192.168.1.193 "systemctl status ssh"

# Check authorized_keys
ssh root@192.168.1.193 "cat ~/.ssh/authorized_keys"
```

### Docker Issues:
```bash
# Check container logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Check container status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Database Issues:
```bash
# Run migrations manually
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Check database connection
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres pg_isready
```

## Files Created
- `/d/zapti-new/deploy-server.sh` - Run ON the server
- `/d/zapti-new/deploy-from-local.sh` - Run FROM local machine
- `/d/zapti-new/server-setup.sh` - Initial server setup (run once as root)
- `/d/zapti-new/DEPLOYMENT_GUIDE.md` - This guide

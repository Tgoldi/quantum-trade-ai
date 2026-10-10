# 🚀 Vast.ai Deployment Guide

## 📋 Overview

This guide will help you deploy the Quantum Trade AI platform to your Vast.ai instance.

**Instance IP:** `50.217.254.167`

---

## 🔧 Step 1: Connect to Your Vast.ai Instance

### SSH Connection

**Direct SSH (Recommended):**
```bash
ssh -p 41221 root@50.217.254.167
```

**Proxy SSH (Alternative):**
```bash
ssh -p 16779 root@ssh3.vast.ai
```

**Note:** The SSH port is `41221` (not the default port 22). Use the direct SSH command above.

---

## 📦 Step 2: Install Prerequisites

Once connected to your Vast.ai instance, run:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install essential tools
apt-get install -y curl wget git build-essential

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
node --version
npm --version
docker --version
docker-compose --version
```

---

## 🔐 Step 3: Clone the Repository

```bash
# Navigate to a suitable directory
cd /opt  # or /home, or wherever you prefer

# Clone the repository
git clone https://github.com/Tgoldi/quantum-trade-ai.git
cd quantum-trade-ai
```

---

## ⚙️ Step 4: Configure Environment Variables

### Option A: Quick Start (Supabase - Recommended)

```bash
# Create frontend environment file
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF
```

### Option B: Full Stack (Docker with PostgreSQL/Redis)

```bash
# Generate secrets in a separate step (the heredoc below is quoted, so
# shell substitutions such as $(openssl ...) are NOT expanded inside it)
JWT_SECRET_VALUE="$(openssl rand -base64 32)"
DB_PASSWORD_VALUE="$(openssl rand -base64 24 | tr -d '/+=')"

# Create backend environment file (unquoted heredoc so the variables above are expanded)
cat > server/.env << EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD_VALUE}

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=${JWT_SECRET_VALUE}

# Node Environment
NODE_ENV=production
PORT=3001

# Optional: API Keys
# ALPACA_API_KEY=your_key_here
# ALPACA_SECRET_KEY=your_secret_here
# FINNHUB_API_KEY=your_key_here
EOF

# Restrict file permissions
chmod 600 server/.env

# Verify the secrets were actually generated and are NOT literal placeholder text
grep -E '^(JWT_SECRET|DB_PASSWORD)=' server/.env
# JWT_SECRET must NOT contain the text "$(openssl" and DB_PASSWORD must NOT be
# "postgres_secure_password_change_this". If either is, re-run the steps above.
```

> ⚠️ **The application must refuse to start if the default database password
> (`postgres_secure_password_change_this`) or an unexpanded `JWT_SECRET`
> placeholder is still in use.** Add a startup check in the server that exits
> with an error in that case.
>
> 🚨 **If you already deployed using an earlier version of this guide**, your
> `JWT_SECRET` may be the literal text `$(openssl rand -base64 32)` and your
> database password the default value. Generate new secrets and change the
> database password immediately, then restart all services (existing JWTs
> will be invalidated).

---

## 🚀 Step 5: Deploy the Application

### Option A: Quick Start (Frontend Only - Fastest)

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Install a simple HTTP server
npm install -g serve

# Start the server (runs on port 3000 by default)
serve -s dist -l 3000

# Or use PM2 for process management (recommended)
npm install -g pm2
pm2 serve dist 3000 --name quantum-trade-ai
pm2 save
pm2 startup
```

**Access:** `http://50.217.254.167:3000`

### Option B: Full Stack with Docker (Complete Setup)

```bash
# Make sure you're in the project root
cd /opt/quantum-trade-ai

# Start all services
docker-compose -f docker-compose-full.yml up -d

# Check status
docker ps

# View logs
docker-compose -f docker-compose-full.yml logs -f
```

> ⚠️ **Do not publish PostgreSQL (5432) or Redis (6379) on the public IP.**
> In your compose file, either omit the `ports:` mapping for `postgres` and
> `redis` (containers reach each other over the internal Docker network via
> `DB_HOST=postgres` / `REDIS_HOST=redis`), or bind them to loopback only:
>
> ```yaml
> postgres:
>   ports:
>     - "127.0.0.1:5432:5432"
> redis:
>   ports:
>     - "127.0.0.1:6379:6379"
> ```
>
> Likewise bind the backend (`127.0.0.1:3001:3001`) and frontend ports to
> loopback and serve them publicly only through the Nginx reverse proxy
> (Step 7) with TLS.

**Access (from the instance itself, or via the Nginx proxy in Step 7):**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- API Health: `http://localhost:3001/api/health`

### Option C: Production Docker Setup

```bash
cd server

# Build and start production services
docker-compose -f docker-compose-production.yml up -d --build

# Check status
docker-compose -f docker-compose-production.yml ps
```

**Access (via the Nginx proxy in Step 7, or from the instance itself):**
- Frontend: `http://localhost:8081`
- Backend API: `http://localhost:3001`

---

## 🔒 Step 6: Configure Firewall (Important!)

Vast.ai instances may have firewalls. Only expose SSH and the reverse proxy
publicly. Never open database/cache ports (5432, 6379) or the backend/admin
port (3001) to the internet; all public traffic goes through Nginx.

```bash
# Default policy: deny all inbound, allow outbound
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (use the SSH port of your instance, e.g. 41221 on Vast.ai)
ufw allow 41221/tcp

# Allow HTTP/HTTPS (Nginx reverse proxy only)
ufw allow 80/tcp
ufw allow 443/tcp

# Do NOT allow 3000, 3001, 5173, 8081, 5432 or 6379 publicly.
# Application services must listen on 127.0.0.1 / the internal Docker network
# and be reached through Nginx.

# Enable firewall
ufw enable

# Check status
ufw status
```

> Note: Docker-published ports can bypass UFW rules. Bind published ports to
> `127.0.0.1` in your compose files (e.g. `"127.0.0.1:3001:3001"`) rather than
> relying on UFW alone.

---

## 🌐 Step 7: Set Up Reverse Proxy (Optional but Recommended)

For production, use Nginx as a reverse proxy:

```bash
# Install Nginx
apt-get install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/quantum-trade-ai << 'EOF'
server {
    listen 80;
    server_name 50.217.254.167;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;  # or 5173, 8081 depending on your setup
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/quantum-trade-ai /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

**Access:** `http://50.217.254.167` (port 80). Set up TLS (e.g. Let's Encrypt via
`certbot --nginx`) and serve over HTTPS (port 443) for production.

---

## 📊 Step 8: Process Management (PM2 - Recommended)

For better process management and auto-restart:

```bash
# Install PM2 globally
npm install -g pm2

# If using frontend only
cd /opt/quantum-trade-ai
pm2 start "npm run dev" --name quantum-frontend
# Or for production build:
pm2 start "serve -s dist -l 3000" --name quantum-frontend

# If using backend
cd /opt/quantum-trade-ai/server
pm2 start apiServer.js --name quantum-backend

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides

# Useful PM2 commands
pm2 list          # View all processes
pm2 logs          # View logs
pm2 restart all   # Restart all
pm2 stop all      # Stop all
pm2 delete all    # Delete all
```

---

## ✅ Step 9: Verify Deployment

### Check Services

```bash
# Check if services are running
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost:3000

# Check Docker containers (if using Docker)
docker ps
```

### Test from Your Local Machine

```bash
# Test via the Nginx reverse proxy (backend 3001 / frontend 3000 are not public)
curl http://50.217.254.167/api/health

# Test frontend
curl http://50.217.254.167/
```

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# Docker logs
docker-compose -f docker-compose-full.yml logs -f

# PM2 logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Check Resource Usage

```bash
# System resources
htop

# Docker stats
docker stats

# PM2 monitoring
pm2 monit
```

---

## 🔄 Updating the Application

```bash
# Navigate to project directory
cd /opt/quantum-trade-ai

# Pull latest changes
git pull origin main

# Rebuild (if needed)
npm install
npm run build

# Restart services
# If using PM2:
pm2 restart all

# If using Docker:
docker-compose -f docker-compose-full.yml up -d --build
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Check Docker status
systemctl status docker

# Restart Docker
systemctl restart docker

# Remove and recreate containers
docker-compose -f docker-compose-full.yml down
docker-compose -f docker-compose-full.yml up -d
```

### Permission Issues

```bash
# Add user to docker group
usermod -aG docker $USER
newgrp docker
```

### Database Connection Issues

```bash
# Check PostgreSQL (if using Docker)
docker logs quantumtrade-postgres

# Check Redis
docker logs quantumtrade-redis
```

---

## 🔐 Security Recommendations

1. **Change Default Passwords**: Update all default passwords in `.env` files
2. **Use SSL/HTTPS**: Set up Let's Encrypt for HTTPS
3. **Firewall**: Only open necessary ports (SSH, 80, 443). Never expose 5432, 6379 or 3001 publicly
4. **SSH Keys**: Use SSH keys instead of passwords
5. **Regular Updates**: Keep system and dependencies updated

---

## 📝 Quick Reference

### Important URLs
- **Repository**: https://github.com/Tgoldi/quantum-trade-ai
- **Instance IP**: 50.217.254.167
- **Frontend**: http://50.217.254.167 (via Nginx; the app port itself is localhost-only)
- **Backend**: http://50.217.254.167/api/ (via Nginx; port 3001 is localhost-only)

### Common Commands

```bash
# SSH to instance
ssh root@50.217.254.167

# Check services
docker ps
pm2 list

# View logs
docker-compose logs -f
pm2 logs

# Restart services
pm2 restart all
docker-compose restart

# Update application
cd /opt/quantum-trade-ai && git pull && npm install && npm run build && pm2 restart all
```

---

## 🎉 Success!

Your Quantum Trade AI platform should now be running on your Vast.ai instance!

Access it at: `http://50.217.254.167` (through the Nginx reverse proxy)

---

**Need Help?** Check the logs and troubleshooting section above.


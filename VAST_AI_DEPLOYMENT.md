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
# Create backend environment file
cat > server/.env << 'EOF'
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=postgres_secure_password_change_this

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret (generate a secure random string)
JWT_SECRET=$(openssl rand -base64 32)

# Node Environment
NODE_ENV=production
PORT=3001

# Optional: API Keys
# ALPACA_API_KEY=your_key_here
# ALPACA_SECRET_KEY=your_secret_here
# FINNHUB_API_KEY=your_key_here
EOF
```

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

**Access:**
- Frontend: `http://50.217.254.167:5173`
- Backend API: `http://50.217.254.167:3001`
- API Health: `http://50.217.254.167:3001/api/health`

### Option C: Production Docker Setup

```bash
cd server

# Build and start production services
docker-compose -f docker-compose-production.yml up -d --build

# Check status
docker-compose -f docker-compose-production.yml ps
```

**Access:**
- Frontend: `http://50.217.254.167:8081`
- Backend API: `http://50.217.254.167:3001`

---

## 🔒 Step 6: Configure Firewall (Important!)

Vast.ai instances may have firewalls. Configure ports:

```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports
ufw allow 3000/tcp  # Frontend (if using serve)
ufw allow 3001/tcp  # Backend API
ufw allow 5173/tcp  # Frontend (if using Docker)
ufw allow 8081/tcp  # Frontend (production)

# Enable firewall
ufw enable

# Check status
ufw status
```

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

**Access:** `http://50.217.254.167` (port 80)

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
# Test backend health
curl http://50.217.254.167:3001/api/health

# Test frontend
curl http://50.217.254.167:3000
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
3. **Firewall**: Only open necessary ports
4. **SSH Keys**: Use SSH keys instead of passwords
5. **Regular Updates**: Keep system and dependencies updated

---

## 📝 Quick Reference

### Important URLs
- **Repository**: https://github.com/Tgoldi/quantum-trade-ai
- **Instance IP**: 50.217.254.167
- **Frontend**: http://50.217.254.167:3000 (or configured port)
- **Backend**: http://50.217.254.167:3001

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

Access it at: `http://50.217.254.167:3000` (or your configured port)

---

**Need Help?** Check the logs and troubleshooting section above.


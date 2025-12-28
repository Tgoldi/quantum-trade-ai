#!/bin/bash

# Quantum Trade AI - Vast.ai Deployment Script
# Run this script on your Vast.ai instance after cloning the repository

set -e  # Exit on any error

echo "🚀 Quantum Trade AI - Vast.ai Deployment Script"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Not running as root. Some commands may need sudo.${NC}"
fi

# Step 1: Check prerequisites
echo -e "\n${BLUE}📋 Step 1: Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ Docker Compose installed: $COMPOSE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose not found. Installing...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ Git installed: $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Git not found. Installing...${NC}"
    apt-get update
    apt-get install -y git
fi

# Step 2: Check if repository exists
echo -e "\n${BLUE}📦 Step 2: Checking repository...${NC}"

if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Not a git repository. Cloning...${NC}"
    cd /opt || cd /home
    git clone https://github.com/Tgoldi/quantum-trade-ai.git
    cd quantum-trade-ai
fi

echo -e "${GREEN}✅ Repository found${NC}"

# Step 3: Install dependencies
echo -e "\n${BLUE}📦 Step 3: Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd server
    npm install
    cd ..
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Step 4: Setup environment
echo -e "\n${BLUE}⚙️  Step 4: Setting up environment...${NC}"

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Check for server/.env
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}Creating server/.env file...${NC}"
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key-in-production")
    cat > server/.env << EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=postgres_secure_password_change_this

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Node Environment
NODE_ENV=production
PORT=3001
EOF
    echo -e "${GREEN}✅ Created server/.env${NC}"
else
    echo -e "${GREEN}✅ server/.env already exists${NC}"
fi

# Step 5: Build frontend
echo -e "\n${BLUE}🔨 Step 5: Building frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 6: Install PM2
echo -e "\n${BLUE}📦 Step 6: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Step 7: Start services
echo -e "\n${BLUE}🚀 Step 7: Starting services...${NC}"

# Ask user which deployment method
echo -e "${YELLOW}Choose deployment method:${NC}"
echo "1) Quick Start (Frontend only with PM2)"
echo "2) Full Stack (Docker with PostgreSQL/Redis)"
echo "3) Production Docker (Optimized)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${BLUE}Starting frontend with PM2...${NC}"
        pm2 delete quantum-frontend 2>/dev/null || true
        pm2 start "serve -s dist -l 3000" --name quantum-frontend
        pm2 save
        echo -e "${GREEN}✅ Frontend started on port 3000${NC}"
        echo -e "${GREEN}Access at: http://$(hostname -I | awk '{print $1}'):3000${NC}"
        ;;
    2)
        echo -e "${BLUE}Starting Docker services...${NC}"
        docker-compose -f docker-compose-full.yml up -d
        echo -e "${GREEN}✅ Docker services started${NC}"
        echo -e "${GREEN}Frontend: http://$(hostname -I | awk '{print $1}'):5173${NC}"
        echo -e "${GREEN}Backend: http://$(hostname -I | awk '{print $1}'):3001${NC}"
        ;;
    3)
        echo -e "${BLUE}Starting production Docker services...${NC}"
        cd server
        docker-compose -f docker-compose-production.yml up -d --build
        cd ..
        echo -e "${GREEN}✅ Production services started${NC}"
        echo -e "${GREEN}Frontend: http://$(hostname -I | awk '{print $1}'):8081${NC}"
        echo -e "${GREEN}Backend: http://$(hostname -I | awk '{print $1}'):3001${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Step 8: Configure firewall
echo -e "\n${BLUE}🔥 Step 8: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 3000/tcp 2>/dev/null || true
    ufw allow 3001/tcp 2>/dev/null || true
    ufw allow 5173/tcp 2>/dev/null || true
    ufw allow 8081/tcp 2>/dev/null || true
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not found. Skipping firewall configuration.${NC}"
fi

# Step 9: Summary
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "\n${BLUE}📊 Service Status:${NC}"

if command -v pm2 &> /dev/null; then
    pm2 list
fi

if command -v docker &> /dev/null; then
    docker ps
fi

echo -e "\n${BLUE}📝 Useful Commands:${NC}"
echo "  View logs: pm2 logs (or docker-compose logs -f)"
echo "  Restart: pm2 restart all (or docker-compose restart)"
echo "  Stop: pm2 stop all (or docker-compose down)"
echo "  Status: pm2 list (or docker ps)"

echo -e "\n${GREEN}✅ Deployment script completed!${NC}"


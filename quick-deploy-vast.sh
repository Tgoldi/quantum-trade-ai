#!/bin/bash
# Quick Deploy Script for Vast.ai - Copy and paste this entire script into your Vast.ai instance

set -e

echo "🚀 Quantum Trade AI - Quick Deploy to Vast.ai"
echo "=============================================="

# Update system
echo "📦 Updating system..."
apt-get update -y
apt-get install -y curl wget git build-essential

# Install Node.js 18
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install Docker
echo "📦 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2 serve

# Clone repository
echo "📦 Cloning repository..."
cd /opt 2>/dev/null || cd /home
if [ -d "quantum-trade-ai" ]; then
    echo "Repository exists, updating..."
    cd quantum-trade-ai
    git pull
else
    git clone https://github.com/Tgoldi/quantum-trade-ai.git
    cd quantum-trade-ai
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

# Create environment files
echo "⚙️  Creating environment files..."
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF

if [ ! -f "server/.env" ]; then
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key")
    cat > server/.env << EOF
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=postgres_secure_$(openssl rand -hex 8)
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
PORT=3001
EOF
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Stop existing services
echo "🛑 Stopping existing services..."
pm2 delete quantum-frontend 2>/dev/null || true
docker-compose -f docker-compose-full.yml down 2>/dev/null || true

# Start frontend with PM2
echo "🚀 Starting frontend..."
pm2 start "serve -s dist -l 3000" --name quantum-frontend
pm2 save
pm2 startup | tail -1 | bash || true

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 3000/tcp 2>/dev/null || true
ufw allow 3001/tcp 2>/dev/null || true
ufw allow 5173/tcp 2>/dev/null || true
ufw allow 8081/tcp 2>/dev/null || true

# Get IP address
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "🌐 Frontend: http://$IP:3000"
echo "🌐 Backend:  http://$IP:3001"
echo ""
echo "📊 Check status:"
echo "   pm2 list"
echo "   pm2 logs"
echo ""
echo "🔄 Restart: pm2 restart quantum-frontend"
echo "🛑 Stop: pm2 stop quantum-frontend"


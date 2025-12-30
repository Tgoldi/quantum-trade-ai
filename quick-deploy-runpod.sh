#!/bin/bash
# Quick Deploy Script for RunPod - Quantum Trade AI

set -e

echo "🚀 Quantum Trade AI - Quick Deploy to RunPod"
echo "=============================================="

# Update system
echo "📦 Updating system..."
apt-get update -y
apt-get install -y curl wget git build-essential

# Install Node.js 20 (latest LTS)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2 serve

# Clone repository
echo "📦 Cloning repository..."
cd /workspace 2>/dev/null || cd /root
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

# Start frontend on port 7777 (RunPod HTTP service)
echo "🚀 Starting frontend on port 7777 (RunPod HTTP service)..."
pm2 start "npx serve dist -l 7777" --name quantum-frontend
pm2 save

# Configure PM2 to start on boot
echo "⚙️  Configuring PM2 auto-start..."
pm2 startup | tail -1 | bash || true

# Get IP address
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "🌐 Application running on port 7777"
echo "🌐 Access via RunPod HTTP service link"
echo "🌐 Local access: http://localhost:7777"
echo ""
echo "📊 Check status:"
echo "   pm2 list"
echo "   pm2 logs quantum-frontend"
echo ""
echo "🔄 Restart: pm2 restart quantum-frontend"
echo "🛑 Stop: pm2 stop quantum-frontend"
echo ""
echo "💡 Use the HTTP service link from your RunPod dashboard to access the app!"


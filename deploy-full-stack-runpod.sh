#!/bin/bash
# Full Stack Deployment Script for RunPod - Quantum Trade AI
# This deploys both frontend and backend services

set -e

echo "🚀 Quantum Trade AI - Full Stack Deployment to RunPod"
echo "======================================================"

# Update system
echo "📦 Updating system..."
apt-get update -y
apt-get install -y curl wget git build-essential

# Install Node.js 20
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

# Install Docker (for PostgreSQL and Redis if needed)
echo "📦 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Clone repository
echo "📦 Cloning repository..."
cd /workspace
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

# Frontend environment
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_API_URL=http://localhost:3001
EOF

# Backend environment
if [ ! -f "server/.env" ]; then
    # Validate required environment variables
    if [ -z "$JWT_SECRET" ]; then
        echo "Error: JWT_SECRET environment variable is not set"
        exit 1
    fi
    if [ -z "$DB_PASSWORD" ]; then
        echo "Error: DB_PASSWORD environment variable is not set"
        exit 1
    fi
    if [ -z "$SUPABASE_URL" ]; then
        echo "Error: SUPABASE_URL environment variable is not set"
        exit 1
    fi
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        echo "Error: SUPABASE_ANON_KEY environment variable is not set"
        exit 1
    fi
    
    cat > server/.env << EOF
# Database Configuration (using Supabase, but keeping for compatibility)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Node Environment
NODE_ENV=production
PORT=3001

# Supabase (if using Supabase backend)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Stop existing services
echo "🛑 Stopping existing services..."
pm2 delete all 2>/dev/null || true

# Start backend (if you want to run backend locally)
echo "🚀 Starting backend on port 3001..."
cd server
pm2 start apiServer.js --name quantum-backend --update-env
cd ..

# Start frontend on port 7777 (RunPod HTTP service)
echo "🚀 Starting frontend on port 7777 (RunPod HTTP service)..."
pm2 start "npx serve dist -l 7777" --name quantum-frontend
pm2 save

# Configure PM2 to start on boot
echo "⚙️  Configuring PM2 auto-start..."
pm2 startup | tail -1 | bash || true

# Display status
echo ""
echo "✅ Full Stack Deployment Complete!"
echo "===================================="
echo "🌐 Frontend: Running on port 7777"
echo "🔧 Backend:  Running on port 3001"
echo ""
echo "📊 Service Status:"
pm2 list
echo ""
echo "💡 Access your app via RunPod HTTP service link (Port 7777)"
echo "💡 Backend API available at: http://localhost:3001/api/health"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs quantum-frontend    # View frontend logs"
echo "   pm2 logs quantum-backend     # View backend logs"
echo "   pm2 restart all               # Restart all services"
echo "   pm2 stop all                  # Stop all services"


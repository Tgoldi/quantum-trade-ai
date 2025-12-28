#!/bin/bash

# AI Trading Platform - Development Start Script
# Starts frontend and backend in development mode

set -e

echo "🔧 Starting AI Trading Platform in Development Mode..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  server/.env file not found, copying from template...${NC}"
    cp env-template.txt server/.env
    echo -e "${YELLOW}📝 Please edit server/.env with your API keys${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd server && npm install && cd ..
fi

echo -e "${GREEN}🚀 Starting development servers...${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend: http://localhost:3001${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}🔧 Starting backend server...${NC}"
(cd server && npm start) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}📱 Starting frontend server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}✅ Development servers started!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for processes
wait

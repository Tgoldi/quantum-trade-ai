#!/bin/bash

# AI Trading Platform - Production Deployment Script
# Builds and deploys both frontend and backend services

set -e  # Exit on any error

echo "🚀 Starting AI Trading Platform Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ Error: server/.env file not found!${NC}"
    echo -e "${YELLOW}Please copy env-template.txt to server/.env and configure your API keys${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
    exit 1
fi

# Check if Ollama is running (optional but recommended)
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Ollama is not running on localhost:11434${NC}"
    echo -e "${YELLOW}   AI features will not work without Ollama${NC}"
    echo -e "${YELLOW}   Install from: https://ollama.ai${NC}"
fi

echo -e "${BLUE}📦 Building Docker images...${NC}"

# Change to server directory for docker-compose
cd server

# Build and start services
echo -e "${BLUE}🔨 Building frontend and backend services...${NC}"
docker-compose -f docker-compose-production.yml build --no-cache

echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose -f docker-compose-production.yml up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check frontend
if curl -f http://localhost:8081/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Check backend API
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API health check failed${NC}"
fi

# Show running containers
echo -e "${BLUE}📊 Running containers:${NC}"
docker-compose -f docker-compose-production.yml ps

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:8081${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:3001${NC}"
echo -e "${GREEN}📊 WebSocket: ws://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo -e "${YELLOW}   View logs: docker-compose -f server/docker-compose-production.yml logs -f${NC}"
echo -e "${YELLOW}   Stop services: docker-compose -f server/docker-compose-production.yml down${NC}"
echo -e "${YELLOW}   Restart services: docker-compose -f server/docker-compose-production.yml restart${NC}"
echo ""
echo -e "${BLUE}🔧 Configure your Alpaca API keys in server/.env for live trading${NC}"

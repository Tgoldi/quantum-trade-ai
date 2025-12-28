# 🚀 AI Trading Platform - Production Deployment Guide

## Overview

This guide covers deploying the AI Trading Platform in production using Docker containers with optimized performance and reliability.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Ollama        │
│   (React + Nginx)│────│   (Node.js)     │────│   (AI Models)   │
│   Port: 8081    │    │   Port: 3001    │    │   Port: 11434   │
│                 │    │   WS: 8080      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features Removed

✅ **Fallback Logic Removed**: The system no longer uses rule-based fallbacks. If AI models are unavailable, the system will return proper errors instead of degraded responses.

## Quick Start

### 1. Prerequisites

- **Docker Desktop** installed and running
- **Ollama** installed and running (for AI features)
- **Git** for cloning the repository

### 2. Install Ollama (Required for AI)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama3.1:8b
ollama pull mistral:7b
ollama pull phi3:mini
ollama pull codellama:13b
```

### 3. Configure Environment

```bash
# Copy environment template
cp env-template.txt server/.env

# Edit with your API keys
nano server/.env
```

Required environment variables:
```env
ALPACA_API_KEY=your_alpaca_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_here
ALPACA_PAPER_TRADING=true
NODE_ENV=production
```

### 4. Deploy to Production

```bash
# One-command deployment
npm run deploy:prod

# Or run the script directly
./deploy-production.sh
```

## Manual Deployment Steps

### Build and Start Services

```bash
# Build Docker images
npm run docker:build

# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Individual Commands

```bash
# Build frontend and backend
cd server
docker-compose -f docker-compose-production.yml build

# Start all services
docker-compose -f docker-compose-production.yml up -d

# View real-time logs
docker-compose -f docker-compose-production.yml logs -f

# Stop all services
docker-compose -f docker-compose-production.yml down
```

## Service URLs

After deployment, access the platform at:

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:8080
- **Health Checks**: 
  - Frontend: http://localhost:8081/health
  - Backend: http://localhost:3001/api/health

## Performance Optimizations

### Frontend (React + Nginx)
- **Multi-stage Docker build** for minimal image size
- **Nginx reverse proxy** with gzip compression
- **Static asset caching** with long-term cache headers
- **SPA routing** support for React Router
- **Resource limits**: 512MB RAM, 1 CPU core

### Backend (Node.js)
- **Performance tuning** with optimized Node.js settings
- **Memory allocation**: 2GB RAM, 4 CPU cores
- **Health checks** with automatic restart
- **WebSocket support** for real-time data
- **AI model connection** to Ollama

## Monitoring and Logs

### View Logs
```bash
# All services
npm run docker:logs

# Specific service
docker logs ai-trading-frontend
docker logs ai-trading-backend
```

### Health Monitoring
```bash
# Check service status
docker-compose -f server/docker-compose-production.yml ps

   # Test health endpoints
   curl http://localhost:8081/health
   curl http://localhost:3001/api/health
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :8081
   lsof -i :3001
   lsof -i :8080
   ```

2. **Ollama Connection Issues**
   ```bash
   # Check Ollama status
   curl http://localhost:11434/api/version
   
   # Restart Ollama
   ollama serve
   ```

3. **Docker Build Issues**
   ```bash
   # Clean rebuild
   docker-compose -f server/docker-compose-production.yml build --no-cache
   
   # Clean up Docker
   docker system prune -f
   ```

4. **Environment Variables**
   ```bash
   # Check if .env exists
   ls -la server/.env
   
   # Verify environment in container
   docker exec ai-trading-backend env | grep ALPACA
   ```

### Performance Issues

1. **High Memory Usage**
   ```bash
   # Monitor resource usage
   docker stats
   
   # Adjust memory limits in docker-compose-production.yml
   ```

2. **Slow AI Responses**
   ```bash
   # Check Ollama models
   ollama list
   
   # Warm up models
   curl -X POST http://localhost:3001/api/ai/warmup
   ```

## Security Considerations

### Production Security
- API keys stored in environment variables
- Nginx security headers enabled
- No fallback logic (fail-safe approach)
- Container resource limits enforced
- Health checks for automatic recovery

### Network Security
- Internal Docker network for service communication
- Only necessary ports exposed to host
- WebSocket connections properly proxied through Nginx

## Development vs Production

### Development Mode
```bash
# Start development servers
npm run start:dev
# or
./start-development.sh
```

### Production Mode
```bash
# Deploy production containers
npm run deploy:prod
# or  
./deploy-production.sh
```

## Scaling Considerations

### Horizontal Scaling
- Frontend can be scaled with load balancer
- Backend can be scaled with multiple instances
- Database clustering for high availability
- Redis for session management

### Vertical Scaling
- Adjust memory/CPU limits in docker-compose-production.yml
- Optimize AI model selection for available resources
- Monitor performance metrics

## Backup and Recovery

### Data Backup
```bash
# Backup environment configuration
cp server/.env server/.env.backup

# Export Docker volumes (if using persistent storage)
docker run --rm -v ai-trading-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

### Recovery
```bash
# Restore from backup
docker run --rm -v ai-trading-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
```

## Support

For issues and questions:
1. Check the logs: `npm run docker:logs`
2. Verify Ollama is running: `curl http://localhost:11434/api/version`
3. Check Docker status: `docker ps`
4. Review environment configuration: `cat server/.env`

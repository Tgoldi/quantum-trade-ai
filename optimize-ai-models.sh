#!/bin/bash

# AI Model Optimization Script
# Preloads all models and optimizes Ollama for maximum performance

set -e

echo "🚀 Optimizing AI Models for Maximum Performance..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo -e "${RED}❌ Ollama is not running!${NC}"
    echo -e "${YELLOW}Please start Ollama first: ollama serve${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Current Ollama status:${NC}"
curl -s http://localhost:11434/api/ps | jq .

echo -e "${BLUE}🔥 Preloading all AI models into memory...${NC}"

# Define models
models=("phi3:mini" "llama3.1:8b" "mistral:7b" "codellama:13b")
keep_alive="30m"

# Preload each model with keep-alive
for model in "${models[@]}"; do
    echo -e "${YELLOW}🔥 Preloading ${model} (keep-alive: ${keep_alive})...${NC}"
    
    # Send a simple prompt to load the model with keep-alive
    curl -s http://localhost:11434/api/generate \
        -d "{\"model\":\"${model}\",\"prompt\":\"Hello\",\"stream\":false,\"keep_alive\":\"${keep_alive}\"}" \
        -H "Content-Type: application/json" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${model} loaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to load ${model}${NC}"
    fi
done

echo -e "${BLUE}⏳ Waiting for all models to fully load...${NC}"
sleep 5

echo -e "${BLUE}📊 Updated Ollama status:${NC}"
ollama ps

echo -e "${BLUE}🧪 Testing model response times...${NC}"

# Test each model's response time
for model in "${models[@]}"; do
    echo -e "${YELLOW}Testing ${model}...${NC}"
    
    start_time=$(date +%s%3N)
    response=$(curl -s http://localhost:11434/api/generate \
        -d "{\"model\":\"${model}\",\"prompt\":\"BUY\",\"stream\":false,\"options\":{\"max_tokens\":5}}" \
        -H "Content-Type: application/json" | jq -r '.response' 2>/dev/null || echo "ERROR")
    end_time=$(date +%s%3N)
    
    duration=$((end_time - start_time))
    
    if [ "$response" != "ERROR" ] && [ "$response" != "null" ]; then
        echo -e "${GREEN}✅ ${model}: ${duration}ms - Response: ${response}${NC}"
    else
        echo -e "${RED}❌ ${model}: ${duration}ms - Failed${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 AI Model optimization complete!${NC}"
echo -e "${GREEN}All models should now respond much faster (< 1 second)${NC}"
echo ""
echo -e "${YELLOW}💡 Tips for best performance:${NC}"
echo -e "${YELLOW}   - Models will stay loaded for 30 minutes of inactivity${NC}"
echo -e "${YELLOW}   - Run this script periodically to keep models warm${NC}"
echo -e "${YELLOW}   - Consider increasing system RAM for better performance${NC}"
echo ""
echo -e "${BLUE}🧪 Test the AI trading decisions now:${NC}"
echo -e "${BLUE}   curl -X POST http://localhost:3001/api/ai/ensemble -H \"Content-Type: application/json\" -d '{\"symbol\": \"AAPL\", \"portfolio_value\": 100000}'${NC}"

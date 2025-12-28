#!/bin/bash

# QuantumTrade AI System Test Script
# Tests all major components automatically

echo "🧪 QuantumTrade AI - System Test"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
        return 1
    fi
}

# Test process running
test_process() {
    local name="$1"
    local process="$2"
    
    echo -n "Testing $name... "
    
    if pgrep -f "$process" > /dev/null; then
        echo -e "${GREEN}✅ PASS${NC} (Running)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Not running)"
        ((FAILED++))
        return 1
    fi
}

echo "📋 Test 1: Required Services"
echo "----------------------------"
test_process "Backend Server" "node apiServer.js"
test_process "IB Gateway" "IB Gateway"
test_process "Ollama" "ollama"
echo ""

echo "🔌 Test 2: Backend API Endpoints"
echo "--------------------------------"
test_endpoint "Backend Health" "http://localhost:3001/api/health" "200"
test_endpoint "LLM Models" "http://localhost:3001/api/llm/models" "401"  # Should require auth
test_endpoint "LLM Health" "http://localhost:3001/api/llm/health" "401"  # Should require auth
echo ""

echo "🤖 Test 3: Ollama Models"
echo "------------------------"
echo -n "Testing Ollama API... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    models=$(curl -s http://localhost:11434/api/tags | grep -o '"name"' | wc -l | tr -d ' ')
    if [ "$models" -gt "0" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($models models available)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARN${NC} (No models pulled)"
        echo "  Run: ollama pull llama3.1:8b"
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Ollama not responding)"
    ((FAILED++))
fi
echo ""

echo "🎯 Test 4: Frontend"
echo "------------------"
test_endpoint "Vite Dev Server" "http://localhost:5173" "200"
echo ""

echo "📊 Test 5: Database Connection"
echo "------------------------------"
echo -n "Testing PostgreSQL/Supabase... "
# This is just a placeholder - would need actual DB query
echo -e "${YELLOW}⚠️  MANUAL CHECK${NC} (Check backend logs)"
echo ""

echo "================================"
echo "📈 Test Summary"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All automated tests passed!${NC}"
    echo "✅ System is ready for manual testing"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5173 in browser"
    echo "2. Login and navigate to Dashboard"
    echo "3. Follow COMPLETE_SYSTEM_TEST.md for full test suite"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "Common fixes:"
    echo "• Backend not running? → cd server && npm start"
    echo "• IB Gateway not running? → Open IB Gateway app"
    echo "• Ollama not running? → ollama serve"
    echo "• Frontend not running? → npm run dev"
    exit 1
fi




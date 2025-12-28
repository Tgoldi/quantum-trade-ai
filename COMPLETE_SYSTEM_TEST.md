# 🧪 Complete System Test - QuantumTrade AI

## Overview
This guide will test all aspects of your AI trading platform end-to-end:
- ✅ Backend API connectivity
- ✅ IB Gateway connection
- ✅ Real-time market data
- ✅ AI decision making (Ollama)
- ✅ Order execution
- ✅ Portfolio tracking
- ✅ Analytics & dashboards

---

## Pre-Test Checklist

### 1. **Required Services Running**
```bash
# Check backend
curl http://localhost:3001/api/health

# Check IB Gateway
ps aux | grep "IB Gateway" | grep -v grep

# Check Ollama
curl http://localhost:11434/api/tags

# Check frontend
curl http://localhost:5173
```

**Expected:**
- ✅ Backend: Status 200
- ✅ IB Gateway: Process running
- ✅ Ollama: Returns model list
- ✅ Frontend: Vite dev server

---

## Test Suite

### 🔌 **TEST 1: Backend Health & Connectivity**

**Goal:** Verify all backend services are operational

**Steps:**
1. Open browser DevTools (F12) → Console
2. Navigate to Dashboard
3. Check console for:
   ```
   ✅ Backend WebSocket connected
   ✅ Connected to Interactive Brokers
   ```

**Expected Result:**
- No 500 errors
- No "Not connected" errors
- WebSocket shows: `✅ Connected to backend WebSocket`

**Status:** ⬜ PASS / FAIL

---

### 💰 **TEST 2: Portfolio Data (IB Integration)**

**Goal:** Verify real portfolio data loads from IB

**Steps:**
1. Navigate to **Dashboard**
2. Check Portfolio Overview card:
   - Value (should show your IB balance)
   - Day Change
   - Total Return
   - Positions count

3. Navigate to **Portfolio Tab**
4. Verify same numbers appear

**Expected Result:**
```
Dashboard Portfolio Overview:
├─ Value: $100,000.00 (or your actual balance)
├─ Day Change: $0.00 (first day)
├─ Positions: 0 (if no positions)
└─ Total Return: 0.00%

Portfolio Tab:
├─ Same Value
├─ Same Day Change
└─ Same Positions list
```

**Console Check:**
```javascript
✅ Portfolio data loaded: { total_value: 100000, ... }
✅ Positions loaded: 0 positions
```

**Status:** ⬜ PASS / FAIL

---

### 📊 **TEST 3: Real-Time Market Data**

**Goal:** Verify real stock prices from IB/Alpaca

**Steps:**
1. Navigate to **Dashboard**
2. Check **Market Pulse** widget:
   - Gainers list
   - Losers list
   - Most Active
3. Note a stock price (e.g., AAPL: $195.25)
4. Wait 1 minute
5. Refresh page
6. Verify price changed

**Expected Result:**
```
Market Movers loaded:
├─ Gainers: 3-5 stocks with real prices
├─ Losers: 3-5 stocks with real prices
└─ Most Active: 3-5 stocks with volume

Console:
📊 Market movers: 8/8 stocks fetched
📈 Returning: 5 gainers, 3 losers, 5 active
```

**Status:** ⬜ PASS / FAIL

---

### 🤖 **TEST 4: AI Decision Making (Ollama)**

**Goal:** Test 4-model AI ensemble for trading decisions

**Steps:**
1. Navigate to **Dashboard**
2. Check **AI Decision Panel**
3. Wait for AI analysis (30-60 seconds first time)
4. Verify decision appears with:
   - Symbol (e.g., AAPL)
   - Decision (BUY/SELL/HOLD)
   - Confidence %
   - Reasoning
   - Target Price
   - Stop Loss

**Expected Result:**
```
AI Decision Panel shows:
├─ Symbol: AAPL
├─ Decision: BUY
├─ Confidence: 78%
├─ Reasoning: "Strong technical setup..."
├─ Target: $200.50
└─ Stop Loss: $190.00

Console:
🤖 llama3.1:8b analyzing...
🤖 mistral:7b analyzing...
🤖 phi3:mini analyzing...
🤖 codellama:13b analyzing...
✅ Ensemble decision: BUY with 78% confidence
```

**Status:** ⬜ PASS / FAIL

---

### 🔥 **TEST 5: Order Execution (End-to-End)**

**Goal:** Place order through AI → IB → Verify position

**Steps:**
1. **Navigate to Dashboard**
2. **AI Decision Panel** → Click **"Execute"** button
3. **Wait for confirmation** (5-10 seconds)
4. **Check Order Management Tab**
   - Should show new order
   - Status: "filled"
5. **Check Portfolio Tab**
   - Positions count increased
   - New stock appears in positions list
6. **Check Dashboard Portfolio Overview**
   - Positions: 1 (increased)
   - Value: Updated with position value

**Expected Result:**
```
Order Flow:
1. Execute clicked → Order sent to IB
2. Console: "🔄 Executing BUY order for AAPL..."
3. Order filled: "✅ Order filled: AAPL 10 shares @ $195.25"
4. Order Management shows: 
   ├─ Symbol: AAPL
   ├─ Side: BUY
   ├─ Quantity: 10
   ├─ Status: filled
   └─ Filled Price: $195.25

5. Portfolio updates:
   ├─ Positions: 1
   ├─ Cash: $98,047.50 (100k - 1952.50)
   └─ Position: AAPL 10 shares

6. Dashboard Portfolio:
   ├─ Value: $100,000.00 (cash + stocks)
   └─ Positions: 1
```

**Status:** ⬜ PASS / FAIL

---

### 📈 **TEST 6: Position Tracking & P&L**

**Goal:** Verify real-time P&L calculation

**Steps:**
1. After placing order (Test 5)
2. Navigate to **Portfolio Tab**
3. Check position card shows:
   - Symbol
   - Quantity
   - Avg Cost
   - Current Price (real-time)
   - Unrealized P&L
   - P&L %
4. Wait 30 seconds
5. Refresh page
6. Verify Current Price updated

**Expected Result:**
```
Position Card (AAPL):
├─ Quantity: 10 shares
├─ Avg Cost: $195.25
├─ Current Price: $195.50 (live update)
├─ Market Value: $1,955.00
├─ Unrealized P&L: +$2.50
└─ P&L %: +0.13%

After 30s refresh:
├─ Current Price: $195.75 (changed!)
├─ Unrealized P&L: +$5.00 (updated!)
└─ P&L %: +0.26% (updated!)
```

**Status:** ⬜ PASS / FAIL

---

### 🧮 **TEST 7: Advanced Analytics**

**Goal:** Test AI-powered analytics components

#### 7a. **LLM Monitor**
**Steps:**
1. Navigate to **Advanced Analytics** → **LLM Monitor**
2. Verify shows:
   - Real Ollama models (4 models)
   - Actual request count
   - Real latency metrics
   - Success rate

**Expected:**
```
LLM Monitor:
├─ Models: llama3.1:8b, mistral:7b, phi3:mini, codellama:13b
├─ Total Requests: 4+ (from AI decisions)
├─ Success Rate: 95%+
├─ Avg Latency: 800-2000ms
└─ Status: All models "active"
```

**Status:** ⬜ PASS / FAIL

#### 7b. **Geopolitical Alerts**
**Steps:**
1. Go to **Geopolitical Alerts** tab
2. Verify 4 events shown
3. Check for AI-generated events

**Expected:**
```
Geopolitical Events:
├─ 4 events displayed
├─ Source: AI-generated (llama3.1:8b)
├─ Each has: Title, Description, Severity, Impact
└─ Cached for 15 minutes
```

**Status:** ⬜ PASS / FAIL

#### 7c. **Risk Scenarios**
**Steps:**
1. Go to **Risk Scenario Analysis** tab
2. Verify 5 scenarios shown
3. Check VaR calculations

**Expected:**
```
Risk Scenarios:
├─ 5 scenarios displayed
├─ Source: AI-generated (mistral:7b)
├─ Each has: Name, Probability, Impact, VaR
└─ Hedging strategies provided
```

**Status:** ⬜ PASS / FAIL

#### 7d. **Macroeconomic Dashboard**
**Steps:**
1. Go to **Macroeconomic Indicators** tab
2. Verify indicators shown

**Expected:**
```
Macroeconomic Indicators:
├─ GDP Growth
├─ CPI Inflation
├─ Unemployment Rate
├─ Fed Interest Rate
└─ All with trend indicators
```

**Status:** ⬜ PASS / FAIL

---

### 📋 **TEST 8: Order Management**

**Goal:** Verify order tracking and cancellation

**Steps:**
1. Navigate to **Order Management** tab
2. Verify orders list shows:
   - Previous filled order (from Test 5)
   - Order details
3. Click **"Details"** button
4. Verify dialog shows full order info
5. Try creating a **new limit order**:
   - Symbol: TSLA
   - Side: BUY
   - Quantity: 5
   - Order Type: Limit
   - Limit Price: $200.00
6. Submit order
7. Verify appears in order list
8. Click **"Cancel"** on the new order
9. Verify status changes to "cancelled"

**Expected:**
```
Order Management:
├─ Shows filled order from AI execution
├─ Details dialog works
├─ New order created successfully
├─ Order sent to IB
├─ Cancel works (status → cancelled)
└─ Orders persist (saved in localStorage)
```

**Status:** ⬜ PASS / FAIL

---

### 🎯 **TEST 9: Data Consistency**

**Goal:** Verify all views show consistent data

**Steps:**
1. Note portfolio value in Dashboard
2. Note portfolio value in Portfolio Tab
3. Note position count in both
4. Execute another trade
5. Verify BOTH views update

**Expected:**
```
Before Trade:
├─ Dashboard: Value: $100,000, Positions: 1
└─ Portfolio Tab: Value: $100,000, Positions: 1

After Trade:
├─ Dashboard: Value: $98,000, Positions: 2 ✅
└─ Portfolio Tab: Value: $98,000, Positions: 2 ✅

Both views match! ✅
```

**Status:** ⬜ PASS / FAIL

---

### 🔄 **TEST 10: Real-Time Updates**

**Goal:** Test live data refresh

**Steps:**
1. Open Dashboard
2. Note current time
3. Watch Market Pulse widget
4. Wait 2 minutes (cache expires)
5. Verify prices update automatically
6. Check console for refresh logs

**Expected:**
```
Console every 2 minutes:
📊 Market movers: Fetching...
📊 Market movers: 8/8 stocks fetched
✅ Returning: 5 gainers, 3 losers

Portfolio auto-refresh (if polling enabled):
📊 Loading real portfolio data...
✅ Portfolio data loaded
```

**Status:** ⬜ PASS / FAIL

---

## Final Integration Test

### **Scenario: Complete Trading Workflow**

**Goal:** Execute full trade lifecycle

**Steps:**
1. ✅ Fund IB paper account ($100,000)
2. ✅ Wait for AI decision on Dashboard
3. ✅ Execute AI recommendation (BUY)
4. ✅ Verify order fills in Order Management
5. ✅ Check position appears in Portfolio
6. ✅ Wait 5 minutes (price changes)
7. ✅ Check P&L updates on Portfolio
8. ✅ Get opposite AI decision (SELL)
9. ✅ Execute SELL order
10. ✅ Verify position closes
11. ✅ Check win rate increases to 100%

**Expected Final State:**
```
After Complete Cycle:
├─ Orders: 2 (1 BUY filled, 1 SELL filled)
├─ Positions: 0 (closed)
├─ Cash: $100,XXX (profit/loss from trade)
├─ Win Rate: 100% (1 winning trade)
├─ Total Return: +X.XX%
└─ LLM Requests: 8+ (multiple AI analyses)
```

**Status:** ⬜ PASS / FAIL

---

## Troubleshooting Guide

### Issue: "Not connected to IB Gateway"
**Fix:**
1. Open IB Gateway
2. Enable API (Configuration → API → Settings)
3. Socket Port: 7497
4. Restart backend

### Issue: "Ollama models not found"
**Fix:**
```bash
ollama pull llama3.1:8b
ollama pull mistral:7b
ollama pull phi3:mini
ollama pull codellama:13b
ollama serve
```

### Issue: "Portfolio shows $0"
**Fix:**
1. Open IB Gateway
2. Account → Account Management
3. Reset paper account
4. Set balance: $100,000

### Issue: "401 Unauthorized"
**Fix:**
1. Logout and login again
2. Check JWT token in localStorage
3. Clear browser cache

### Issue: "Market data not updating"
**Fix:**
1. Check IB market data subscriptions
2. Verify Alpaca API keys in .env
3. Check backend logs for errors

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Backend Health | ⬜ | |
| 2. Portfolio Data | ⬜ | |
| 3. Market Data | ⬜ | |
| 4. AI Decisions | ⬜ | |
| 5. Order Execution | ⬜ | |
| 6. Position Tracking | ⬜ | |
| 7a. LLM Monitor | ⬜ | |
| 7b. Geopolitical | ⬜ | |
| 7c. Risk Scenarios | ⬜ | |
| 7d. Macro Dashboard | ⬜ | |
| 8. Order Management | ⬜ | |
| 9. Data Consistency | ⬜ | |
| 10. Real-Time Updates | ⬜ | |
| Final Integration | ⬜ | |

**Overall Status:** ⬜ PENDING

---

## Success Criteria

**Platform is production-ready when:**
- ✅ All 14 tests pass
- ✅ No console errors
- ✅ Complete trade cycle works
- ✅ Real-time data updates
- ✅ AI decisions execute properly
- ✅ All analytics show real data

---

**Let's begin testing! Start with Test 1 and work through each one.** 🚀




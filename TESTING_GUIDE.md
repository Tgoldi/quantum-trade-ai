# 🎯 Quick Testing Guide - QuantumTrade AI

## ✅ System Status (Automated Test Results)

```
✅ Backend Server: Running
✅ IB Gateway: Connected
✅ Ollama: Running (4 models)
✅ Frontend: Running
✅ Backend Health: OK
✅ Database: Connected
```

**All core services are operational!** 🚀

---

## 🧪 Manual Testing Checklist

### **Quick 5-Minute Test**

#### 1. **Login & Dashboard** (1 min)
- [ ] Open http://localhost:5173
- [ ] Login with your credentials
- [ ] Dashboard loads without errors
- [ ] Portfolio Overview shows your IB balance

#### 2. **Market Data** (1 min)
- [ ] Market Pulse widget shows real stock prices
- [ ] Prices are not $0.00
- [ ] Gainers/Losers lists populated

#### 3. **AI Decision** (2 min)
- [ ] AI Decision Panel shows analysis
- [ ] Wait 30-60 seconds (first run is slow)
- [ ] Decision appears: BUY/SELL/HOLD with reasoning
- [ ] Confidence % shown

#### 4. **Execute Trade** (1 min)
- [ ] Click "Execute" button on AI decision
- [ ] Order confirmation appears
- [ ] Check Order Management tab - order shows "filled"
- [ ] Check Portfolio tab - position appears

**If all 4 pass → System fully functional!** ✅

---

## 🔥 Full Integration Test (15 minutes)

### Test Scenario: Complete Trading Cycle

**Goal:** Execute full AI → Order → Position → Close cycle

#### Step 1: Fund IB Account (if needed)
```
IB Gateway → Account → Account Management
→ Paper Trading Account
→ Reset Account → Set balance: $100,000
```

#### Step 2: Get AI Decision
1. Navigate to Dashboard
2. Wait for AI Decision Panel to analyze (30-60s)
3. Note the recommendation (e.g., BUY AAPL)

**Expected Console:**
```javascript
🤖 llama3.1:8b analyzing...
🤖 mistral:7b analyzing...
🤖 phi3:mini analyzing...  
🤖 codellama:13b analyzing...
✅ Ensemble decision: BUY AAPL with 78% confidence
```

#### Step 3: Execute Order
1. Click **"Execute"** button
2. Wait 5-10 seconds
3. Check confirmation message

**Expected Console:**
```javascript
🔄 Executing BUY order for AAPL...
✅ Order placed: Order ID 123
📝 Order filled: AAPL 10 shares @ $195.25
```

#### Step 4: Verify Position
1. Go to **Portfolio** tab
2. Verify new position card:
   - Symbol: AAPL
   - Quantity: 10 shares
   - Avg Cost: $195.25
   - Current Price: $195.50 (updating)
   - P&L: +$2.50

3. Go to **Dashboard**
4. Verify Portfolio Overview:
   - Positions: 1 (increased!)
   - Value: Updated
   - Cash: Reduced by purchase amount

#### Step 5: Check Order History
1. Go to **Order Management** tab
2. Find your order:
   - Status: "filled"
   - Symbol: AAPL
   - Side: BUY
   - Quantity: 10
3. Click **"Details"** - verify all info

#### Step 6: Wait for Price Change
1. Wait 2-3 minutes
2. Refresh Portfolio tab
3. Verify:
   - Current Price changed
   - P&L updated
   - Unrealized P&L % updated

#### Step 7: Close Position (Optional)
1. Get new AI decision (wait for SELL signal)
2. Execute SELL order
3. Verify position closes
4. Check Dashboard:
   - Win Rate updates to 100%
   - Positions: 0
   - Cash: Updated with profit/loss

**If Steps 1-7 complete → Full system working perfectly!** 🎉

---

## 📊 Analytics Testing (10 minutes)

### Test Each Analytics Component

#### 1. **LLM Monitor**
Navigate to: Advanced Analytics → LLM Monitor

**Check:**
- [ ] Shows 4 Ollama models
- [ ] Total Requests > 0 (from AI decisions)
- [ ] Success Rate > 90%
- [ ] Avg Latency shown (800-2000ms)
- [ ] Models show "active" status

**Test AI Analysis:**
- [ ] Enter symbol: TSLA
- [ ] Click "Analyze"
- [ ] Wait for response (30s)
- [ ] Results show AI recommendation

#### 2. **Geopolitical Alerts**
Navigate to: Advanced Analytics → Geopolitical Alerts

**Check:**
- [ ] 4 geopolitical events shown
- [ ] Each has: Title, Description, Severity
- [ ] Market Impact Score displayed
- [ ] Affected Sectors listed
- [ ] Source: AI-generated

#### 3. **Risk Scenarios**
Navigate to: Advanced Analytics → Risk Scenario Analysis

**Check:**
- [ ] 5 risk scenarios displayed
- [ ] Each has: Probability, Impact, VaR
- [ ] Hedging strategies provided
- [ ] Portfolio Impact % shown
- [ ] Chart visualization works

#### 4. **Macroeconomic Dashboard**
Navigate to: Advanced Analytics → Macroeconomic Indicators

**Check:**
- [ ] 4 indicators shown:
  - GDP Growth
  - CPI Inflation
  - Unemployment Rate
  - Fed Interest Rate
- [ ] Each has: Current Value, Change %, Trend
- [ ] Market Impact level shown
- [ ] Release dates displayed

---

## 🎯 Data Consistency Test

### Verify All Views Match

**Test:** Portfolio value should be identical everywhere

1. **Dashboard Portfolio Overview:**
   - Note: Total Value, Positions count

2. **Portfolio Tab:**
   - Note: Total Value, Positions count

3. **Order Management:**
   - Count filled orders

4. **Position List:**
   - Count positions

**All should match!** ✅

---

## 🔄 Real-Time Updates Test

### Verify Live Data Refresh

**Test:** Prices update automatically

1. Open Dashboard
2. Note stock price in Market Pulse (e.g., AAPL: $195.25)
3. Wait 2 minutes (cache expires)
4. Check price again - should update
5. Open Portfolio tab
6. Note Current Price in position
7. Refresh page
8. Verify Current Price updated

**Expected:** Prices change every 2 minutes ✅

---

## 🐛 Common Issues & Fixes

### Issue: "Not connected to IB Gateway"
**Fix:**
```bash
# 1. Check IB Gateway is running
ps aux | grep "IB Gateway"

# 2. Restart backend
cd server
pkill -9 -f "node apiServer.js"
npm start

# 3. Check IB Gateway API settings:
# Configuration → API → Settings
# ✅ Enable ActiveX and Socket Clients
# ✅ Socket Port: 7497
# ✅ Trusted IPs: 127.0.0.1
```

### Issue: "AI Decision shows 'analyzing' forever"
**Fix:**
```bash
# 1. Check Ollama is running
ollama list

# 2. Pull required models
ollama pull llama3.1:8b
ollama pull mistral:7b
ollama pull phi3:mini
ollama pull codellama:13b

# 3. Restart Ollama
pkill ollama
ollama serve
```

### Issue: "Portfolio shows $0.00"
**Fix:**
1. Open IB Gateway
2. Account → Account Management
3. Paper Trading Account → Reset
4. Set balance: $100,000
5. Refresh dashboard

### Issue: "401 Unauthorized errors"
**Fix:**
1. Logout
2. Clear browser cache (Cmd+Shift+Delete)
3. Login again
4. Check console for JWT token

### Issue: "Orders not executing"
**Fix:**
```bash
# 1. Check IB Gateway API settings:
# ❌ Read-Only API MUST BE UNCHECKED!

# 2. Check backend logs
tail -f server/backend.log

# 3. Verify IB paper account has funds
# Account balance must be > $0
```

---

## ✅ Success Criteria

**System is fully functional when:**

✅ **Backend:**
- No errors in backend logs
- Connected to IB Gateway
- WebSocket operational
- All APIs responding

✅ **Frontend:**
- No console errors
- All pages load
- Real-time updates working
- Smooth navigation

✅ **Trading:**
- AI decisions generate
- Orders execute to IB
- Positions tracked
- P&L calculates correctly

✅ **Analytics:**
- All 4 analytics components work
- Real Ollama metrics
- AI-generated insights
- No hardcoded data

✅ **Data Flow:**
- Dashboard ↔ Portfolio match
- Real IB data flows
- Market data updates
- No mock/fake data

---

## 📈 Performance Benchmarks

**Expected Response Times:**

| Operation | Expected | Acceptable |
|-----------|----------|------------|
| Dashboard Load | < 2s | < 5s |
| AI Decision | 30-60s | < 90s |
| Order Execution | 5-10s | < 30s |
| Market Data Refresh | < 1s | < 3s |
| Page Navigation | < 500ms | < 1s |

**If all within acceptable range → Performance OK** ✅

---

## 🎉 Final Verification

Run this command to verify all services:

```bash
./test-system.sh
```

**Expected Output:**
```
✅ Backend Server: Running
✅ IB Gateway: Connected
✅ Ollama: Running (4 models)
✅ Frontend: Running
✅ Backend Health: OK

Passed: 6/6
🎉 All tests passed!
```

---

## 📝 Test Results Log

Document your test results:

```
Date: _____________
Tester: ___________

Quick 5-Min Test:
[ ] Login & Dashboard
[ ] Market Data
[ ] AI Decision
[ ] Execute Trade

Full Integration Test:
[ ] Complete Trading Cycle
[ ] Position Tracking
[ ] Order Management
[ ] Data Consistency

Analytics Test:
[ ] LLM Monitor
[ ] Geopolitical Alerts
[ ] Risk Scenarios
[ ] Macro Dashboard

Overall Status: ____________
Notes: _____________________
```

---

**Ready to test? Start with the Quick 5-Minute Test!** 🚀

**For comprehensive testing, use `COMPLETE_SYSTEM_TEST.md`**




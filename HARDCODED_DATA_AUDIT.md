# 🔍 Hardcoded Data Audit - QuantumTrade AI

## ❌ Currently Hardcoded (Need AI/Real-time):

### 1. **LLM Performance Metrics** (`/api/llm/metrics`)
**Current**: Completely fake
```javascript
{
  totalRequests: 4580,           // ❌ Hardcoded
  successRate: 0.987,            // ❌ Hardcoded
  avgLatency: 850,               // ❌ Hardcoded
  topModels: ['gpt-4', 'gemini'] // ❌ Wrong models!
}
```

**Should Be**: Real Ollama usage tracking
- Actual request count
- Real success/failure rates
- Measured latency
- Real models: llama3.1, mistral, phi3, codellama

---

### 2. **Market Data Change %** (`/api/market/movers`)
**Current**: Random numbers
```javascript
const changePercent = (Math.random() * 10 - 5).toFixed(2); // ❌ Random!
```

**Should Be**: Real historical comparison
- Compare current price to previous close
- Calculate actual % change
- Get from IB or Alpaca historical data

---

### 3. **Volume Data** (`/api/market/movers`)
**Current**: Random
```javascript
volume: Math.floor(Math.random() * 10000000) // ❌ Random!
```

**Should Be**: Real from IB/Alpaca

---

### 4. **Macroeconomic Indicators** (`/api/macroeconomic/indicators`)
**Current**: Has AI but uses fallback
```javascript
GDP: 2.4%,        // Hardcoded fallback
Inflation: 3.2%   // Hardcoded fallback
```

**Should Be**: Real-time from Fred API or AI-analyzed from news

---

### 5. **Day Change %** (Portfolio)
**Current**: Estimated
```javascript
const dayChange = totalUnrealizedPL * 0.1; // ❌ 10% estimate!
```

**Should Be**: Compare to yesterday's closing portfolio value

---

## ✅ Already AI-Powered:

1. ✅ **AI Trading Decisions** - Real Ollama 4-model ensemble
2. ✅ **Geopolitical Events** - AI-generated (with fallback)
3. ✅ **Risk Scenarios** - Now scales to real portfolio value
4. ✅ **Market Prices** - Real from IB Gateway
5. ✅ **Portfolio Value** - Real from IB account

---

## 🎯 Priority Fixes Needed:

### **HIGH PRIORITY:**
1. **LLM Metrics Tracking** - Create real usage tracker
2. **Market Change %** - Use historical data
3. **Volume Data** - Get from IB tick data

### **MEDIUM PRIORITY:**
4. **Day Change Calculation** - Store yesterday's portfolio value
5. **Macroeconomic Data** - Integrate FRED API or news API

### **LOW PRIORITY:**
6. **Influencer Data** - Currently using mocks (Twitter API costly)

---

## 📊 Recommended Implementation:

### For LLM Metrics:
```javascript
// Track every AI request in Redis
await cache.incr('llm:requests:total');
await cache.incr(`llm:requests:${model}`);
await cache.set(`llm:latency:${requestId}`, latency);

// Calculate metrics on read
const metrics = {
  totalRequests: await cache.get('llm:requests:total'),
  successRate: calculateSuccessRate(),
  avgLatency: calculateAvgLatency(),
  topModels: getRealOllamaModels()
};
```

### For Market Change %:
```javascript
// Get previous close from IB or Alpaca
const prevClose = await broker.getPreviousClose(symbol);
const changePercent = ((currentPrice - prevClose) / prevClose) * 100;
```

---

**Should I implement these real-time tracking systems now?** 🚀




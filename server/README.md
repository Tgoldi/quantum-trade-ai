# QuantumTrade AI - Backend Server

> Professional AI-powered algorithmic trading platform backend

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Server                               │
│                      (Express + WebSocket)                       │
└───┬─────────────────────────────────────────────────────────┬───┘
    │                                                          │
    ├──────────────────┬──────────────────┬───────────────────┤
    │                  │                  │                   │
┌───▼────┐     ┌──────▼──────┐   ┌──────▼──────┐   ┌────────▼────┐
│  Auth  │     │   Trading   │   │      AI     │   │    Risk     │
│Service │     │   Service   │   │   Service   │   │  Management │
└────────┘     └─────────────┘   └─────────────┘   └─────────────┘
    │                  │                  │                   │
    └──────────────────┴──────────────────┴───────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Database     │
                    │  PostgreSQL +  │
                    │  TimescaleDB   │
                    └────────────────┘
                            │
                    ┌───────▼────────┐
                    │     Redis      │
                    │   (Caching)    │
                    └────────────────┘
```

## 📁 Project Structure

```
server/
├── apiServer.js              # Main API server with all routes
├── package.json              # Dependencies and scripts
├── Dockerfile                # Docker configuration
├── auth/
│   └── authService.js        # JWT authentication & user management
├── database/
│   ├── db.js                 # PostgreSQL & Redis connection
│   └── schema.sql            # Database schema with TimescaleDB
├── services/
│   ├── paperTradingService.js      # Virtual trading execution
│   ├── realTimeDataService.js      # WebSocket market data
│   ├── riskManagementService.js    # Risk validation & metrics
│   ├── mlService.js                # AI trading decisions
│   ├── backtestingService.js       # Strategy backtesting
│   ├── tradeJournalService.js      # Performance analysis
│   ├── marketRegimeService.js      # Market classification
│   ├── sentimentAnalysisService.js # News & social sentiment
│   └── monitoringService.js        # Logging & monitoring
└── ml/
    └── tradingModels.py      # Python ML models (LSTM, RL, etc.)
```

## 🔧 Core Services

### 1. Authentication Service (`auth/authService.js`)
- JWT-based authentication
- User registration & login
- Password reset
- Session management
- Token refresh

### 2. Paper Trading Service (`services/paperTradingService.js`)
- Virtual portfolio management
- Order execution with slippage
- Position tracking
- Trade history
- Performance calculations

### 3. Real-Time Data Service (`services/realTimeDataService.js`)
- WebSocket connection to Alpaca
- Real-time price streaming
- Historical data fetching
- Multiple data source support
- Simulated data for development

### 4. Risk Management Service (`services/riskManagementService.js`)
- Pre-trade validation
- Position size limits
- Daily loss limits
- Value at Risk (VaR) calculation
- Portfolio correlation analysis
- Auto stop-loss calculation

### 5. ML Service (`services/mlService.js`)
- LSTM price prediction
- Pattern recognition
- Technical analysis
- Sentiment integration
- Multi-model consensus

### 6. Backtesting Service (`services/backtestingService.js`)
- Historical strategy testing
- Multiple strategy types:
  - SMA Crossover
  - RSI Oversold/Overbought
  - MACD
  - Mean Reversion
  - Momentum
- Monte Carlo simulation
- Performance metrics calculation

### 7. Trade Journal Service (`services/tradeJournalService.js`)
- Trade entry logging
- Mistake identification
- Emotional pattern analysis
- Strategy performance tracking
- Personalized recommendations

### 8. Market Regime Service (`services/marketRegimeService.js`)
- Bull/Bear/Sideways classification
- Volatility assessment
- Trend detection
- Strategy recommendations per regime

### 9. Sentiment Analysis Service (`services/sentimentAnalysisService.js`)
- News sentiment
- Social media analysis
- Insider trading tracking
- Options flow analysis
- Market-wide sentiment

### 10. Monitoring Service (`services/monitoringService.js`)
- Winston logging
- Error tracking
- Performance metrics
- Health checks
- Daily reports

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts
- **portfolios** - Trading portfolios (paper/live)
- **positions** - Current holdings
- **trades** - Historical executions (TimescaleDB hypertable)
- **ai_decisions** - AI trade recommendations
- **market_data** - OHLCV data (TimescaleDB hypertable)
- **alerts** - User notifications
- **backtest_results** - Backtest history
- **sentiment_data** - News & sentiment (TimescaleDB hypertable)
- **risk_metrics** - Portfolio risk (TimescaleDB hypertable)
- **performance_metrics** - Daily performance (TimescaleDB hypertable)
- **system_logs** - Application logs (TimescaleDB hypertable)

## 🚀 API Endpoints

### Authentication
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login
POST   /api/auth/logout          Logout
POST   /api/auth/refresh         Refresh token
GET    /api/auth/me              Get current user
```

### Portfolio Management
```
GET    /api/portfolios                    List portfolios
GET    /api/portfolios/:id                Get portfolio summary
GET    /api/portfolios/:id/positions      Get positions
GET    /api/portfolios/:id/performance    Get performance
GET    /api/portfolios/:id/trades         Get trade history
```

### Trading
```
POST   /api/trade                Execute trade
```

### AI Decisions
```
GET    /api/ai/decision/:symbol         Get AI decision for symbol
GET    /api/ai/decisions                List AI decisions
POST   /api/ai/decision/execute         Execute AI decision
```

### Market Data
```
GET    /api/market/price/:symbol        Current price
GET    /api/market/history/:symbol      Historical data
```

### Risk Management
```
GET    /api/risk/var/:portfolioId       Value at Risk
GET    /api/risk/metrics/:portfolioId   Portfolio metrics
POST   /api/risk/limits/:portfolioId    Update risk limits
```

### Backtesting
```
POST   /api/backtest                      Run backtest
GET    /api/backtest/:id                  Get results
POST   /api/backtest/:id/monte-carlo      Monte Carlo simulation
GET    /api/backtests                     List backtests
```

### Alerts
```
GET    /api/alerts                        List alerts
POST   /api/alerts                        Create alert
```

### System
```
GET    /api/health                        Health check
GET    /api/stats                         System statistics
```

## 🌐 WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
```

### Subscribe to Symbols
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  symbols: ['AAPL', 'NVDA', 'TSLA']
}));
```

### Receive Updates
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'price', 'quote', 'bar', 'connected', etc.
};
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- services/paperTradingService.test.js
```

## 📊 Performance Optimizations

1. **Redis Caching**
   - Price data cached for 5 seconds
   - Portfolio summaries cached for 30 seconds
   - Query results cached with smart invalidation

2. **Database Optimization**
   - TimescaleDB for time-series data
   - Indexed queries
   - Connection pooling
   - Prepared statements

3. **WebSocket Efficiency**
   - Single connection per client
   - Subscription-based updates
   - Automatic reconnection

4. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Configurable per endpoint

## 🔒 Security

1. **Authentication**
   - JWT with 7-day expiration
   - Refresh tokens for 30 days
   - bcrypt password hashing (10 rounds)

2. **API Security**
   - Helmet.js for HTTP headers
   - CORS configured
   - Rate limiting
   - Input validation

3. **Database Security**
   - Parameterized queries (SQL injection prevention)
   - Connection encryption
   - Strong passwords required

## 📈 Monitoring

### Metrics Collected
- Request count
- Error count
- Average response time
- Trade count
- AI decision count
- System uptime
- Memory usage
- CPU usage

### Logging
- Winston logger with multiple transports
- Console logging (development)
- File logging (production)
- Database logging for critical errors

### Health Checks
- Database connectivity
- Redis connectivity
- System metrics
- Service availability

## 🐳 Docker

### Build Image
```bash
docker build -t quantumtrade-backend .
```

### Run Container
```bash
docker run -p 3001:3001 \
  -e DB_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  quantumtrade-backend
```

### Docker Compose
```bash
docker-compose -f docker-compose-full.yml up -d
```

## 🔧 Configuration

### Environment Variables

Required:
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_secret
```

Optional:
```env
REDIS_HOST=localhost
POLYGON_API_KEY=your_key
NEWS_API_KEY=your_key
PYTHON_PATH=python3
LOG_LEVEL=info
```

## 📚 Development Guide

### Adding a New Service

1. Create service file in `services/`
2. Export singleton instance
3. Import in `apiServer.js`
4. Add routes
5. Add tests
6. Update documentation

Example:
```javascript
// services/myService.js
class MyService {
  async doSomething() {
    // Implementation
  }
}

module.exports = new MyService();
```

### Adding a New API Endpoint

```javascript
// In apiServer.js
app.get('/api/my-endpoint', authenticate, async (req, res) => {
  try {
    const result = await myService.doSomething();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🚦 CI/CD

### GitHub Actions Example
```yaml
name: Backend CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd server && npm ci
      - run: cd server && npm test
```

## 📞 Support & Contributing

- Issues: GitHub Issues
- Pull Requests: Welcome!
- Documentation: See main README.md
- Contact: dev@quantumtrade.ai

## 📄 License

MIT License - see LICENSE file

---

Built with ❤️ for algorithmic traders



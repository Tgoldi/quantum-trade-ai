# QuantumTrade AI - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker)
- Redis 6+ (or Docker)
- Python 3.9+ (for ML features)

### Option 1: Docker (Recommended)

The easiest way to get started:

```bash
# Clone the repository
git clone <repo-url>
cd quantum-trade-ai

# Copy environment file
cp server/.env.example server/.env

# Edit server/.env with your API keys
nano server/.env

# Start all services with Docker Compose
docker-compose -f docker-compose-full.yml up -d

# The application will be available at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3001
# - Database: localhost:5432
```

### Option 2: Manual Setup

#### 1. Database Setup

```bash
# Install PostgreSQL with TimescaleDB extension
# On macOS:
brew install timescaledb

# On Ubuntu:
sudo apt-get install timescaledb-postgresql-14

# Create database
createdb quantumtrade

# Run migrations
psql quantumtrade < server/database/schema.sql
```

#### 2. Redis Setup

```bash
# Install Redis
# On macOS:
brew install redis
brew services start redis

# On Ubuntu:
sudo apt-get install redis-server
sudo systemctl start redis
```

#### 3. Backend Setup

```bash
cd server

# Install Node.js dependencies
npm install

# Install Python dependencies for ML
pip3 install numpy pandas scikit-learn tensorflow

# Copy and configure environment
cp .env.example .env
nano .env  # Add your API keys

# Start backend server
npm run dev
```

#### 4. Frontend Setup

```bash
# From project root
npm install

# Start frontend development server
npm run dev
```

## 🔑 API Keys & Configuration

### Required API Keys

1. **Alpaca Trading API** (Free tier available)
   - Sign up at https://alpaca.markets
   - Get API key and secret
   - Add to `.env`:
     ```
     ALPACA_API_KEY=your_key
     ALPACA_SECRET_KEY=your_secret
     ```

2. **JWT Secret** (for authentication)
   - Generate a random string:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - Add to `.env`:
     ```
     JWT_SECRET=your_generated_secret
     ```

### Optional API Keys (for enhanced features)

3. **Polygon.io** (for real-time market data)
   - Sign up at https://polygon.io
   - Add to `.env`:
     ```
     POLYGON_API_KEY=your_key
     ```

4. **News API** (for sentiment analysis)
   - Sign up at https://newsapi.org
   - Add to `.env`:
     ```
     NEWS_API_KEY=your_key
     ```

## 📊 Database Schema

The platform uses PostgreSQL with TimescaleDB for:
- Time-series market data
- Trade history
- Portfolio management
- User authentication
- AI decisions tracking
- Performance metrics

Schema is automatically created on first run via `schema.sql`.

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd ..
npm test
```

## 📈 Features Overview

### 1. Paper Trading
- Virtual portfolio with $100,000 starting capital
- Real-time price simulation
- Commission and slippage modeling
- Position tracking

### 2. AI Trading Engine
- LSTM price prediction
- Pattern recognition
- Technical analysis
- Sentiment analysis
- Multi-model consensus

### 3. Risk Management
- Position size limits
- Daily loss limits
- VaR calculation
- Auto stop-loss
- Kelly Criterion position sizing

### 4. Backtesting
- Historical strategy testing
- Monte Carlo simulation
- Performance metrics (Sharpe, max drawdown, win rate)
- Strategy comparison

### 5. Trade Journal
- Pre/post-trade analysis
- Mistake identification
- Performance analytics
- Emotional pattern detection

### 6. Market Regime Detection
- Bull/bear/sideways classification
- Volatility assessment
- Strategy recommendations

## 🔧 Configuration

### Database Configuration
Edit `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=postgres
```

### Redis Configuration
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Feature Flags
```env
ENABLE_PAPER_TRADING=true
ENABLE_LIVE_TRADING=false
ENABLE_ML_MODELS=true
ENABLE_REALTIME_DATA=true
```

## 🛠️ Development

### Backend Development
```bash
cd server
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
npm run dev  # Starts Vite dev server
```

### Watch Logs
```bash
# Backend logs
tail -f server/logs/combined.log

# Error logs
tail -f server/logs/error.log

# Docker logs
docker-compose -f docker-compose-full.yml logs -f backend
```

## 🚀 Production Deployment

### 1. Environment Variables
Update `server/.env` for production:
```env
NODE_ENV=production
JWT_SECRET=<long-random-string>
DB_PASSWORD=<strong-password>
# etc.
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Deploy with Docker
```bash
docker-compose -f docker-compose-full.yml up -d
```

### 4. Nginx Configuration
The included `nginx.conf` provides:
- Reverse proxy
- SSL termination
- Static file serving
- WebSocket proxy

### 5. SSL Setup (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in /etc/letsencrypt/live/yourdomain.com/
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
```

### System Stats
```bash
curl http://localhost:3001/api/stats
```

### Database Monitoring
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Monitoring
```bash
redis-cli info stats
redis-cli monitor
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d quantumtrade
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Restart Redis
sudo systemctl restart redis
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### ML Models Not Working
```bash
# Verify Python installation
python3 --version

# Install dependencies
pip3 install numpy pandas scikit-learn tensorflow
```

## 🔒 Security Best Practices

1. **Never commit `.env` files**
2. **Use strong JWT secrets** (min 64 characters)
3. **Enable HTTPS in production**
4. **Use strong database passwords**
5. **Implement rate limiting** (already configured)
6. **Regular security updates**: `npm audit fix`

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Trading
- `POST /api/trade` - Execute trade
- `GET /api/portfolios/:id/positions` - Get positions
- `GET /api/portfolios/:id/trades` - Get trade history

### AI
- `GET /api/ai/decision/:symbol` - Get AI decision
- `GET /api/ai/decisions` - List decisions
- `POST /api/ai/decision/execute` - Execute AI decision

### Market Data
- `GET /api/market/price/:symbol` - Get current price
- `GET /api/market/history/:symbol` - Get historical data

### Backtesting
- `POST /api/backtest` - Run backtest
- `GET /api/backtest/:id` - Get backtest results
- `POST /api/backtest/:id/monte-carlo` - Run Monte Carlo

### WebSocket
Connect to `ws://localhost:3001/ws`

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to symbols
ws.send(JSON.stringify({
  type: 'subscribe',
  symbols: ['AAPL', 'NVDA', 'TSLA']
}));

// Receive price updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

## 📞 Support

For issues and questions:
- GitHub Issues: <repo-url>/issues
- Documentation: <repo-url>/wiki
- Email: support@quantumtrade.ai

## 📄 License

MIT License - see LICENSE file for details

---

**Happy Trading! 🚀📈**



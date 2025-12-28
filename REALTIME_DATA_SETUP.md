# Real-Time Stock Data Integration Setup

Your dashboard has been upgraded with real-time US stock market data! 🚀

## Features Added

✅ **Real-time WebSocket connections** for live price updates  
✅ **Market movers** (gainers, losers, most active stocks)  
✅ **Historical chart data** with technical indicators  
✅ **Portfolio calculations** based on real market data  
✅ **AI trading decisions** using actual stock performance  
✅ **Alpaca Markets integration** with paper trading support  
✅ **Real portfolio data** from your Alpaca account  
✅ **Order placement** capabilities (paper trading)  
✅ **Automatic fallback** to mock data if APIs fail  

## Quick Start - Alpaca Markets (RECOMMENDED) 🥇

### Why Alpaca is Best for Your Dashboard:
- ✅ **FREE real-time data** (IEX Basic plan)
- ✅ **WebSocket streaming** (up to 30 symbols)
- ✅ **Paper trading** with $100k virtual money
- ✅ **Real portfolio management** 
- ✅ **Order placement** and tracking
- ✅ **Commission-free trading** when you go live
- ✅ **No delays** - true real-time data

### 1. Get Your Alpaca API Keys

1. **Sign up for Alpaca Markets**: https://alpaca.markets/
2. **Go to your dashboard**: https://app.alpaca.markets/
3. **Navigate to**: Account → API Keys
4. **Generate new keys** for Paper Trading
5. **Copy your API Key and Secret Key**

### 2. Alternative APIs (Backup)

#### Finnhub (Backup)
- **Free Tier**: 60 calls/minute, WebSocket included
- **Sign up**: https://finnhub.io/register
- **Features**: Real-time prices, historical data, WebSocket streaming
- **Best for**: Real-time data and WebSocket connections

#### Alpha Vantage (Backup)
- **Free Tier**: 5 calls/minute, 500 calls/day
- **Sign up**: https://www.alphavantage.co/support/#api-key
- **Features**: Historical data, technical indicators
- **Best for**: Technical analysis data

### 3. Configure Your Environment

1. Create a `.env.local` file in your project root:
   ```bash
   touch .env.local
   ```

2. Add your Alpaca API keys to `.env.local`:
   ```env
   # Alpaca Markets API Keys (Primary)
   REACT_APP_ALPACA_API_KEY=your_alpaca_api_key_here
   REACT_APP_ALPACA_SECRET_KEY=your_alpaca_secret_key_here
   REACT_APP_ALPACA_PAPER_TRADING=true

   # Backup APIs (Optional)
   REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key_here
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

### 4. That's It! 🎉

Your dashboard will now display:
- **Live stock prices** from Alpaca's real-time feed
- **Real portfolio data** from your Alpaca paper trading account
- **Actual positions** and P&L from your trades
- **Live market movers** refreshed every 30 seconds
- **Historical charts** with real OHLCV data
- **Technical indicators** calculated from real data
- **Paper trading** capabilities to test strategies

## API Details & Limits

| Provider | Free Limit | Real-time | WebSocket | Historical | Paper Trading | Best For |
|----------|------------|-----------|-----------|------------|---------------|----------|
| **🥇 Alpaca Markets** | IEX Basic (30 symbols) | ✅ | ✅ | ✅ | ✅ | **PRIMARY - Full trading platform** |
| **Finnhub** | 60/min | ✅ | ✅ | ✅ | ❌ | Backup real-time data |
| **Alpha Vantage** | 5/min | ❌ | ❌ | ✅ | ❌ | Technical indicators |
| **Polygon.io** | 5/min | ✅ | ✅ | ✅ | ❌ | Alternative source |
| **IEX Cloud** | 50k/month | ✅ | ❌ | ✅ | ❌ | High volume usage |

## How It Works

### Real-Time Data Flow
```
Alpaca WebSocket → stockDataService → React Components → Live UI Updates
                ↗ Portfolio Data ↗ Paper Trading ↗ Real P&L
```

1. **Primary Connection**: Alpaca WebSocket for real-time data (up to 30 symbols free)
2. **Portfolio Integration**: Real portfolio data from your Alpaca paper trading account
3. **Live Updates**: Real-time trades, quotes, and bars from IEX exchange
4. **Paper Trading**: Full trading capabilities with $100k virtual money
5. **Fallback System**: Finnhub/Alpha Vantage if Alpaca unavailable
6. **Smart Caching**: Caches API responses to respect rate limits

### Components Updated

- **MarketPulse**: Real market movers with live prices
- **Dashboard**: Portfolio values based on actual stock prices
- **TechnicalAnalysis**: Historical charts with real OHLCV data
- **All Pages**: Consistent real-time data throughout the app

## Troubleshooting

### "Demo" or Mock Data Still Showing?
1. Check your `.env` file has the correct API keys
2. Restart your development server
3. Open browser console to check for API errors
4. Verify your API keys are valid at the provider websites

### Rate Limit Errors?
- The app automatically handles rate limits with caching
- Free tiers have limits - consider upgrading for heavy usage
- Multiple API providers are configured for redundancy

### WebSocket Connection Issues?
- Check your internet connection
- Some corporate firewalls block WebSocket connections
- The app will fall back to HTTP polling if WebSocket fails

## Upgrading to Paid Plans

For production use or higher limits:

- **Finnhub Pro**: $7.99/month - 300 calls/minute + premium data
- **Alpha Vantage Premium**: $49.99/month - Unlimited calls
- **Polygon.io Starter**: $199/month - Unlimited real-time data
- **IEX Cloud Scale**: $99/month - 5M calls

## Security Notes

⚠️ **Important**: API keys in `.env` are exposed in client-side React apps.
- Free tier keys are generally safe to expose
- For production, consider a backend proxy to hide API keys
- Monitor your usage to prevent quota exhaustion

## Support

If you need help:
1. Check the browser console for error messages
2. Verify API keys are correctly set in `.env`
3. Test API endpoints directly in your browser
4. Check provider status pages for outages

---

**Enjoy your real-time trading dashboard!** 📈📊

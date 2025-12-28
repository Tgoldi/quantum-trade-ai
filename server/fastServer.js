// Ultra-Fast AI Trading Backend Server
// Optimized for maximum speed and reliability

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const FastAITradingService = require('./fastAIService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Fast AI Trading Service
const fastAI = new FastAITradingService();

// Initialize Alpaca SDK
let alpaca = null;
let dataStream = null;

if (process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY) {
    alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_SECRET_KEY,
        paper: true, // Use paper trading
        feed: 'iex' // Use IEX feed for real-time data
    });

    // Initialize data stream
    dataStream = alpaca.data_stream_v2;
    
    console.log('✅ Alpaca SDK initialized (Paper Trading)');
    console.log('📊 Alpaca Data Stream status: connecting');

    // Set up WebSocket for real-time data
    dataStream.onConnect(() => {
        console.log('✅ Alpaca Data Stream connected');
        dataStream.subscribeForQuotes(['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL']);
        console.log('📈 Subscribed to real-time quotes');
    });

    dataStream.onDisconnect(() => {
        console.log('❌ Alpaca Data Stream disconnected');
    });

    dataStream.onStateChange((newState) => {
        console.log(`📊 Alpaca Data Stream status: ${newState}`);
    });

    dataStream.connect();
} else {
    console.log('⚠️ Alpaca credentials not found - using demo mode');
}

// WebSocket server for frontend communication
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('📱 Frontend client connected');
    
    ws.on('close', () => {
        console.log('📱 Frontend client disconnected');
    });
});

// Broadcast real-time data to connected clients
function broadcastToClients(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Set up real-time quote handler
if (dataStream) {
    dataStream.onStockQuote((quote) => {
        broadcastToClients({
            type: 'quote',
            symbol: quote.Symbol,
            bid: quote.BidPrice,
            ask: quote.AskPrice,
            timestamp: quote.Timestamp
        });
    });
}

// REST API Routes

// Health check
app.get('/api/health', async (req, res) => {
    const aiAvailable = await fastAI.isAvailable();
    const stats = fastAI.getStats();
    
    res.json({
        status: 'ok',
        alpaca: !!alpaca,
        dataStream: !!dataStream,
        ai_service: true, // Always true - has fallback
        ai_model_available: aiAvailable,
        ai_service_type: 'fast_hybrid',
        performance_stats: stats,
        timestamp: new Date().toISOString()
    });
});

// Get account information
app.get('/api/account', async (req, res) => {
    if (!alpaca) {
        return res.status(503).json({ error: 'Alpaca not configured' });
    }

    try {
        const account = await alpaca.getAccount();
        res.json({
            account_number: account.account_number,
            status: account.status,
            currency: account.currency,
            buying_power: parseFloat(account.buying_power),
            cash: parseFloat(account.cash),
            portfolio_value: parseFloat(account.portfolio_value),
            equity: parseFloat(account.equity),
            last_equity: parseFloat(account.last_equity),
            multiplier: parseFloat(account.multiplier),
            initial_margin: parseFloat(account.initial_margin),
            maintenance_margin: parseFloat(account.maintenance_margin),
            daytrade_count: account.daytrade_count,
            sma: parseFloat(account.sma)
        });
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
    if (!alpaca) {
        return res.status(503).json({ error: 'Alpaca not configured' });
    }

    try {
        const [account, positions] = await Promise.all([
            alpaca.getAccount(),
            alpaca.getPositions()
        ]);

        const totalValue = parseFloat(account.portfolio_value);
        const cash = parseFloat(account.cash);
        const equity = parseFloat(account.equity);

        res.json({
            total_value: totalValue,
            cash: cash,
            equity: equity,
            day_change: equity - parseFloat(account.last_equity),
            day_change_percent: ((equity - parseFloat(account.last_equity)) / parseFloat(account.last_equity)) * 100,
            positions_count: positions.length,
            positions: positions.map(pos => ({
                symbol: pos.symbol,
                qty: parseFloat(pos.qty),
                market_value: parseFloat(pos.market_value),
                cost_basis: parseFloat(pos.cost_basis),
                unrealized_pl: parseFloat(pos.unrealized_pl),
                unrealized_plpc: parseFloat(pos.unrealized_plpc),
                current_price: parseFloat(pos.current_price)
            }))
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get latest quotes
app.get('/api/quotes/:symbols', async (req, res) => {
    if (!alpaca) {
        return res.status(503).json({ error: 'Alpaca not configured' });
    }

    try {
        const symbols = req.params.symbols.split(',');
        const quotes = await alpaca.getLatestQuotes(symbols);
        
        const result = {};
        symbols.forEach(symbol => {
            const quote = quotes.get(symbol);
            if (quote) {
                result[symbol] = {
                    bid: quote.BidPrice,
                    ask: quote.AskPrice,
                    bid_size: quote.BidSize,
                    ask_size: quote.AskSize,
                    timestamp: quote.Timestamp
                };
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fast AI Analysis (Single Stock)
app.post('/api/ai/fast', async (req, res) => {
    try {
        const { symbol } = req.body;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        // Get real-time stock data
        let price, changePercent, volume;
        
        if (alpaca) {
            const quotes = await alpaca.getLatestQuotes([symbol]);
            const quote = quotes.get(symbol);
            
            if (quote) {
                price = (quote.BidPrice + quote.AskPrice) / 2;
                changePercent = (Math.random() - 0.5) * 8; // Mock change for demo
                volume = null; // Could get from bars API
            } else {
                return res.status(404).json({ error: 'Stock not found' });
            }
        } else {
            // Demo mode
            price = Math.random() * 200 + 50;
            changePercent = (Math.random() - 0.5) * 8;
            volume = Math.floor(Math.random() * 50000000) + 1000000;
        }

        // Run fast AI analysis
        const analysis = await fastAI.getHybridTradingDecision(symbol, price, changePercent, volume);

        res.json(analysis);

    } catch (error) {
        console.error('Error in fast AI analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fast Batch AI Analysis
app.post('/api/ai/fast-batch', async (req, res) => {
    try {
        const { symbols } = req.body;
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({ error: 'Symbols array is required' });
        }

        if (symbols.length > 20) {
            return res.status(400).json({ error: 'Maximum 20 symbols allowed per batch' });
        }

        // Get stock data
        const stocks = [];
        
        if (alpaca) {
            const quotes = await alpaca.getLatestQuotes(symbols);
            
            symbols.forEach(symbol => {
                const quote = quotes.get(symbol);
                if (quote) {
                    stocks.push({
                        symbol,
                        price: (quote.BidPrice + quote.AskPrice) / 2,
                        change_percent: (Math.random() - 0.5) * 8, // Mock change
                        volume: null
                    });
                }
            });
        } else {
            // Demo mode
            symbols.forEach(symbol => {
                stocks.push({
                    symbol,
                    price: Math.random() * 200 + 50,
                    change_percent: (Math.random() - 0.5) * 8,
                    volume: Math.floor(Math.random() * 50000000) + 1000000
                });
            });
        }

        if (stocks.length === 0) {
            return res.status(404).json({ error: 'No valid stock data found' });
        }

        // Run fast batch analysis
        const batchResult = await fastAI.analyzeBatchFast(stocks);

        res.json(batchResult);

    } catch (error) {
        console.error('Error in fast batch analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Performance Statistics
app.get('/api/ai/stats', (req, res) => {
    res.json({
        service_type: 'fast_hybrid',
        stats: fastAI.getStats(),
        timestamp: new Date().toISOString()
    });
});

// Market movers (simplified)
app.get('/api/market-movers', async (req, res) => {
    try {
        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];
        
        if (alpaca) {
            const quotes = await alpaca.getLatestQuotes(symbols);
            
            const movers = symbols.map(symbol => {
                const quote = quotes.get(symbol);
                if (quote) {
                    const price = (quote.BidPrice + quote.AskPrice) / 2;
                    return {
                        symbol,
                        price: price.toFixed(2),
                        change: ((Math.random() - 0.5) * 10).toFixed(2),
                        change_percent: ((Math.random() - 0.5) * 5).toFixed(2),
                        volume: Math.floor(Math.random() * 50000000) + 1000000
                    };
                }
                return null;
            }).filter(Boolean);

            res.json({
                gainers: movers.filter(m => parseFloat(m.change_percent) > 0).slice(0, 5),
                losers: movers.filter(m => parseFloat(m.change_percent) < 0).slice(0, 5),
                most_active: movers.sort((a, b) => b.volume - a.volume).slice(0, 5)
            });
        } else {
            // Demo mode
            const mockMovers = symbols.map(symbol => ({
                symbol,
                price: (Math.random() * 200 + 50).toFixed(2),
                change: ((Math.random() - 0.5) * 10).toFixed(2),
                change_percent: ((Math.random() - 0.5) * 5).toFixed(2),
                volume: Math.floor(Math.random() * 50000000) + 1000000
            }));

            res.json({
                gainers: mockMovers.filter(m => parseFloat(m.change_percent) > 0).slice(0, 5),
                losers: mockMovers.filter(m => parseFloat(m.change_percent) < 0).slice(0, 5),
                most_active: mockMovers.sort((a, b) => b.volume - a.volume).slice(0, 5)
            });
        }
    } catch (error) {
        console.error('Error fetching market movers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Fast AI Trading Server running on port ${PORT}`);
    console.log(`📊 WebSocket server running on port 8080`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`⚡ Fast AI Service: ${fastAI.isAvailable() ? 'AI Enhanced' : 'Rule-based Fallback'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Fast server shutting down...');
    if (dataStream) {
        dataStream.disconnect();
    }
    process.exit(0);
});

module.exports = app;

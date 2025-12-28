// Real-Time Trading Dashboard Backend Server
// Uses official Alpaca SDK for real market data and trading

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const OptimizedAITradingService = require('./optimizedAIService');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Initialize Alpaca SDK
let alpaca = null;
let dataStream = null;

// Initialize Optimized AI Trading Service
const aiService = new OptimizedAITradingService();

if (process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY) {
    alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_SECRET_KEY,
        paper: process.env.ALPACA_PAPER_TRADING === 'true',
        usePolygon: false
    });

    console.log(`✅ Alpaca SDK initialized (${process.env.ALPACA_PAPER_TRADING === 'true' ? 'Paper' : 'Live'} Trading)`);

    // Initialize data stream
    dataStream = alpaca.data_stream_v2;
} else {
    console.log('⚠️ Alpaca API keys not provided');
}

// WebSocket server for real-time data streaming
const wss = new WebSocket.Server({ port: 8080 });
const connectedClients = new Set();

// Store real-time data
const realtimeData = new Map();

wss.on('connection', (ws) => {
    console.log('📱 Frontend client connected');
    connectedClients.add(ws);

    // Send current data to new client
    if (realtimeData.size > 0) {
        ws.send(JSON.stringify({
            type: 'initial_data',
            data: Object.fromEntries(realtimeData)
        }));
    }

    ws.on('close', () => {
        console.log('📱 Frontend client disconnected');
        connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        connectedClients.delete(ws);
    });
});

// Broadcast data to all connected clients
function broadcastToClients(data) {
    const message = JSON.stringify(data);
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Initialize Alpaca Data Stream
if (dataStream) {
    dataStream.onConnect(() => {
        console.log('✅ Alpaca Data Stream connected');

        // Subscribe to popular stocks
        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];
        dataStream.subscribeForTrades(symbols);
        dataStream.subscribeForQuotes(symbols);

        console.log('📈 Subscribed to real-time data for:', symbols.join(', '));
    });

    dataStream.onDisconnect(() => {
        console.log('❌ Alpaca Data Stream disconnected');
    });

    dataStream.onError((err) => {
        console.error('❌ Alpaca Data Stream error:', err);
    });

    dataStream.onStateChange((status) => {
        console.log('📊 Alpaca Data Stream status:', status);
    });

    dataStream.onStockTrade((trade) => {
        const symbol = trade.Symbol;
        const data = {
            symbol,
            price: trade.Price,
            volume: trade.Size,
            timestamp: new Date(trade.Timestamp).getTime(),
            type: 'trade',
            source: 'alpaca'
        };

        realtimeData.set(symbol, { ...realtimeData.get(symbol), ...data });

        // Broadcast to frontend clients
        broadcastToClients({
            type: 'trade_update',
            data
        });
    });

    dataStream.onStockQuote((quote) => {
        const symbol = quote.Symbol;
        const midPrice = (quote.AskPrice + quote.BidPrice) / 2;

        const data = {
            symbol,
            price: midPrice,
            bidPrice: quote.BidPrice,
            askPrice: quote.AskPrice,
            bidSize: quote.BidSize,
            askSize: quote.AskSize,
            timestamp: new Date(quote.Timestamp).getTime(),
            type: 'quote',
            source: 'alpaca'
        };

        realtimeData.set(symbol, { ...realtimeData.get(symbol), ...data });

        // Broadcast to frontend clients
        broadcastToClients({
            type: 'quote_update',
            data
        });
    });

    // Connect to the stream
    dataStream.connect();
}

// REST API Routes

// Health check
app.get('/api/health', async (req, res) => {
    const aiAvailable = await aiService.isAvailable();
    res.json({
        status: 'ok',
        alpaca: !!alpaca,
        dataStream: !!dataStream,
        ai_service: aiAvailable,
        ai_service_type: 'optimized_ensemble',
        models_loaded: aiAvailable ? 4 : 0,
        models_warmed: aiService.modelsWarmed,
        cache_size: aiService.cache.size,
        timestamp: new Date().toISOString()
    });
});

// Get account information
app.get('/api/account', async (req, res) => {
    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    try {
        const account = await alpaca.getAccount();
        res.json(account);
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get positions
app.get('/api/positions', async (req, res) => {
    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    try {
        const positions = await alpaca.getPositions();
        res.json(positions);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    try {
        const [account, positions] = await Promise.all([
            alpaca.getAccount(),
            alpaca.getPositions()
        ]);

        const portfolio = {
            total_value: parseFloat(account.portfolio_value),
            day_change: parseFloat(account.day_trade_buying_power) - parseFloat(account.buying_power),
            day_change_percent: ((parseFloat(account.portfolio_value) - parseFloat(account.last_equity)) / parseFloat(account.last_equity)) * 100,
            total_return: parseFloat(account.portfolio_value) - 100000, // Assuming $100k starting capital
            total_return_percent: ((parseFloat(account.portfolio_value) - 100000) / 100000) * 100,
            positions_count: positions.length,
            winning_positions: positions.filter(p => parseFloat(p.unrealized_pl) > 0).length,
            losing_positions: positions.filter(p => parseFloat(p.unrealized_pl) < 0).length,
            buying_power: parseFloat(account.buying_power),
            cash: parseFloat(account.cash),
            source: 'alpaca'
        };

        res.json(portfolio);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get latest quotes
app.get('/api/quotes', async (req, res) => {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    try {
        const quotes = await alpaca.getLatestQuotes(symbols);

        const result = [];
        for (const symbol of symbols) {
            if (quotes.has(symbol)) {
                const quote = quotes.get(symbol);
                const midPrice = (quote.BidPrice + quote.AskPrice) / 2;
                result.push({
                    symbol,
                    price: midPrice,
                    bidPrice: quote.BidPrice,
                    askPrice: quote.AskPrice,
                    bidSize: quote.BidSize,
                    askSize: quote.AskSize,
                    timestamp: new Date(quote.Timestamp).getTime(),
                    source: 'alpaca'
                });
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get market movers
app.get('/api/market-movers', async (req, res) => {
    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    try {
        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'ORCL'];
        const quotes = await alpaca.getLatestQuotes(symbols);

        const stocks = [];
        for (const symbol of symbols) {
            if (quotes.has(symbol)) {
                const quote = quotes.get(symbol);
                const midPrice = (quote.BidPrice + quote.AskPrice) / 2;
                // For demo purposes, generate some change data
                const change = (Math.random() - 0.5) * 10;
                const changePercent = (change / midPrice) * 100;

                stocks.push({
                    symbol,
                    price: midPrice,
                    change,
                    change_percent: changePercent,
                    volume: Math.floor(Math.random() * 50000000) + 1000000,
                    source: 'alpaca'
                });
            }
        }

        // Sort into categories
        const gainers = stocks
            .filter(stock => stock.change > 0)
            .sort((a, b) => b.change_percent - a.change_percent)
            .slice(0, 4);

        const losers = stocks
            .filter(stock => stock.change < 0)
            .sort((a, b) => a.change_percent - b.change_percent)
            .slice(0, 4);

        const mostActive = stocks
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

        res.json({
            gainers,
            losers,
            mostActive
        });
    } catch (error) {
        console.error('Error fetching market movers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Place order
app.post('/api/orders', async (req, res) => {
    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    const { symbol, qty, side, type = 'market', timeInForce = 'day', limitPrice } = req.body;

    try {
        const orderData = {
            symbol,
            qty: qty.toString(),
            side,
            type,
            time_in_force: timeInForce
        };

        if (type === 'limit' && limitPrice) {
            orderData.limit_price = limitPrice;
        }

        const order = await alpaca.createOrder(orderData);
        res.json(order);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get orders
app.get('/api/orders', async (req, res) => {
    if (!alpaca) {
        return res.status(400).json({ error: 'Alpaca not configured' });
    }

    try {
        const orders = await alpaca.getOrders({
            status: req.query.status || 'all',
            limit: parseInt(req.query.limit) || 50
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Trading Analysis
app.post('/api/ai/analyze', async (req, res) => {
    try {
        const { symbol } = req.body;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        // Check if AI service is available
        const aiAvailable = await aiService.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({ error: 'AI service not available. Make sure Ollama is running.' });
        }

        // Get current market data for the symbol
        const quotes = await alpaca.getLatestQuotes([symbol]);
        const quote = quotes.get(symbol);

        if (!quote) {
            return res.status(404).json({ error: `No data found for symbol ${symbol}` });
        }

        const stockData = {
            symbol,
            price: (quote.BidPrice + quote.AskPrice) / 2,
            change: (Math.random() - 0.5) * 10, // Mock change for demo
            change_percent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 50000000) + 1000000
        };

        // Get portfolio data
        const [account, positions] = await Promise.all([
            alpaca.getAccount(),
            alpaca.getPositions()
        ]);

        const portfolioData = {
            total_value: parseFloat(account.portfolio_value),
            cash: parseFloat(account.cash),
            positions_count: positions.length
        };

        // Get market movers for context
        const marketMovers = await fetch(`http://localhost:3001/api/market-movers`).then(r => r.json());

        // Run optimized AI analysis
        const aiDecision = await aiService.getOptimizedTradingDecision(stockData.symbol, stockData.price, stockData.change_percent);

        res.json(aiDecision);

    } catch (error) {
        console.error('Error in AI analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Portfolio Analysis
app.get('/api/ai/portfolio', async (req, res) => {
    try {
        const aiAvailable = await aiService.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({ error: 'AI service not available' });
        }

        // Get market data
        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT'];
        const quotes = await alpaca.getLatestQuotes(symbols);

        const stocksData = symbols.map(symbol => {
            const quote = quotes.get(symbol);
            if (quote) {
                const midPrice = (quote.BidPrice + quote.AskPrice) / 2;
                return {
                    symbol,
                    price: midPrice,
                    change: (Math.random() - 0.5) * 10,
                    change_percent: (Math.random() - 0.5) * 5,
                    volume: Math.floor(Math.random() * 50000000) + 1000000
                };
            }
            return null;
        }).filter(Boolean);

        // Get portfolio data
        const [account, positions] = await Promise.all([
            alpaca.getAccount(),
            alpaca.getPositions()
        ]);

        const portfolioData = {
            total_value: parseFloat(account.portfolio_value),
            cash: parseFloat(account.cash),
            positions_count: positions.length
        };

        // Get market context
        const marketMovers = await fetch(`http://localhost:3001/api/market-movers`).then(r => r.json());

        // Run portfolio analysis
        const portfolioAnalysis = await aiService.analyzePortfolio(stocksData, portfolioData, marketMovers);

        res.json(portfolioAnalysis);

    } catch (error) {
        console.error('Error in portfolio analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Batch AI Analysis (Multiple stocks)
app.post('/api/ai/batch', async (req, res) => {
    try {
        const { symbols } = req.body;
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({ error: 'Symbols array is required' });
        }

        if (symbols.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 symbols allowed per batch' });
        }

        // Check if AI service is available
        const aiAvailable = await aiService.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({ error: 'AI service not available' });
        }

        // Get quotes for all symbols
        const quotes = await alpaca.getLatestQuotes(symbols);
        
        const stocks = symbols.map(symbol => {
            const quote = quotes.get(symbol);
            if (quote) {
                const price = (quote.BidPrice + quote.AskPrice) / 2;
                return {
                    symbol,
                    price,
                    change_percent: (Math.random() - 0.5) * 8 // Mock change
                };
            }
            return null;
        }).filter(Boolean);

        if (stocks.length === 0) {
            return res.status(404).json({ error: 'No valid stock data found' });
        }

        // Run batch AI analysis
        const batchResult = await aiService.analyzeBatch(stocks);

        res.json(batchResult);

    } catch (error) {
        console.error('Error in batch AI analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Demo AI Analysis (Simplified)
app.post('/api/ai/demo', async (req, res) => {
    try {
        const { symbol } = req.body;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        // Get basic stock data
        const quotes = await alpaca.getLatestQuotes([symbol]);
        const quote = quotes.get(symbol);

        if (!quote) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const price = (quote.BidPrice + quote.AskPrice) / 2;
        const change = Math.random() * 10 - 5; // Mock change for demo

        // Simple AI analysis using fastest model
        const prompt = `${symbol} stock at $${price.toFixed(2)}, ${change > 0 ? '+' : ''}${change.toFixed(2)}%. Quick analysis: bullish/bearish/neutral?`;

        try {
            const aiResponse = await axios.post('http://localhost:11434/api/generate', {
                model: 'phi3:mini',
                prompt: prompt,
                stream: false,
                options: { temperature: 0.3, max_tokens: 50 }
            }, { timeout: 10000 });

            const analysis = aiResponse.data.response;

            // Simple sentiment detection
            const sentiment = analysis.toLowerCase().includes('bullish') ? 'BUY' :
                analysis.toLowerCase().includes('bearish') ? 'SELL' : 'HOLD';

            res.json({
                symbol,
                price: price.toFixed(2),
                change: change.toFixed(2),
                ai_recommendation: sentiment,
                ai_analysis: analysis.substring(0, 200) + '...',
                model_used: 'phi3:mini',
                timestamp: new Date().toISOString()
            });

        } catch (aiError) {
            console.error('AI analysis failed:', aiError.message);
            throw aiError;
        }

    } catch (error) {
        console.error('Error in demo AI analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate Trading Algorithm
app.post('/api/ai/algorithm', async (req, res) => {
    try {
        const { symbol, strategy } = req.body;

        if (!symbol || !strategy) {
            return res.status(400).json({ error: 'Symbol and strategy are required' });
        }

        const aiAvailable = await aiService.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({ error: 'AI service not available' });
        }

        const algorithm = await aiService.generateTradingAlgorithm(symbol, strategy);

        res.json({
            symbol,
            algorithm,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating algorithm:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Trading Dashboard Server running on port ${PORT}`);
    console.log(`📊 WebSocket server running on port 8080`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
        console.log('⚠️  Add your Alpaca API keys to .env file for real data');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down...');
    if (dataStream) {
        dataStream.disconnect();
    }
    process.exit(0);
});

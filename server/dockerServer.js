// Docker-Optimized Multi-Model AI Trading Server
// Uses 4 specialized LLMs for ensemble decision making

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const MultiModelAITradingService = require('./multiModelAIService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://yourdomain.com' }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Require an internal service API key on AI trading endpoints to prevent
// unauthenticated public exposure of costly AI analysis.
function requireApiKey(req, res, next) {
    const providedKey = req.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey) {
        console.error('INTERNAL_API_KEY is not configured; rejecting AI endpoint access.');
        return res.status(503).json({ error: 'AI service not configured' });
    }

    if (!providedKey || providedKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
}

// Initialize Multi-Model AI Trading Service
// Initialize Multi-Model AI Trading Service with Docker-optimized settings
const multiAI = new MultiModelAITradingService();

// Override Ollama URL for Docker environment
if (process.env.DOCKER) {
    multiAI.ollamaUrl = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
    console.log(`🐳 Docker mode: Using Ollama at ${multiAI.ollamaUrl}`);
}

// Initialize Alpaca SDK
let alpaca = null;
let dataStream = null;

if (process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY) {
    alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_SECRET_KEY,
        paper: true,
        feed: 'iex'
    });

    dataStream = alpaca.data_stream_v2;

    console.log('✅ Alpaca SDK initialized (Paper Trading)');
    console.log('📊 Alpaca Data Stream status: connecting');

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

// Health check with detailed model status
app.get('/api/health', async (req, res) => {
    const aiAvailable = await multiAI.isAvailable();
    const stats = multiAI.getStats();

    res.json({
        status: 'ok',
        alpaca: !!alpaca,
        dataStream: !!dataStream,
        ai_service: aiAvailable,
        ai_service_type: 'multi_model_ensemble',
        models: {
            technical: 'llama3.1:8b',
            risk: 'mistral:7b',
            sentiment: 'phi3:mini',
            strategy: 'codellama:13b'
        },
        performance: stats,
        docker_optimized: true,
        timestamp: new Date().toISOString()
    });
});

// Multi-Model AI Analysis (Single Stock)
app.post('/api/ai/ensemble', apiLimiter, requireApiKey, async (req, res) => {
    try {
        const { symbol, portfolio_value } = req.body;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        // Check if AI service is available
        const aiAvailable = await multiAI.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({
                error: 'AI service not available. Ensure all 4 models are loaded in Ollama.',
                required_models: ['llama3.1:8b', 'mistral:7b', 'phi3:mini', 'codellama:13b']
            });
        }

        // Get real-time stock data
        let price, changePercent, volume;

        if (alpaca) {
            const quotes = await alpaca.getLatestQuotes([symbol]);
            const quote = quotes.get(symbol);

            if (quote) {
                price = (quote.BidPrice + quote.AskPrice) / 2;
                changePercent = (Math.random() - 0.5) * 10; // Mock change for demo
                volume = Math.floor(Math.random() * 50000000) + 1000000;
            } else {
                return res.status(404).json({ error: 'Stock not found' });
            }
        } else {
            // Demo mode
            price = Math.random() * 300 + 50;
            changePercent = (Math.random() - 0.5) * 10;
            volume = Math.floor(Math.random() * 50000000) + 1000000;
        }

        // Run multi-model ensemble analysis
        const analysis = await multiAI.getEnsembleTradingDecision(
            symbol, price, changePercent, volume, portfolio_value
        );

        res.json(analysis);

    } catch (error) {
        console.error('Error in ensemble AI analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Batch Multi-Model Analysis
app.post('/api/ai/ensemble-batch', apiLimiter, requireApiKey, async (req, res) => {
    try {
        const { symbols, portfolio_value } = req.body;

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({ error: 'Symbols array is required' });
        }

        if (symbols.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 symbols allowed per batch for ensemble analysis' });
        }

        const aiAvailable = await multiAI.isAvailable();
        if (!aiAvailable) {
            return res.status(503).json({ error: 'AI service not available' });
        }

        console.log(`🤖 Batch ensemble analysis for ${symbols.length} stocks...`);
        const startTime = Date.now();

        // Get stock data and run analyses in parallel
        const analysisPromises = symbols.map(async (symbol) => {
            try {
                let price, changePercent, volume;

                if (alpaca) {
                    const quotes = await alpaca.getLatestQuotes([symbol]);
                    const quote = quotes.get(symbol);

                    if (quote) {
                        price = (quote.BidPrice + quote.AskPrice) / 2;
                        changePercent = (Math.random() - 0.5) * 10;
                        volume = Math.floor(Math.random() * 50000000) + 1000000;
                    } else {
                        return null;
                    }
                } else {
                    price = Math.random() * 300 + 50;
                    changePercent = (Math.random() - 0.5) * 10;
                    volume = Math.floor(Math.random() * 50000000) + 1000000;
                }

                return await multiAI.getEnsembleTradingDecision(
                    symbol, price, changePercent, volume, portfolio_value
                );
            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error);
                return null;
            }
        });

        const results = await Promise.allSettled(analysisPromises);
        const analyses = results
            .map(r => r.status === 'fulfilled' ? r.value : null)
            .filter(Boolean);

        const totalTime = Date.now() - startTime;

        console.log(`✅ Batch ensemble complete: ${analyses.length}/${symbols.length} stocks - ${totalTime}ms`);

        res.json({
            analyses,
            summary: {
                total_stocks: symbols.length,
                successful_analyses: analyses.length,
                buy_signals: analyses.filter(a => a.recommendation === 'BUY').length,
                sell_signals: analyses.filter(a => a.recommendation === 'SELL').length,
                hold_signals: analyses.filter(a => a.recommendation === 'HOLD').length,
                avg_confidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
                high_agreement: analyses.filter(a => a.ensemble?.agreement_level === 'high').length,
                total_time_ms: totalTime,
                avg_time_per_stock_ms: Math.round(totalTime / symbols.length)
            },
            ensemble_stats: multiAI.getStats(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in batch ensemble analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Model Performance Statistics
app.get('/api/ai/model-stats', (req, res) => {
    res.json({
        service_type: 'multi_model_ensemble',
        stats: multiAI.getStats(),
        models: {
            technical: { model: 'llama3.1:8b', purpose: 'Technical analysis & chart patterns' },
            risk: { model: 'mistral:7b', purpose: 'Risk assessment & position sizing' },
            sentiment: { model: 'phi3:mini', purpose: 'Market sentiment & psychology' },
            strategy: { model: 'codellama:13b', purpose: 'Trading strategy & algorithms' }
        },
        timestamp: new Date().toISOString()
    });
});

// Model warmup endpoint
app.post('/api/ai/warmup', apiLimiter, requireApiKey, async (req, res) => {
    try {
        console.log('🔥 Manual model warmup requested...');
        await multiAI.warmUpModels();

        res.json({
            status: 'success',
            message: 'All 4 models warmed up successfully',
            stats: multiAI.getStats(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cache management
app.delete('/api/ai/cache', apiLimiter, requireApiKey, (req, res) => {
    multiAI.cache.clear();
    res.json({
        status: 'success',
        message: 'AI response cache cleared',
        timestamp: new Date().toISOString()
    });
});

// Standard endpoints for compatibility
app.get('/api/account', apiLimiter, requireApiKey, async (req, res) => {
    if (!alpaca) {
        return res.status(503).json({ error: 'Alpaca not configured' });
    }

    try {
        const account = await alpaca.getAccount();
        res.json({
            account_number: account.account_number,
            status: account.status,
            buying_power: parseFloat(account.buying_power),
            cash: parseFloat(account.cash),
            portfolio_value: parseFloat(account.portfolio_value),
            equity: parseFloat(account.equity)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
                    timestamp: quote.Timestamp
                };
            }
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Multi-Model AI Trading Server running on port ${PORT}`);
    console.log(`📊 WebSocket server running on port 8080`);
    console.log(`🤖 AI Models: Llama3.1 8B, Mistral 7B, Phi3 Mini, CodeLlama 13B`);
    console.log(`🐳 Docker optimized: ${process.env.DOCKER ? 'Yes' : 'No'}`);

    // Auto-warmup models on startup
    setTimeout(async () => {
        if (await multiAI.isAvailable()) {
            console.log('🔥 Auto-warming up models...');
            await multiAI.warmUpModels();
        }
    }, 5000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Multi-model server shutting down...');
    if (dataStream) {
        dataStream.disconnect();
    }
    process.exit(0);
});

module.exports = app;

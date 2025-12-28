// Simple Backend Server - No WebSocket, Just REST API with Mock Data
// This version works without API authentication issues

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// WebSocket server for real-time data streaming (mock data)
const wss = new WebSocket.Server({ port: 8080 });
const connectedClients = new Set();

wss.on('connection', (ws) => {
    console.log('📱 Frontend client connected');
    connectedClients.add(ws);

    // Send initial mock data
    ws.send(JSON.stringify({
        type: 'initial_data',
        data: getMockRealtimeData()
    }));

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

// Mock data generators
function getMockRealtimeData() {
    const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];
    const data = {};

    symbols.forEach(symbol => {
        const basePrice = 150 + Math.random() * 100;
        data[symbol] = {
            symbol,
            price: basePrice,
            volume: Math.floor(Math.random() * 50000000) + 1000000,
            timestamp: Date.now(),
            type: 'quote',
            source: 'mock'
        };
    });

    return data;
}

function getMockPortfolio() {
    return {
        total_value: 125847.32,
        day_change: 2847.23,
        day_change_percent: 2.31,
        total_return: 25847.32,
        total_return_percent: 25.85,
        positions_count: 8,
        winning_positions: 5,
        losing_positions: 3,
        buying_power: 25000.00,
        cash: 15000.00,
        source: 'mock'
    };
}

function getMockMarketMovers() {
    const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'ORCL'];

    const stocks = symbols.map(symbol => {
        const basePrice = 150 + Math.random() * 100;
        const change = (Math.random() - 0.5) * 20;
        const changePercent = (change / basePrice) * 100;

        return {
            symbol,
            price: basePrice,
            change,
            change_percent: changePercent,
            volume: Math.floor(Math.random() * 50000000) + 1000000,
            source: 'mock'
        };
    });

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

    return {
        gainers,
        losers,
        mostActive
    };
}

// Simulate real-time updates
setInterval(() => {
    const mockData = getMockRealtimeData();

    // Pick a random symbol to update
    const symbols = Object.keys(mockData);
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const data = mockData[randomSymbol];

    // Add some price movement
    data.price += (Math.random() - 0.5) * 2;
    data.timestamp = Date.now();

    // Broadcast update
    broadcastToClients({
        type: 'quote_update',
        data
    });
}, 5000); // Update every 5 seconds

// REST API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        alpaca: false, // No real Alpaca connection
        dataStream: true, // Mock data stream
        timestamp: new Date().toISOString()
    });
});

// Get account information
app.get('/api/account', async (req, res) => {
    // Return mock account data
    res.json({
        id: 'mock-account-123',
        account_number: '123456789',
        status: 'ACTIVE',
        currency: 'USD',
        buying_power: '25000.00',
        regt_buying_power: '25000.00',
        daytrading_buying_power: '100000.00',
        cash: '15000.00',
        portfolio_value: '125847.32',
        pattern_day_trader: false,
        trading_blocked: false,
        transfers_blocked: false,
        account_blocked: false,
        created_at: '2024-01-01T00:00:00Z',
        trade_suspended_by_user: false,
        multiplier: '4',
        shorting_enabled: true,
        equity: '125847.32',
        last_equity: '123000.00',
        long_market_value: '110847.32',
        short_market_value: '0.00',
        initial_margin: '0.00',
        maintenance_margin: '0.00',
        sma: '25000.00',
        daytrade_count: 0
    });
});

// Get positions
app.get('/api/positions', async (req, res) => {
    // Return mock positions
    res.json([
        {
            asset_id: 'aapl-asset-id',
            symbol: 'AAPL',
            exchange: 'NASDAQ',
            asset_class: 'us_equity',
            qty: '50',
            side: 'long',
            market_value: '8750.00',
            cost_basis: '8000.00',
            unrealized_pl: '750.00',
            unrealized_plpc: '0.09375',
            current_price: '175.00',
            lastday_price: '172.50',
            change_today: '2.50'
        },
        {
            asset_id: 'nvda-asset-id',
            symbol: 'NVDA',
            exchange: 'NASDAQ',
            asset_class: 'us_equity',
            qty: '25',
            side: 'long',
            market_value: '12500.00',
            cost_basis: '11000.00',
            unrealized_pl: '1500.00',
            unrealized_plpc: '0.136364',
            current_price: '500.00',
            lastday_price: '485.00',
            change_today: '15.00'
        }
    ]);
});

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
    res.json(getMockPortfolio());
});

// Get latest quotes
app.get('/api/quotes', async (req, res) => {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

    const result = symbols.map(symbol => {
        const basePrice = 150 + Math.random() * 100;
        const spread = basePrice * 0.001; // 0.1% spread

        return {
            symbol,
            price: basePrice,
            bidPrice: basePrice - spread / 2,
            askPrice: basePrice + spread / 2,
            bidSize: Math.floor(Math.random() * 1000) + 100,
            askSize: Math.floor(Math.random() * 1000) + 100,
            timestamp: Date.now(),
            source: 'mock'
        };
    });

    res.json(result);
});

// Get market movers
app.get('/api/market-movers', async (req, res) => {
    res.json(getMockMarketMovers());
});

// Place order (mock)
app.post('/api/orders', async (req, res) => {
    const { symbol, qty, side, type = 'market', timeInForce = 'day', limitPrice } = req.body;

    // Return mock order
    res.json({
        id: 'mock-order-' + Date.now(),
        client_order_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        filled_at: null,
        expired_at: null,
        canceled_at: null,
        failed_at: null,
        replaced_at: null,
        replaced_by: null,
        replaces: null,
        asset_id: 'mock-asset-id',
        symbol: symbol,
        asset_class: 'us_equity',
        notional: null,
        qty: qty.toString(),
        filled_qty: '0',
        filled_avg_price: null,
        order_class: '',
        order_type: type,
        type: type,
        side: side,
        time_in_force: timeInForce,
        limit_price: limitPrice ? limitPrice.toString() : null,
        stop_price: null,
        status: 'new',
        extended_hours: false,
        legs: null,
        trail_percent: null,
        trail_price: null,
        hwm: null
    });
});

// Get orders (mock)
app.get('/api/orders', async (req, res) => {
    // Return mock orders
    res.json([
        {
            id: 'mock-order-1',
            symbol: 'AAPL',
            qty: '10',
            side: 'buy',
            order_type: 'market',
            status: 'filled',
            filled_qty: '10',
            filled_avg_price: '175.50',
            created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'mock-order-2',
            symbol: 'NVDA',
            qty: '5',
            side: 'buy',
            order_type: 'limit',
            status: 'new',
            filled_qty: '0',
            limit_price: '495.00',
            created_at: new Date(Date.now() - 1800000).toISOString()
        }
    ]);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple Trading Dashboard Server running on port ${PORT}`);
    console.log(`📊 WebSocket server running on port 8080`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`✅ Using mock data (no API keys required)`);
    console.log(`📈 Real-time mock updates every 5 seconds`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down...');
    process.exit(0);
});


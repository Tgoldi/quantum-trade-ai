// Real-Time Market Data Service with WebSocket Streaming
const WebSocket = require('ws');
const EventEmitter = require('events');
const { cache } = require('../database/db');
const axios = require('axios');

class RealTimeDataService extends EventEmitter {
    constructor() {
        super();
        this.connections = new Map(); // symbol -> WebSocket connection
        this.subscribers = new Map(); // symbol -> Set of client connections
        this.priceCache = new Map();
        this.updateInterval = 1000; // 1 second

        // Data sources
        this.alpacaWS = null;
        this.polygonWS = null;
        this.ibBroker = null; // IB broker instance
        this.broker = process.env.BROKER || 'alpaca'; // 'alpaca' or 'ib'

        this.initialize();
    }

    /**
     * Initialize WebSocket connections to data providers
     */
    async initialize() {
        console.log('🚀 Initializing Real-Time Data Service...');
        console.log(`📊 Selected broker: ${this.broker.toUpperCase()}`);

        if (this.broker === 'ib') {
            // Connect to Interactive Brokers
            await this.connectToIB();
        } else {
            // Connect to Alpaca WebSocket (free tier)
            this.connectToAlpaca();
        }

        // Start price update broadcast
        this.startPriceBroadcast();
    }

    /**
     * Connect to Interactive Brokers
     */
    async connectToIB() {
        try {
            const InteractiveBrokersBroker = require('./brokers/interactiveBrokersBroker');
            
            this.ibBroker = new InteractiveBrokersBroker({
                host: process.env.IB_HOST || 'localhost',
                port: parseInt(process.env.IB_PORT) || 7497,
                clientId: parseInt(process.env.IB_CLIENT_ID) || 1,
                accountId: process.env.IB_ACCOUNT_ID || null
            });

            await this.ibBroker.connect();
            console.log('✅ Connected to Interactive Brokers for market data');
        } catch (error) {
            console.error('❌ Failed to connect to IB Gateway:', error.message);
            console.log('⚠️  Falling back to simulated data');
            console.log('💡 Make sure IB Gateway is running on port', process.env.IB_PORT || 7497);
            this.startSimulatedData();
        }
    }

    /**
     * Connect to Alpaca WebSocket for real-time data
     */
    connectToAlpaca() {
        const apiKey = process.env.ALPACA_API_KEY;
        const apiSecret = process.env.ALPACA_SECRET_KEY;

        if (!apiKey || !apiSecret) {
            console.warn('⚠️  Alpaca API keys not found, using simulated data');
            this.startSimulatedData();
            return;
        }

        console.log('🔗 Connecting to Alpaca WebSocket...');
        const wsUrl = 'wss://stream.data.alpaca.markets/v2/iex';
        this.alpacaWS = new WebSocket(wsUrl);

        this.alpacaWS.on('open', () => {
            console.log('✅ Connected to Alpaca WebSocket');

            // Authenticate
            this.alpacaWS.send(JSON.stringify({
                action: 'auth',
                key: apiKey,
                secret: apiSecret
            }));
        });

        this.alpacaWS.on('message', (data) => {
            this.handleAlpacaMessage(data);
        });

        this.alpacaWS.on('error', (error) => {
            console.error('❌ Alpaca WebSocket error:', error.message);
            // Don't reconnect if using IB
            if (this.broker !== 'ib') {
                this.reconnectAlpaca();
            }
        });

        this.alpacaWS.on('close', () => {
            console.log('🔌 Alpaca WebSocket closed');
            // Don't reconnect if using IB
            if (this.broker !== 'ib') {
                console.log('⏳ Reconnecting to Alpaca...');
                this.reconnectAlpaca();
            }
        });
    }

    /**
     * Handle incoming Alpaca messages
     */
    handleAlpacaMessage(data) {
        try {
            const messages = JSON.parse(data);

            for (const message of messages) {
                if (message.T === 't') { // Trade
                    this.updatePrice({
                        symbol: message.S,
                        price: message.p,
                        volume: message.s,
                        timestamp: message.t,
                        exchange: message.x
                    });
                } else if (message.T === 'q') { // Quote
                    this.updateQuote({
                        symbol: message.S,
                        bid: message.bp,
                        ask: message.ap,
                        bidSize: message.bs,
                        askSize: message.as,
                        timestamp: message.t
                    });
                } else if (message.T === 'b') { // Bar (OHLCV)
                    this.updateBar({
                        symbol: message.S,
                        open: message.o,
                        high: message.h,
                        low: message.l,
                        close: message.c,
                        volume: message.v,
                        timestamp: message.t
                    });
                }
            }
        } catch (error) {
            console.error('Error parsing Alpaca message:', error);
        }
    }

    /**
     * Subscribe to symbol updates
     */
    subscribe(symbols) {
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }

        if (this.alpacaWS && this.alpacaWS.readyState === WebSocket.OPEN) {
            this.alpacaWS.send(JSON.stringify({
                action: 'subscribe',
                trades: symbols,
                quotes: symbols,
                bars: symbols
            }));
            console.log(`📡 Subscribed to: ${symbols.join(', ')}`);
        }

        // Add to simulated data if using simulation
        symbols.forEach(symbol => {
            if (!this.subscribers.has(symbol)) {
                this.subscribers.set(symbol, new Set());
            }
        });
    }

    /**
     * Unsubscribe from symbol updates
     */
    unsubscribe(symbols) {
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }

        if (this.alpacaWS && this.alpacaWS.readyState === WebSocket.OPEN) {
            this.alpacaWS.send(JSON.stringify({
                action: 'unsubscribe',
                trades: symbols,
                quotes: symbols,
                bars: symbols
            }));
        }

        symbols.forEach(symbol => {
            this.subscribers.delete(symbol);
        });
    }

    /**
     * Update price and notify subscribers
     */
    updatePrice(data) {
        const { symbol, price, volume, timestamp } = data;

        this.priceCache.set(symbol, {
            price,
            volume,
            timestamp,
            updatedAt: Date.now()
        });

        // Cache in Redis for quick access
        cache.set(`price:${symbol}`, price, 5);

        // Publish to Redis pub/sub for distributed systems
        cache.publish('market:price', data);

        // Emit event for local subscribers
        this.emit('price', data);

        // Notify WebSocket clients
        this.notifyClients(symbol, 'price', data);
    }

    /**
     * Update quote (bid/ask)
     */
    updateQuote(data) {
        const { symbol } = data;
        cache.set(`quote:${symbol}`, data, 5);
        cache.publish('market:quote', data);
        this.emit('quote', data);
        this.notifyClients(symbol, 'quote', data);
    }

    /**
     * Update bar (OHLCV)
     */
    updateBar(data) {
        const { symbol } = data;
        cache.set(`bar:${symbol}`, data, 60);
        cache.publish('market:bar', data);
        this.emit('bar', data);
        this.notifyClients(symbol, 'bar', data);
    }

    /**
     * Notify WebSocket clients
     */
    notifyClients(symbol, type, data) {
        const clients = this.subscribers.get(symbol);
        if (clients) {
            const message = JSON.stringify({ type, symbol, data });
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }

    /**
     * Add WebSocket client subscriber
     */
    addClient(symbol, clientWS) {
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, new Set());
            this.subscribe(symbol);
        }
        this.subscribers.get(symbol).add(clientWS);
    }

    /**
     * Remove WebSocket client subscriber
     */
    removeClient(symbol, clientWS) {
        const clients = this.subscribers.get(symbol);
        if (clients) {
            clients.delete(clientWS);
            if (clients.size === 0) {
                this.unsubscribe(symbol);
                this.subscribers.delete(symbol);
            }
        }
    }

    /**
     * Get current price
     */
    async getCurrentPrice(symbol) {
        // Check cache first (extended to 30 seconds for IB)
        const cached = this.priceCache.get(symbol);
        const cacheTimeout = this.broker === 'ib' ? 30000 : 5000; // 30s for IB, 5s for others
        
        if (cached && Date.now() - cached.updatedAt < cacheTimeout) {
            return cached.price;
        }

        // Check Redis
        const redisPrice = await cache.get(`price:${symbol}`);
        if (redisPrice) {
            return redisPrice;
        }

        // Fetch from data source
        if (this.broker === 'ib' && this.ibBroker) {
            try {
                // Use shorter timeout for IB to fail fast
                const pricePromise = this.ibBroker.getCurrentPrice(symbol);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('IB timeout')), 2000) // 2 second timeout
                );
                
                const price = await Promise.race([pricePromise, timeoutPromise]);
                
                // Cache successful IB price
                this.priceCache.set(symbol, {
                    price,
                    updatedAt: Date.now()
                });
                
                return price;
            } catch (error) {
                // Fast fallback to Alpaca API
                return await this.fetchPriceFromAPI(symbol);
            }
        } else {
            // Fetch from REST API as fallback (Alpaca)
            return await this.fetchPriceFromAPI(symbol);
        }
    }

    /**
     * Fetch price from REST API
     */
    async fetchPriceFromAPI(symbol) {
        try {
            const apiKey = process.env.ALPACA_API_KEY;
            if (!apiKey) {
                return this.simulatePrice(symbol);
            }

            const response = await axios.get(
                `https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`,
                {
                    headers: {
                        'APCA-API-KEY-ID': apiKey,
                        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
                    }
                }
            );

            const price = response.data.trade.p;
            this.updatePrice({ symbol, price, volume: response.data.trade.s, timestamp: response.data.trade.t });
            return price;
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error.message);
            return this.simulatePrice(symbol);
        }
    }

    /**
     * Simulated data for development/demo
     */
    startSimulatedData() {
        console.log('📊 Starting simulated market data...');

        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];
        const basePrices = {
            'AAPL': 180, 'NVDA': 900, 'TSLA': 250, 'MSFT': 380,
            'GOOGL': 140, 'AMZN': 170, 'META': 485, 'NFLX': 600
        };

        // Subscribe to all symbols
        this.subscribe(symbols);

        // Update prices every second
        setInterval(() => {
            symbols.forEach(symbol => {
                const basePrice = basePrices[symbol];
                const volatility = 0.002; // 0.2% volatility
                const change = (Math.random() - 0.5) * 2 * volatility;
                const price = basePrice * (1 + change);
                const volume = Math.floor(Math.random() * 10000) + 1000;

                this.updatePrice({
                    symbol,
                    price: parseFloat(price.toFixed(2)),
                    volume,
                    timestamp: Date.now()
                });
            });
        }, this.updateInterval);
    }

    /**
     * Simulate price for a symbol
     */
    simulatePrice(symbol) {
        const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const basePrice = 100 + (hash % 400);
        const volatility = 0.002;
        const change = (Math.random() - 0.5) * 2 * volatility;
        return parseFloat((basePrice * (1 + change)).toFixed(2));
    }

    /**
     * Start periodic price broadcast
     */
    startPriceBroadcast() {
        setInterval(() => {
            // Broadcast cache state
            const stats = {
                cachedSymbols: this.priceCache.size,
                subscribers: this.subscribers.size,
                totalClients: Array.from(this.subscribers.values())
                    .reduce((sum, clients) => sum + clients.size, 0)
            };

            console.log(`📡 Market Data Stats:`, stats);
        }, 30000); // Every 30 seconds
    }

    /**
     * Reconnect to Alpaca
     */
    reconnectAlpaca() {
        setTimeout(() => {
            if (!this.alpacaWS || this.alpacaWS.readyState === WebSocket.CLOSED) {
                this.connectToAlpaca();
            }
        }, 5000);
    }

    /**
     * Get historical data
     */
    async getHistoricalBars(symbol, timeframe = '1Day', start, end, limit = 1000) {
        try {
            const apiKey = process.env.ALPACA_API_KEY;
            if (!apiKey) {
                return this.simulateHistoricalData(symbol, limit);
            }

            const params = new URLSearchParams({
                start: start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                end: end || new Date().toISOString(),
                limit,
                timeframe
            });

            const response = await axios.get(
                `https://data.alpaca.markets/v2/stocks/${symbol}/bars?${params}`,
                {
                    headers: {
                        'APCA-API-KEY-ID': apiKey,
                        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
                    }
                }
            );

            return response.data.bars.map(bar => ({
                time: bar.t,
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                volume: bar.v
            }));
        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error.message);
            return this.simulateHistoricalData(symbol, limit);
        }
    }

    /**
     * Simulate historical data
     */
    simulateHistoricalData(symbol, days = 365) {
        const data = [];
        const now = Date.now();
        let price = this.simulatePrice(symbol);

        for (let i = days; i >= 0; i--) {
            const timestamp = now - (i * 24 * 60 * 60 * 1000);
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * 2 * volatility;
            price = price * (1 + change);

            const open = price;
            const high = price * (1 + Math.random() * 0.01);
            const low = price * (1 - Math.random() * 0.01);
            const close = price;

            data.push({
                time: new Date(timestamp).toISOString(),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: Math.floor(Math.random() * 10000000) + 1000000
            });
        }

        return data;
    }

    /**
     * Cleanup
     */
    cleanup() {
        if (this.alpacaWS) {
            this.alpacaWS.close();
        }
        if (this.polygonWS) {
            this.polygonWS.close();
        }
        this.subscribers.clear();
        this.priceCache.clear();
    }
}

// Export singleton instance
module.exports = new RealTimeDataService();



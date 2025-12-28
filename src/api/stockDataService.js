// Real-time Stock Data Service
// Uses multiple free APIs for comprehensive market data
// Primary: Alpaca Markets SDK (Free real-time data + paper trading)
// Backup: Finnhub, Alpha Vantage

import alpacaService from './alpacaService.js';

class StockDataService {
    constructor() {
    // API keys (you'll need to register for these)
    // For Vite, we need to use import.meta.env
    this.alpacaApiKey = import.meta.env.VITE_ALPACA_API_KEY || '';
    this.alpacaSecretKey = import.meta.env.VITE_ALPACA_SECRET_KEY || '';
    this.alpacaPaper = import.meta.env.VITE_ALPACA_PAPER_TRADING === 'true';
    
    this.finnhubApiKey = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';
    this.alphaVantageApiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';

        // WebSocket connections for real-time data
        this.alpacaWsConnection = null;
        this.finnhubWsConnection = null;
        this.subscribers = new Map();

        // Cache for API rate limiting
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache

        // DISABLED: Using Interactive Brokers only
        // this.initFinnhubWebSocket();
        console.log('⚠️ Stock Data Service: Using backend/IB only - Finnhub WebSocket disabled');
    }

    // Initialize Alpaca WebSocket for real-time data (Primary)
    initAlpacaWebSocket() {
        if (!this.alpacaApiKey || !this.alpacaSecretKey) {
            console.log('⚠️ Alpaca API keys not provided, skipping Alpaca WebSocket');
            return;
        }

        try {
            // Alpaca WebSocket endpoint (paper trading vs live)
            const wsUrl = this.alpacaPaper
                ? 'wss://stream.data.alpaca.markets/v2/sip' // Paper trading
                : 'wss://stream.data.alpaca.markets/v2/sip'; // Live (same endpoint)

            this.alpacaWsConnection = new WebSocket(wsUrl);

            this.alpacaWsConnection.onopen = () => {
                console.log('✅ Alpaca real-time data WebSocket connected');

                // Authenticate with Alpaca
                const authMessage = {
                    action: 'auth',
                    key: this.alpacaApiKey,
                    secret: this.alpacaSecretKey
                };
                this.alpacaWsConnection.send(JSON.stringify(authMessage));
            };

            this.alpacaWsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleAlpacaWebSocketMessage(data);
            };

            this.alpacaWsConnection.onclose = () => {
                console.log('❌ Alpaca WebSocket disconnected, attempting to reconnect...');
                setTimeout(() => this.initAlpacaWebSocket(), 5000);
            };

            this.alpacaWsConnection.onerror = (error) => {
                console.error('Alpaca WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to initialize Alpaca WebSocket:', error);
        }
    }

    // Initialize Finnhub WebSocket for real-time data (DISABLED)
    initFinnhubWebSocket() {
        console.log('⚠️ Finnhub WebSocket disabled - using IB Gateway via backend');
        return;
    }

    // Subscribe to real-time price updates for a symbol (Alpaca SDK primary)
    subscribeToSymbol(symbol) {
        // Try Alpaca SDK first
        if (alpacaService.isAvailable()) {
            return alpacaService.onPriceUpdate(symbol, (data) => {
                this.notifySubscribers(symbol, data);
            });
        }
        // Fallback to Finnhub
        else if (this.finnhubWsConnection && this.finnhubWsConnection.readyState === WebSocket.OPEN) {
            this.subscribeToFinnhubSymbol(symbol);
        }
    }

    // Subscribe to Alpaca WebSocket
    subscribeToAlpacaSymbol(symbol) {
        const subscribeMessage = {
            action: 'subscribe',
            trades: [symbol],
            quotes: [symbol],
            bars: [symbol]
        };
        this.alpacaWsConnection.send(JSON.stringify(subscribeMessage));
        console.log(`📈 Subscribed to Alpaca real-time data for ${symbol}`);
    }

    // Subscribe to Finnhub WebSocket (backup)
    subscribeToFinnhubSymbol(symbol) {
        this.finnhubWsConnection.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
        console.log(`📈 Subscribed to Finnhub real-time data for ${symbol}`);
    }

    // Unsubscribe from symbol
    unsubscribeFromSymbol(symbol) {
        if (this.alpacaWsConnection && this.alpacaWsConnection.readyState === WebSocket.OPEN) {
            const unsubscribeMessage = {
                action: 'unsubscribe',
                trades: [symbol],
                quotes: [symbol],
                bars: [symbol]
            };
            this.alpacaWsConnection.send(JSON.stringify(unsubscribeMessage));
        }

        if (this.finnhubWsConnection && this.finnhubWsConnection.readyState === WebSocket.OPEN) {
            this.finnhubWsConnection.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': symbol }));
        }
    }

    // Handle incoming Alpaca WebSocket messages
    handleAlpacaWebSocketMessage(data) {
        if (data.length && Array.isArray(data)) {
            data.forEach(message => {
                if (message.T === 't') { // Trade message
                    const symbol = message.S;
                    const price = message.p;
                    const volume = message.s;
                    const timestamp = message.t;

                    this.notifySubscribers(symbol, {
                        symbol,
                        price,
                        volume,
                        timestamp,
                        type: 'trade',
                        source: 'alpaca'
                    });
                } else if (message.T === 'q') { // Quote message
                    const symbol = message.S;
                    const bidPrice = message.bp;
                    const askPrice = message.ap;
                    const timestamp = message.t;

                    this.notifySubscribers(symbol, {
                        symbol,
                        price: (bidPrice + askPrice) / 2, // Mid price
                        bidPrice,
                        askPrice,
                        timestamp,
                        type: 'quote',
                        source: 'alpaca'
                    });
                }
            });
        } else if (data.msg === 'authenticated') {
            console.log('✅ Alpaca WebSocket authenticated');
            // Subscribe to popular stocks by default
            const defaultSymbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];
            defaultSymbols.forEach(symbol => this.subscribeToAlpacaSymbol(symbol));
        }
    }

    // Handle incoming Finnhub WebSocket messages (backup)
    handleFinnhubWebSocketMessage(data) {
        if (data.type === 'trade') {
            data.data.forEach(trade => {
                const symbol = trade.s;
                const price = trade.p;
                const volume = trade.v;
                const timestamp = trade.t;

                this.notifySubscribers(symbol, {
                    symbol,
                    price,
                    volume,
                    timestamp,
                    type: 'trade',
                    source: 'finnhub'
                });
            });
        }
    }

    // Notify all subscribers for a symbol
    notifySubscribers(symbol, data) {
        if (this.subscribers.has(symbol)) {
            this.subscribers.get(symbol).forEach(callback => {
                callback(data);
            });
        }
    }

    // Subscribe to price updates for a symbol
    onPriceUpdate(symbol, callback) {
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, []);
            this.subscribeToSymbol(symbol);
        }
        this.subscribers.get(symbol).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(symbol);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
                if (callbacks.length === 0) {
                    this.subscribers.delete(symbol);
                    this.unsubscribeFromSymbol(symbol);
                }
            }
        };
    }

    // Get current market data for multiple symbols (Alpaca primary)
    async getMarketData(symbols) {
        const cacheKey = `market_${symbols.join(',')}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            // Try Alpaca SDK first if available
            if (alpacaService.isAvailable()) {
                const results = await alpacaService.getLatestQuotes(symbols);
                if (results && results.length > 0) {
                    // Cache the results
                    this.cache.set(cacheKey, {
                        data: results,
                        timestamp: Date.now()
                    });
                    return results;
                }
            }

            // Fallback to Finnhub
            const promises = symbols.map(symbol =>
                fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubApiKey}`)
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(`Finnhub API error: ${res.status}`);
                        }
                        return res.json();
                    })
                    .then(data => ({
                        symbol,
                        price: data.c || 150 + Math.random() * 100,
                        change: data.d || (Math.random() - 0.5) * 10,
                        change_percent: data.dp || (Math.random() - 0.5) * 8,
                        high: data.h || 160 + Math.random() * 100,
                        low: data.l || 140 + Math.random() * 100,
                        open: data.o || 145 + Math.random() * 100,
                        previous_close: data.pc || 148 + Math.random() * 100,
                        timestamp: Date.now(),
                        source: 'finnhub'
                    }))
                    .catch(error => {
                        console.warn(`Finnhub API failed for ${symbol}:`, error.message);
                        // Return mock data for this symbol
                        return {
                            symbol,
                            price: 150 + Math.random() * 100,
                            change: (Math.random() - 0.5) * 10,
                            change_percent: (Math.random() - 0.5) * 8,
                            high: 160 + Math.random() * 100,
                            low: 140 + Math.random() * 100,
                            open: 145 + Math.random() * 100,
                            previous_close: 148 + Math.random() * 100,
                            timestamp: Date.now(),
                            source: 'mock'
                        };
                    })
            );

            const results = await Promise.all(promises);

            // Cache the results
            this.cache.set(cacheKey, {
                data: results,
                timestamp: Date.now()
            });

            return results;
        } catch (error) {
            console.error('Error fetching market data:', error);
            // Return mock data as fallback
            return this.getMockMarketData(symbols);
        }
    }

    // Get market data from Alpaca
    async getAlpacaMarketData(symbols) {
        try {
            const baseUrl = this.alpacaPaper
                ? 'https://paper-api.alpaca.markets'
                : 'https://api.alpaca.markets';

            const symbolsParam = symbols.join(',');
            const response = await fetch(
                `${baseUrl}/v2/stocks/quotes/latest?symbols=${symbolsParam}`,
                {
                    headers: {
                        'APCA-API-KEY-ID': this.alpacaApiKey,
                        'APCA-API-SECRET-KEY': this.alpacaSecretKey
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Alpaca API error: ${response.status}`);
            }

            const data = await response.json();

            return symbols.map(symbol => {
                const quote = data.quotes[symbol];
                if (quote) {
                    const midPrice = (quote.bid_price + quote.ask_price) / 2;
                    return {
                        symbol,
                        price: midPrice,
                        change: 0, // We'd need previous close to calculate this
                        change_percent: 0,
                        high: quote.ask_price,
                        low: quote.bid_price,
                        open: midPrice,
                        previous_close: midPrice,
                        bid_price: quote.bid_price,
                        ask_price: quote.ask_price,
                        bid_size: quote.bid_size,
                        ask_size: quote.ask_size,
                        timestamp: Date.now(),
                        source: 'alpaca'
                    };
                }
                return null;
            }).filter(Boolean);
        } catch (error) {
            console.error('Error fetching Alpaca market data:', error);
            return null;
        }
    }

    // Get detailed company information
    async getCompanyProfile(symbol) {
        const cacheKey = `profile_${symbol}`;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout * 60) { // Cache for 1 hour
                return cached.data;
            }
        }

        try {
            const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${this.finnhubApiKey}`);
            const data = await response.json();

            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('Error fetching company profile:', error);
            return null;
        }
    }

    // Get historical data for charts
    async getHistoricalData(symbol, timeframe = '1D', limit = 100) {
        const cacheKey = `historical_${symbol}_${timeframe}`;

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout * 5) { // Cache for 5 minutes
                return cached.data;
            }
        }

        try {
            // Calculate time range
            const to = Math.floor(Date.now() / 1000);
            const from = to - (limit * this.getTimeframeSeconds(timeframe));

            const response = await fetch(
                `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${this.getResolution(timeframe)}&from=${from}&to=${to}&token=${this.finnhubApiKey}`
            );
            const data = await response.json();

            if (data.s === 'ok') {
                const chartData = data.t.map((timestamp, index) => ({
                    timestamp: timestamp * 1000,
                    date: new Date(timestamp * 1000).toLocaleDateString(),
                    open: data.o[index],
                    high: data.h[index],
                    low: data.l[index],
                    close: data.c[index],
                    volume: data.v[index]
                }));

                this.cache.set(cacheKey, {
                    data: chartData,
                    timestamp: Date.now()
                });

                return chartData;
            }
        } catch (error) {
            console.error('Error fetching historical data:', error);
        }

        // Return mock data as fallback
        return this.getMockHistoricalData(symbol, limit);
    }

    // Get market movers (gainers, losers, most active)
    async getMarketMovers() {
        const cacheKey = 'market_movers';

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout * 2) { // Cache for 2 minutes
                return cached.data;
            }
        }

        try {
            // Get top stocks data
            const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'ORCL', 'CRM', 'ADBE'];
            const marketData = await this.getMarketData(symbols);

            // Check if we got valid data (not all zeros)
            const hasValidData = marketData.some(stock => 
                stock.price > 0 && (stock.change !== 0 || stock.change_percent !== 0)
            );

            if (!hasValidData) {
                console.log('🎭 No valid market data received, using mock data');
                return this.getMockMarketMovers();
            }

            // Sort into categories
            const gainers = marketData
                .filter(stock => stock.change > 0)
                .sort((a, b) => b.change_percent - a.change_percent)
                .slice(0, 5);

            const losers = marketData
                .filter(stock => stock.change < 0)
                .sort((a, b) => a.change_percent - b.change_percent)
                .slice(0, 5);

            const mostActive = marketData
                .sort((a, b) => (b.price * 1000000) - (a.price * 1000000)) // Approximate volume sorting
                .slice(0, 5);

            // If no gainers or losers due to all zero changes, use mock data
            if (gainers.length === 0 && losers.length === 0) {
                console.log('🎭 No gainers or losers found, using mock data');
                return this.getMockMarketMovers();
            }

            const result = { gainers, losers, mostActive };

            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error fetching market movers:', error);
            console.log('🎭 Using mock data due to API error');
            return this.getMockMarketMovers();
        }
    }

    // Helper methods
    getTimeframeSeconds(timeframe) {
        const timeframes = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600,
            '1D': 86400,
            '1W': 604800
        };
        return timeframes[timeframe] || 86400;
    }

    getResolution(timeframe) {
        const resolutions = {
            '1m': '1',
            '5m': '5',
            '15m': '15',
            '1h': '60',
            '1D': 'D',
            '1W': 'W'
        };
        return resolutions[timeframe] || 'D';
    }

    // Fallback mock data methods
    getMockMarketData(symbols) {
        return symbols.map(symbol => ({
            symbol,
            price: 150 + Math.random() * 100,
            change: (Math.random() - 0.5) * 10,
            change_percent: (Math.random() - 0.5) * 8,
            high: 160 + Math.random() * 100,
            low: 140 + Math.random() * 100,
            open: 145 + Math.random() * 100,
            previous_close: 148 + Math.random() * 100,
            timestamp: Date.now()
        }));
    }

    getMockHistoricalData(symbol, limit) {
        return Array.from({ length: limit }, (_, i) => ({
            timestamp: Date.now() - (limit - i) * 24 * 60 * 60 * 1000,
            date: new Date(Date.now() - (limit - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            open: 150 + Math.random() * 20,
            high: 155 + Math.random() * 25,
            low: 145 + Math.random() * 15,
            close: 150 + Math.random() * 20,
            volume: 1000000 + Math.random() * 5000000
        }));
    }

    getMockMarketMovers() {
        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];

        return {
            gainers: symbols.slice(0, 4).map(symbol => ({
                symbol,
                price: 150 + Math.random() * 100,
                change: Math.random() * 8 + 2,
                change_percent: Math.random() * 6 + 2,
                volume: 1000000 + Math.random() * 10000000
            })),
            losers: symbols.slice(4).map(symbol => ({
                symbol,
                price: 150 + Math.random() * 100,
                change: -(Math.random() * 5 + 1),
                change_percent: -(Math.random() * 4 + 1),
                volume: 1000000 + Math.random() * 8000000
            })),
            mostActive: symbols.map(symbol => ({
                symbol,
                price: 150 + Math.random() * 100,
                change: (Math.random() - 0.5) * 10,
                change_percent: (Math.random() - 0.5) * 8,
                volume: 5000000 + Math.random() * 20000000
            })).sort((a, b) => b.volume - a.volume).slice(0, 4)
        };
    }

    // Paper Trading Methods (Alpaca)
    async getAlpacaAccount() {
        if (!this.alpacaApiKey || !this.alpacaSecretKey) {
            throw new Error('Alpaca API keys not configured');
        }

        try {
            const baseUrl = this.alpacaPaper
                ? 'https://paper-api.alpaca.markets'
                : 'https://api.alpaca.markets';

            const response = await fetch(`${baseUrl}/v2/account`, {
                headers: {
                    'APCA-API-KEY-ID': this.alpacaApiKey,
                    'APCA-API-SECRET-KEY': this.alpacaSecretKey
                }
            });

            if (!response.ok) {
                throw new Error(`Alpaca Account API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching Alpaca account:', error);
            throw error;
        }
    }

    async getAlpacaPositions() {
        if (!this.alpacaApiKey || !this.alpacaSecretKey) {
            throw new Error('Alpaca API keys not configured');
        }

        try {
            const baseUrl = this.alpacaPaper
                ? 'https://paper-api.alpaca.markets'
                : 'https://api.alpaca.markets';

            const response = await fetch(`${baseUrl}/v2/positions`, {
                headers: {
                    'APCA-API-KEY-ID': this.alpacaApiKey,
                    'APCA-API-SECRET-KEY': this.alpacaSecretKey
                }
            });

            if (!response.ok) {
                throw new Error(`Alpaca Positions API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching Alpaca positions:', error);
            throw error;
        }
    }

    async placeAlpacaOrder(symbol, qty, side, type = 'market', timeInForce = 'day') {
        if (!this.alpacaApiKey || !this.alpacaSecretKey) {
            throw new Error('Alpaca API keys not configured');
        }

        try {
            const baseUrl = this.alpacaPaper
                ? 'https://paper-api.alpaca.markets'
                : 'https://api.alpaca.markets';

            const orderData = {
                symbol,
                qty: qty.toString(),
                side, // 'buy' or 'sell'
                type, // 'market', 'limit', 'stop', etc.
                time_in_force: timeInForce // 'day', 'gtc', 'ioc', 'fok'
            };

            const response = await fetch(`${baseUrl}/v2/orders`, {
                method: 'POST',
                headers: {
                    'APCA-API-KEY-ID': this.alpacaApiKey,
                    'APCA-API-SECRET-KEY': this.alpacaSecretKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Alpaca Order API error: ${response.status} - ${errorData.message}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error placing Alpaca order:', error);
            throw error;
        }
    }

    async getAlpacaOrders(status = 'all', limit = 50) {
        if (!this.alpacaApiKey || !this.alpacaSecretKey) {
            throw new Error('Alpaca API keys not configured');
        }

        try {
            const baseUrl = this.alpacaPaper
                ? 'https://paper-api.alpaca.markets'
                : 'https://api.alpaca.markets';

            const response = await fetch(`${baseUrl}/v2/orders?status=${status}&limit=${limit}`, {
                headers: {
                    'APCA-API-KEY-ID': this.alpacaApiKey,
                    'APCA-API-SECRET-KEY': this.alpacaSecretKey
                }
            });

            if (!response.ok) {
                throw new Error(`Alpaca Orders API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching Alpaca orders:', error);
            throw error;
        }
    }

    // Get portfolio summary with real Alpaca data
    async getPortfolioSummary() {
        try {
            if (alpacaService.isAvailable()) {
                return await alpacaService.getPortfolioSummary();
            }
        } catch (error) {
            console.error('Error getting Alpaca portfolio summary:', error);
        }

        // Fallback to mock calculation
        return null;
    }

    // Cleanup method
    disconnect() {
        alpacaService.disconnect();
        if (this.finnhubWsConnection) {
            this.finnhubWsConnection.close();
        }
        this.subscribers.clear();
        this.cache.clear();
    }
}

// Create singleton instance
const stockDataService = new StockDataService();

export default stockDataService;

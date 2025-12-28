// Alpaca Broker Implementation
const BaseBroker = require('./baseBroker');
const axios = require('axios');
const WebSocket = require('ws');

class AlpacaBroker extends BaseBroker {
    constructor(config) {
        super(config);
        this.baseUrl = config.paper ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets';
        this.dataUrl = 'https://data.alpaca.markets';
        this.wsUrl = 'wss://stream.data.alpaca.markets/v2/iex';
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.ws = null;
        this.priceCallbacks = new Map();
    }

    /**
     * Connect to Alpaca
     */
    async connect() {
        try {
            // Test connection by getting account
            await this.getAccount();
            this.isConnected = true;
            console.log(`✅ Connected to Alpaca (${this.config.paper ? 'Paper' : 'Live'} Trading)`);
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to Alpaca:', error.message);
            throw error;
        }
    }

    /**
     * Disconnect from Alpaca
     */
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        console.log('🔌 Disconnected from Alpaca');
    }

    /**
     * Get account information
     */
    async getAccount() {
        const response = await this.makeRequest('GET', '/v2/account');
        return {
            id: response.id,
            accountNumber: response.account_number,
            status: response.status,
            currency: response.currency,
            cash: parseFloat(response.cash),
            portfolioValue: parseFloat(response.portfolio_value),
            buyingPower: parseFloat(response.buying_power),
            equity: parseFloat(response.equity),
            lastEquity: parseFloat(response.last_equity),
            dayTradeCount: response.daytrade_count,
            patternDayTrader: response.pattern_day_trader
        };
    }

    /**
     * Get current positions
     */
    async getPositions() {
        const response = await this.makeRequest('GET', '/v2/positions');
        return response.map(pos => this.normalizePosition(pos));
    }

    /**
     * Place an order
     */
    async placeOrder(order) {
        this.validateOrder(order);

        const orderData = {
            symbol: order.symbol.toUpperCase(),
            qty: order.quantity,
            side: order.side.toLowerCase(),
            type: order.orderType.toLowerCase(),
            time_in_force: order.timeInForce || 'day'
        };

        if (order.orderType.toLowerCase() === 'limit') {
            orderData.limit_price = order.limitPrice;
        }

        if (order.orderType.toLowerCase() === 'stop') {
            orderData.stop_price = order.stopPrice;
        }

        if (order.orderType.toLowerCase() === 'stop_limit') {
            orderData.limit_price = order.limitPrice;
            orderData.stop_price = order.stopPrice;
        }

        const response = await this.makeRequest('POST', '/v2/orders', orderData);
        return this.normalizeOrder(response);
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        await this.makeRequest('DELETE', `/v2/orders/${orderId}`);
        return { success: true, orderId };
    }

    /**
     * Get order details
     */
    async getOrder(orderId) {
        const response = await this.makeRequest('GET', `/v2/orders/${orderId}`);
        return this.normalizeOrder(response);
    }

    /**
     * Get order history
     */
    async getOrderHistory(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.after) params.append('after', filters.after);
        if (filters.until) params.append('until', filters.until);

        const response = await this.makeRequest('GET', `/v2/orders?${params}`);
        return response.map(order => this.normalizeOrder(order));
    }

    /**
     * Get current price
     */
    async getCurrentPrice(symbol) {
        const response = await this.makeRequest(
            'GET',
            `/v2/stocks/${symbol}/trades/latest`,
            null,
            this.dataUrl
        );
        return parseFloat(response.trade.p);
    }

    /**
     * Get historical data
     */
    async getHistoricalData(symbol, timeframe, start, end) {
        const params = new URLSearchParams({
            start: start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            end: end || new Date().toISOString(),
            timeframe: timeframe || '1Day',
            limit: 10000
        });

        const response = await this.makeRequest(
            'GET',
            `/v2/stocks/${symbol}/bars?${params}`,
            null,
            this.dataUrl
        );

        return response.bars.map(bar => ({
            time: bar.t,
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v
        }));
    }

    /**
     * Subscribe to real-time prices
     */
    async subscribeToPrices(symbols, callback) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            await this.initializeWebSocket();
        }

        // Store callback for these symbols
        symbols.forEach(symbol => {
            this.priceCallbacks.set(symbol, callback);
        });

        // Subscribe to trades
        this.ws.send(JSON.stringify({
            action: 'subscribe',
            trades: symbols
        }));
    }

    /**
     * Unsubscribe from real-time prices
     */
    async unsubscribeFromPrices(symbols) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                action: 'unsubscribe',
                trades: symbols
            }));
        }

        symbols.forEach(symbol => {
            this.priceCallbacks.delete(symbol);
        });
    }

    /**
     * Initialize WebSocket connection
     */
    async initializeWebSocket() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', () => {
                // Authenticate
                this.ws.send(JSON.stringify({
                    action: 'auth',
                    key: this.apiKey,
                    secret: this.apiSecret
                }));
            });

            this.ws.on('message', (data) => {
                const messages = JSON.parse(data);

                for (const message of messages) {
                    if (message.T === 'success' && message.msg === 'authenticated') {
                        resolve();
                    } else if (message.T === 't') {
                        // Trade message
                        const callback = this.priceCallbacks.get(message.S);
                        if (callback) {
                            callback({
                                symbol: message.S,
                                price: message.p,
                                size: message.s,
                                timestamp: message.t
                            });
                        }
                    }
                }
            });

            this.ws.on('error', (error) => {
                console.error('Alpaca WebSocket error:', error);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('Alpaca WebSocket closed');
                setTimeout(() => this.initializeWebSocket(), 5000);
            });
        });
    }

    /**
     * Make HTTP request to Alpaca
     */
    async makeRequest(method, endpoint, data = null, baseUrl = null) {
        const url = `${baseUrl || this.baseUrl}${endpoint}`;

        try {
            const response = await axios({
                method,
                url,
                headers: {
                    'APCA-API-KEY-ID': this.apiKey,
                    'APCA-API-SECRET-KEY': this.apiSecret,
                    'Content-Type': 'application/json'
                },
                data
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`Alpaca API Error: ${error.response.data.message || error.response.statusText}`);
            }
            throw error;
        }
    }
}

module.exports = AlpacaBroker;



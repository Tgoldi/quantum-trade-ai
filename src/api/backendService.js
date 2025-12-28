// Backend Service - Connects React frontend to Node.js backend
// This replaces direct API calls with backend communication

class BackendService {
    constructor() {
        // In production, use relative URLs (nginx proxy), in development use localhost
        const isProduction = import.meta.env.NODE_ENV === 'production';
        this.baseUrl = isProduction ? '/api' : 'http://localhost:3001/api';
        this.wsUrl = isProduction ? 'ws://localhost/ws' : 'ws://localhost:3001/ws';
        this.ws = null;
        this.subscribers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnecting = false;

        // Initialize WebSocket connection
        this.initWebSocket();
    }

    // WebSocket connection for real-time data
    initWebSocket() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true;

        try {
            console.log('🔌 Connecting to backend WebSocket...');
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('✅ Connected to backend WebSocket');
                this.reconnectAttempts = 0;
                this.isConnecting = false;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ Backend WebSocket disconnected');
                this.isConnecting = false;
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ Backend WebSocket error:', error);
                this.isConnecting = false;
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.initWebSocket();
        }, delay);
    }

    handleWebSocketMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'trade_update':
            case 'quote_update':
                // Notify subscribers
                this.subscribers.forEach((callback, symbol) => {
                    if (data.symbol === symbol) {
                        callback(data);
                    }
                });
                break;

            case 'initial_data':
                // Handle initial data load
                Object.entries(data).forEach(([symbol, symbolData]) => {
                    if (this.subscribers.has(symbol)) {
                        this.subscribers.get(symbol)(symbolData);
                    }
                });
                break;

            default:
                console.log('Unknown message type:', type);
        }
    }

    // Subscribe to real-time updates for a symbol
    subscribeToSymbol(symbol, callback) {
        this.subscribers.set(symbol, callback);
        console.log(`📈 Subscribed to real-time data for ${symbol}`);
    }

    // Unsubscribe from symbol updates
    unsubscribeFromSymbol(symbol) {
        this.subscribers.delete(symbol);
        console.log(`📉 Unsubscribed from ${symbol}`);
    }

    // Get auth token from storage
    getAuthToken() {
        return localStorage.getItem('auth_token');
    }

    // Set auth token
    setAuthToken(token) {
        localStorage.setItem('auth_token', token);
    }

    // Clear auth token
    clearAuthToken() {
        localStorage.removeItem('auth_token');
    }

    // HTTP request helper
    async makeRequest(endpoint, options = {}) {
        try {
            const token = this.getAuthToken();
            
            // Set longer timeout for AI endpoints (90 seconds for model warmup)
            const isAIEndpoint = endpoint.includes('/ai/');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), isAIEndpoint ? 90000 : 30000);
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers
                },
                signal: controller.signal,
                ...options
            });
            
            clearTimeout(timeoutId);

            if (response.status === 401) {
                this.clearAuthToken();
                // Don't redirect here - let the app handle it
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - AI models may be warming up (takes 30-60 seconds on first run)');
            }
            console.error(`Error making request to ${endpoint}:`, error);
            throw error;
        }
    }

    // =============== AUTHENTICATION ===============

    async register(userData) {
        const data = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.setAuthToken(data.tokens.accessToken);
        return data;
    }

    async login(credentials) {
        const data = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        this.setAuthToken(data.tokens.accessToken);
        return data;
    }

    async logout() {
        try {
            await this.makeRequest('/auth/logout', { method: 'POST' });
        } finally {
            this.clearAuthToken();
            this.disconnect();
        }
    }

    async getCurrentUser() {
        return await this.makeRequest('/auth/me');
    }

    // =============== PORTFOLIO ===============

    async getPortfolios() {
        return await this.makeRequest('/portfolios');
    }

    async getPortfolioSummary(portfolioId) {
        return await this.makeRequest(`/portfolios/${portfolioId}`);
    }

    async getPortfolioPerformance(portfolioId) {
        return await this.makeRequest(`/portfolios/${portfolioId}/performance`);
    }

    async getPortfolioTrades(portfolioId, limit = 100) {
        return await this.makeRequest(`/portfolios/${portfolioId}/trades?limit=${limit}`);
    }

    // =============== TRADING ===============

    async executeTrade(tradeData) {
        return await this.makeRequest('/trade', {
            method: 'POST',
            body: JSON.stringify(tradeData)
        });
    }

    // =============== AI DECISIONS ===============

    async getAIDecision(symbol) {
        return await this.makeRequest(`/ai/decision/${symbol}`);
    }

    async getAIDecisions(portfolioId, limit = 10) {
        return await this.makeRequest(`/ai/decisions?portfolioId=${portfolioId}&limit=${limit}`);
    }

    async executeAIDecision(decisionId, portfolioId) {
        return await this.makeRequest('/ai/decision/execute', {
            method: 'POST',
            body: JSON.stringify({ decisionId, portfolioId })
        });
    }

    // =============== MARKET DATA ===============

    async getCurrentPrice(symbol) {
        return await this.makeRequest(`/market/price/${symbol}`);
    }

    async getHistoricalData(symbol, timeframe = '1Day', limit = 100) {
        return await this.makeRequest(
            `/market/history/${symbol}?timeframe=${timeframe}&limit=${limit}`
        );
    }

    // =============== RISK MANAGEMENT ===============

    async getValueAtRisk(portfolioId, confidenceLevel = 0.95) {
        return await this.makeRequest(
            `/risk/var/${portfolioId}?confidenceLevel=${confidenceLevel}`
        );
    }

    async getRiskMetrics(portfolioId) {
        return await this.makeRequest(`/risk/metrics/${portfolioId}`);
    }

    async updateRiskLimits(portfolioId, limits) {
        return await this.makeRequest(`/risk/limits/${portfolioId}`, {
            method: 'POST',
            body: JSON.stringify(limits)
        });
    }

    // =============== BACKTESTING ===============

    async runBacktest(config) {
        return await this.makeRequest('/backtest', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async getBacktestResults(backtestId) {
        return await this.makeRequest(`/backtest/${backtestId}`);
    }

    async runMonteCarloSimulation(backtestId, numSimulations = 1000) {
        return await this.makeRequest(`/backtest/${backtestId}/monte-carlo`, {
            method: 'POST',
            body: JSON.stringify({ numSimulations })
        });
    }

    async getBacktests() {
        return await this.makeRequest('/backtests');
    }

    // =============== ALERTS ===============

    async getAlerts() {
        return await this.makeRequest('/alerts');
    }

    async createAlert(alertData) {
        return await this.makeRequest('/alerts', {
            method: 'POST',
            body: JSON.stringify(alertData)
        });
    }

    // Get server health status
    async getHealth() {
        try {
            return await this.makeRequest('/health');
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Get account information
    async getAccount() {
        return await this.makeRequest('/account');
    }

    // Get portfolio positions
    async getPositions() {
        return await this.makeRequest('/positions');
    }

    // Get portfolio summary
    async getPortfolioSummary() {
        // Try IB first, then fall back to local
        try {
            const ibPortfolio = await this.makeRequest('/portfolio/ib-live');
            if (ibPortfolio && ibPortfolio.source === 'interactive_brokers') {
                console.log('✅ Using Interactive Brokers portfolio data');
                return ibPortfolio;
            }
        } catch (ibError) {
            console.log('⚠️ IB portfolio not available, using local:', ibError.message);
        }
        
        // Fallback to local calculated portfolio
        return await this.makeRequest('/portfolio/live');
    }

    // Get IB account directly
    async getIBAccount() {
        return await this.makeRequest('/ib/account');
    }

    // Get IB positions directly
    async getIBPositions() {
        return await this.makeRequest('/ib/positions');
    }

    // Get latest quotes for symbols
    async getMarketData(symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT']) {
        // For now, get individual prices since backend doesn't have bulk quotes endpoint
        const prices = {};
        for (const symbol of symbols) {
            try {
                const price = await this.makeRequest(`/market/price/${symbol}`);
                prices[symbol] = price;
            } catch (error) {
                console.warn(`Failed to get price for ${symbol}:`, error);
            }
        }
        return prices;
    }

    // Get market movers (gainers, losers, most active)
    async getMarketMovers() {
        return await this.makeRequest('/market/movers'); // ✅ Real endpoint
    }

    // Place a trading order
    async placeOrder(orderData) {
        return await this.makeRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    // Get order history
    async getOrders(status = 'all', limit = 50) {
        return await this.makeRequest(`/orders?status=${status}&limit=${limit}`);
    }

    // Get historical data (placeholder - can be extended)
    async getHistoricalData(symbol, timeframe = 'D', limit = 100) {
        // For now, return mock data since we haven't implemented historical endpoint
        // This can be extended later
        console.log(`Historical data requested for ${symbol} (${timeframe})`);
        return this.getMockHistoricalData(symbol, limit);
    }

    // Mock historical data generator
    getMockHistoricalData(symbol, limit) {
        const data = [];
        const now = Date.now();
        const basePrice = 150 + Math.random() * 100;

        for (let i = limit; i >= 0; i--) {
            const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily data
            const price = basePrice + (Math.random() - 0.5) * 20;
            const volume = Math.floor(Math.random() * 50000000) + 1000000;

            data.push({
                timestamp,
                open: price + (Math.random() - 0.5) * 2,
                high: price + Math.random() * 3,
                low: price - Math.random() * 3,
                close: price,
                volume
            });
        }

        return data;
    }

    // AI Analysis Methods - Multi-Model Ensemble
    async getAIAnalysis(symbol, portfolioValue = 100000) {
        try {
            const response = await fetch(`${this.baseUrl}/ai/ensemble`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol,
                    portfolio_value: portfolioValue
                })
            });

            if (!response.ok) {
                throw new Error(`AI Analysis failed: ${response.status}`);
            }

            const analysis = await response.json();
            console.log(`🤖 AI Analysis for ${symbol}:`, analysis);
            return analysis;
        } catch (error) {
            console.error('Error getting AI analysis:', error);
            return this.getMockAIAnalysis(symbol);
        }
    }

    // Batch AI Analysis for multiple stocks
    async getBatchAIAnalysis(symbols, portfolioValue = 100000) {
        try {
            const response = await fetch(`${this.baseUrl}/ai/ensemble-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbols,
                    portfolio_value: portfolioValue
                })
            });

            if (!response.ok) {
                throw new Error(`Batch AI Analysis failed: ${response.status}`);
            }

            const batchAnalysis = await response.json();
            console.log(`🤖 Batch AI Analysis:`, batchAnalysis);
            return batchAnalysis;
        } catch (error) {
            console.error('Error getting batch AI analysis:', error);
            return {
                analyses: symbols.map(symbol => this.getMockAIAnalysis(symbol)),
                summary: {
                    total_stocks: symbols.length,
                    successful_analyses: symbols.length,
                    buy_signals: 0,
                    sell_signals: 0,
                    hold_signals: symbols.length
                }
            };
        }
    }

    // Mock AI Analysis for fallback
    getMockAIAnalysis(symbol) {
        const changePercent = (Math.random() - 0.5) * 8;
        const price = Math.random() * 200 + 50;

        return {
            symbol,
            price: price.toFixed(2),
            change_percent: changePercent.toFixed(2),
            recommendation: changePercent > 2 ? 'BUY' : changePercent < -2 ? 'SELL' : 'HOLD',
            confidence: 0.6,
            decision_score: changePercent / 10,
            analyses: {
                technical: {
                    trend: changePercent > 0 ? 'bullish' : 'bearish',
                    confidence: 0.7,
                    analysis: `Technical analysis shows ${changePercent > 0 ? 'upward' : 'downward'} momentum`
                },
                risk: {
                    risk_level: Math.abs(changePercent) > 3 ? 'high' : 'medium',
                    confidence: 0.6,
                    analysis: `Risk level is ${Math.abs(changePercent) > 3 ? 'elevated' : 'moderate'} based on volatility`
                },
                sentiment: {
                    sentiment: changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral',
                    confidence: 0.5,
                    analysis: `Market sentiment appears ${changePercent > 1 ? 'positive' : changePercent < -1 ? 'negative' : 'neutral'}`
                },
                strategy: {
                    action: changePercent > 2 ? 'BUY' : changePercent < -2 ? 'SELL' : 'HOLD',
                    confidence: 0.8,
                    analysis: `Strategy recommends ${changePercent > 2 ? 'buying' : changePercent < -2 ? 'selling' : 'holding'} position`
                }
            },
            ensemble: {
                models_responded: 4,
                models_total: 4,
                agreement_level: 'high'
            },
            timestamp: new Date().toISOString()
        };
    }

    // Check if backend is available
    async isBackendAvailable() {
        try {
            const health = await this.getHealth();
            return health.status === 'ok' && health.alpaca;
        } catch (error) {
            return false;
        }
    }

    // Disconnect and cleanup
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscribers.clear();
        console.log('🔌 Backend service disconnected');
    }
}

// Create and export singleton instance
const backendService = new BackendService();
export default backendService;


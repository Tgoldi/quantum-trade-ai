// Alpaca Markets Service - DISABLED (Using Interactive Brokers)
// This service is kept for compatibility but all functionality is disabled

class AlpacaService {
    constructor() {
        console.log('⚠️ Alpaca Service: DISABLED - Using Interactive Brokers only');
        
        // Keep basic structure for compatibility
        this.wsConnection = null;
        this.subscribers = new Map();
    }

    // All methods disabled - use backendService for market data
    initWebSocket() {
        console.log('⚠️ Alpaca WebSocket disabled - using IB Gateway');
    }

    handleWebSocketMessage(data) {
        return;
    }

    handleTradeUpdate(trade) {
        return;
    }

    handleQuoteUpdate(quote) {
        return;
    }

    handleBarUpdate(bar) {
        return;
    }

    onPriceUpdate(symbol, callback) {
        console.log('⚠️ Alpaca price updates disabled - use backendService.getMarketMovers()');
        return () => {}; // Empty unsubscribe function
    }

    notifySubscribers(symbol, data) {
        return;
    }

    // Stub methods for compatibility
    async getAccount() {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getPositions() {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getOrders() {
        throw new Error('Alpaca disabled - use backendService');
    }

    async placeOrder(order) {
        throw new Error('Alpaca disabled - use backendService');
    }

    async cancelOrder(orderId) {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getMarketData(symbol, timeframe = '1Min', limit = 100) {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getLatestTrade(symbol) {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getLatestQuote(symbol) {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getSnapshots(symbols) {
        throw new Error('Alpaca disabled - use backendService');
    }

    async getClock() {
        return {
            is_open: false,
            message: 'Alpaca disabled - using IB'
        };
    }

    async getCalendar(start, end) {
        throw new Error('Alpaca disabled - use backendService');
    }

    formatOrderForAlpaca(order) {
        throw new Error('Alpaca disabled');
    }

    isMarketOpen() {
        console.log('⚠️ Use IB Gateway to check market hours');
        return false;
    }
}

// Export singleton instance
const alpacaService = new AlpacaService();
export default alpacaService;

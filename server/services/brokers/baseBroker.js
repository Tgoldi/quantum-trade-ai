// Base Broker Interface
// All broker implementations must extend this class

class BaseBroker {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
    }

    /**
     * Connect to broker API
     */
    async connect() {
        throw new Error('connect() must be implemented by broker subclass');
    }

    /**
     * Disconnect from broker API
     */
    async disconnect() {
        throw new Error('disconnect() must be implemented by broker subclass');
    }

    /**
     * Get account information
     */
    async getAccount() {
        throw new Error('getAccount() must be implemented by broker subclass');
    }

    /**
     * Get current positions
     */
    async getPositions() {
        throw new Error('getPositions() must be implemented by broker subclass');
    }

    /**
     * Place an order
     * @param {Object} order - Order details
     * @param {string} order.symbol - Stock symbol
     * @param {string} order.side - 'buy' or 'sell'
     * @param {number} order.quantity - Number of shares
     * @param {string} order.orderType - 'market', 'limit', 'stop', etc.
     * @param {number} [order.limitPrice] - Limit price for limit orders
     * @param {number} [order.stopPrice] - Stop price for stop orders
     */
    async placeOrder(order) {
        throw new Error('placeOrder() must be implemented by broker subclass');
    }

    /**
     * Cancel an order
     * @param {string} orderId - Order ID to cancel
     */
    async cancelOrder(orderId) {
        throw new Error('cancelOrder() must be implemented by broker subclass');
    }

    /**
     * Get order details
     * @param {string} orderId - Order ID
     */
    async getOrder(orderId) {
        throw new Error('getOrder() must be implemented by broker subclass');
    }

    /**
     * Get order history
     * @param {Object} filters - Filter options
     */
    async getOrderHistory(filters = {}) {
        throw new Error('getOrderHistory() must be implemented by broker subclass');
    }

    /**
     * Get current price for a symbol
     * @param {string} symbol - Stock symbol
     */
    async getCurrentPrice(symbol) {
        throw new Error('getCurrentPrice() must be implemented by broker subclass');
    }

    /**
     * Get historical data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Time frame (1m, 5m, 1h, 1d, etc.)
     * @param {Date} start - Start date
     * @param {Date} end - End date
     */
    async getHistoricalData(symbol, timeframe, start, end) {
        throw new Error('getHistoricalData() must be implemented by broker subclass');
    }

    /**
     * Subscribe to real-time price updates
     * @param {Array<string>} symbols - Array of symbols to subscribe to
     * @param {Function} callback - Callback function for price updates
     */
    async subscribeToPrices(symbols, callback) {
        throw new Error('subscribeToPrices() must be implemented by broker subclass');
    }

    /**
     * Unsubscribe from real-time price updates
     * @param {Array<string>} symbols - Array of symbols to unsubscribe from
     */
    async unsubscribeFromPrices(symbols) {
        throw new Error('unsubscribeFromPrices() must be implemented by broker subclass');
    }

    /**
     * Validate order before placing
     * @param {Object} order - Order to validate
     */
    validateOrder(order) {
        if (!order.symbol) {
            throw new Error('Symbol is required');
        }
        if (!order.side || !['buy', 'sell'].includes(order.side.toLowerCase())) {
            throw new Error('Side must be "buy" or "sell"');
        }
        if (!order.quantity || order.quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
        if (!order.orderType) {
            throw new Error('Order type is required');
        }
        return true;
    }

    /**
     * Normalize order response
     */
    normalizeOrder(rawOrder) {
        return {
            id: rawOrder.id,
            symbol: rawOrder.symbol,
            side: rawOrder.side,
            quantity: rawOrder.quantity,
            orderType: rawOrder.orderType || rawOrder.type,
            status: rawOrder.status,
            filledQuantity: rawOrder.filledQuantity || 0,
            avgFillPrice: rawOrder.avgFillPrice || null,
            createdAt: rawOrder.createdAt || rawOrder.submitted_at,
            updatedAt: rawOrder.updatedAt || rawOrder.updated_at
        };
    }

    /**
     * Normalize position response
     */
    normalizePosition(rawPosition) {
        return {
            symbol: rawPosition.symbol,
            quantity: parseFloat(rawPosition.quantity || rawPosition.qty),
            averageCost: parseFloat(rawPosition.averageCost || rawPosition.avg_entry_price),
            currentPrice: parseFloat(rawPosition.currentPrice || rawPosition.current_price),
            marketValue: parseFloat(rawPosition.marketValue || rawPosition.market_value),
            unrealizedPnL: parseFloat(rawPosition.unrealizedPnL || rawPosition.unrealized_pl),
            unrealizedPnLPercent: parseFloat(rawPosition.unrealizedPnLPercent || rawPosition.unrealized_plpc) * 100
        };
    }

    /**
     * Check if broker is connected
     */
    isReady() {
        return this.isConnected;
    }
}

module.exports = BaseBroker;



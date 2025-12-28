// Broker Manager - Manages multiple broker connections
const BrokerFactory = require('./brokerFactory');
const { query } = require('../../database/db');

class BrokerManager {
    constructor() {
        this.brokers = new Map(); // portfolioId -> broker instance
        this.defaultBroker = null;
    }

    /**
     * Initialize default broker (for paper trading)
     */
    async initializeDefaultBroker() {
        try {
            const broker = BrokerFactory.createFromEnv('paper');
            await broker.connect();
            this.defaultBroker = broker;
            console.log('✅ Default broker (Paper Trading) initialized');
            return broker;
        } catch (error) {
            console.error('❌ Failed to initialize default broker:', error.message);
            console.log('💡 Make sure ALPACA_API_KEY and ALPACA_SECRET_KEY are set');
            return null;
        }
    }

    /**
     * Get broker for a portfolio
     */
    async getBrokerForPortfolio(portfolioId) {
        // Check if broker already exists
        if (this.brokers.has(portfolioId)) {
            return this.brokers.get(portfolioId);
        }

        // Get portfolio broker configuration
        const [portfolio] = await query(
            'SELECT broker, broker_account_id FROM portfolios WHERE id = $1',
            [portfolioId]
        );

        if (!portfolio) {
            throw new Error('Portfolio not found');
        }

        // If paper trading, use default broker
        if (!portfolio.broker || portfolio.broker === 'paper') {
            if (!this.defaultBroker) {
                await this.initializeDefaultBroker();
            }
            return this.defaultBroker;
        }

        // Create broker instance for this portfolio
        const config = await this.getBrokerConfig(portfolio.broker, portfolio.broker_account_id);
        const broker = BrokerFactory.createBroker(portfolio.broker, config);
        await broker.connect();

        // Cache the broker
        this.brokers.set(portfolioId, broker);

        return broker;
    }

    /**
     * Get broker configuration (from database or env)
     */
    async getBrokerConfig(brokerType, accountId) {
        // In production, you might store encrypted credentials in database
        // For now, use environment variables
        return BrokerFactory.getConfigFromEnv(brokerType);
    }

    /**
     * Place order through appropriate broker
     */
    async placeOrder(portfolioId, order) {
        const broker = await this.getBrokerForPortfolio(portfolioId);
        return await broker.placeOrder(order);
    }

    /**
     * Get positions for a portfolio
     */
    async getPositions(portfolioId) {
        const broker = await this.getBrokerForPortfolio(portfolioId);
        return await broker.getPositions();
    }

    /**
     * Get account info for a portfolio
     */
    async getAccount(portfolioId) {
        const broker = await this.getBrokerForPortfolio(portfolioId);
        return await broker.getAccount();
    }

    /**
     * Cancel order
     */
    async cancelOrder(portfolioId, orderId) {
        const broker = await this.getBrokerForPortfolio(portfolioId);
        return await broker.cancelOrder(orderId);
    }

    /**
     * Get current price
     */
    async getCurrentPrice(symbol, portfolioId = null) {
        const broker = portfolioId
            ? await this.getBrokerForPortfolio(portfolioId)
            : this.defaultBroker || await this.initializeDefaultBroker();

        return await broker.getCurrentPrice(symbol);
    }

    /**
     * Get historical data
     */
    async getHistoricalData(symbol, timeframe, start, end, portfolioId = null) {
        const broker = portfolioId
            ? await this.getBrokerForPortfolio(portfolioId)
            : this.defaultBroker || await this.initializeDefaultBroker();

        return await broker.getHistoricalData(symbol, timeframe, start, end);
    }

    /**
     * Subscribe to price updates
     */
    async subscribeToPrices(symbols, callback, portfolioId = null) {
        const broker = portfolioId
            ? await this.getBrokerForPortfolio(portfolioId)
            : this.defaultBroker || await this.initializeDefaultBroker();

        return await broker.subscribeToPrices(symbols, callback);
    }

    /**
     * Get list of supported brokers
     */
    getSupportedBrokers() {
        return BrokerFactory.getSupportedBrokers();
    }

    /**
     * Disconnect all brokers
     */
    async disconnectAll() {
        for (const [portfolioId, broker] of this.brokers.entries()) {
            try {
                await broker.disconnect();
                console.log(`Disconnected broker for portfolio ${portfolioId}`);
            } catch (error) {
                console.error(`Error disconnecting broker for portfolio ${portfolioId}:`, error);
            }
        }

        if (this.defaultBroker) {
            await this.defaultBroker.disconnect();
        }

        this.brokers.clear();
        console.log('All brokers disconnected');
    }

    /**
     * Health check for all brokers
     */
    async healthCheck() {
        const health = {
            default: this.defaultBroker ? this.defaultBroker.isReady() : false,
            portfolios: {}
        };

        for (const [portfolioId, broker] of this.brokers.entries()) {
            health.portfolios[portfolioId] = broker.isReady();
        }

        return health;
    }
}

// Export singleton instance
module.exports = new BrokerManager();



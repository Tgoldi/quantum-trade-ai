// Broker Factory - Creates broker instances
const AlpacaBroker = require('./alpacaBroker');
const InteractiveBrokersBroker = require('./interactiveBrokersBroker');

class BrokerFactory {
    static SUPPORTED_BROKERS = {
        ALPACA: 'alpaca',
        INTERACTIVE_BROKERS: 'interactive_brokers',
        PAPER: 'paper' // Paper trading (uses Alpaca in paper mode)
    };

    /**
     * Create a broker instance
     * @param {string} brokerType - Type of broker (alpaca, interactive_brokers, paper)
     * @param {Object} config - Broker configuration
     * @returns {BaseBroker} Broker instance
     */
    static createBroker(brokerType, config) {
        switch (brokerType.toLowerCase()) {
            case this.SUPPORTED_BROKERS.ALPACA:
                return new AlpacaBroker({
                    ...config,
                    paper: false
                });

            case this.SUPPORTED_BROKERS.PAPER:
                return new AlpacaBroker({
                    ...config,
                    paper: true
                });

            case this.SUPPORTED_BROKERS.INTERACTIVE_BROKERS:
                return new InteractiveBrokersBroker(config);

            default:
                throw new Error(`Unsupported broker type: ${brokerType}`);
        }
    }

    /**
     * Get list of supported brokers
     */
    static getSupportedBrokers() {
        return Object.values(this.SUPPORTED_BROKERS);
    }

    /**
     * Validate broker configuration
     */
    static validateConfig(brokerType, config) {
        switch (brokerType.toLowerCase()) {
            case this.SUPPORTED_BROKERS.ALPACA:
            case this.SUPPORTED_BROKERS.PAPER:
                if (!config.apiKey || !config.apiSecret) {
                    throw new Error('Alpaca requires apiKey and apiSecret');
                }
                break;

            case this.SUPPORTED_BROKERS.INTERACTIVE_BROKERS:
                if (!config.host || !config.port) {
                    throw new Error('Interactive Brokers requires host and port');
                }
                break;

            default:
                throw new Error(`Unknown broker type: ${brokerType}`);
        }

        return true;
    }

    /**
     * Create broker from environment variables
     */
    static createFromEnv(brokerType) {
        const config = this.getConfigFromEnv(brokerType);
        return this.createBroker(brokerType, config);
    }

    /**
     * Get broker configuration from environment variables
     */
    static getConfigFromEnv(brokerType) {
        switch (brokerType.toLowerCase()) {
            case this.SUPPORTED_BROKERS.ALPACA:
            case this.SUPPORTED_BROKERS.PAPER:
                return {
                    apiKey: process.env.ALPACA_API_KEY,
                    apiSecret: process.env.ALPACA_SECRET_KEY
                };

            case this.SUPPORTED_BROKERS.INTERACTIVE_BROKERS:
                return {
                    host: process.env.IB_HOST || 'localhost',
                    port: parseInt(process.env.IB_PORT) || 7497,
                    clientId: parseInt(process.env.IB_CLIENT_ID) || 1
                };

            default:
                throw new Error(`Unknown broker type: ${brokerType}`);
        }
    }
}

module.exports = BrokerFactory;



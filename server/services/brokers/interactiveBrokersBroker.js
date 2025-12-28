// Interactive Brokers Implementation using @stoqey/ib
const BaseBroker = require('./baseBroker');
const { IBApi, EventName, ErrorCode, OrderAction, OrderType, TimeInForce } = require('@stoqey/ib');

class InteractiveBrokersBroker extends BaseBroker {
    constructor(config) {
        super(config);
        this.host = config.host || 'localhost';
        this.port = config.port || 7497; // 7497 for paper trading, 7496 for live
        this.clientId = config.clientId || 1;
        this.accountId = config.accountId || null;
        
        this.api = null;
        this.connected = false;
        this.nextOrderId = 1;
        this.priceCache = new Map();
        this.orderCallbacks = new Map();
        this.positionCache = new Map();
        this.accountCache = null;
    }

    /**
     * Connect to IB Gateway/TWS
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`🔗 Connecting to Interactive Brokers Gateway at ${this.host}:${this.port}...`);
                
                this.api = new IBApi({
                    clientId: this.clientId,
                    host: this.host,
                    port: this.port
                });

                // Set up event listeners
                this.setupEventListeners();

                // Connect
                this.api.connect();

                // Wait for successful connection
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout - Make sure IB Gateway is running'));
                }, 10000);

                this.api.once(EventName.connected, () => {
                    clearTimeout(timeout);
                    this.connected = true;
                    console.log('✅ Connected to Interactive Brokers');
                    
                    // Request next valid order ID
                    this.api.reqIds();
                    
                    resolve();
                });

                this.api.once(EventName.error, (err, code, reqId) => {
                    if (code === ErrorCode.CONNECT_FAIL) {
                        clearTimeout(timeout);
                        reject(new Error(`Failed to connect to IB Gateway: ${err}`));
                    }
                });

            } catch (error) {
                reject(new Error(`IB Connection error: ${error.message}`));
            }
        });
    }

    /**
     * Set up event listeners for IB API
     */
    setupEventListeners() {
        // Next valid order ID
        this.api.on(EventName.nextValidId, (orderId) => {
            this.nextOrderId = orderId;
            console.log(`📝 Next order ID: ${orderId}`);
        });

        // Account updates
        this.api.on(EventName.updateAccountValue, (key, value, currency, accountName) => {
            if (!this.accountCache) this.accountCache = {};
            this.accountCache[key] = { value, currency, accountName };
        });

        // Position updates
        this.api.on(EventName.position, (account, contract, pos, avgCost) => {
            this.positionCache.set(contract.symbol, {
                symbol: contract.symbol,
                position: pos,
                avgCost: avgCost,
                contract: contract
            });
        });

        // Order status updates
        this.api.on(EventName.orderStatus, (orderId, status, filled, remaining, avgFillPrice) => {
            const callback = this.orderCallbacks.get(orderId);
            if (callback) {
                callback({
                    orderId,
                    status,
                    filled,
                    remaining,
                    avgFillPrice
                });
            }
        });

        // Tick price updates (for real-time prices)
        this.api.on(EventName.tickPrice, (reqId, tickType, price) => {
            // tickType 4 = LAST price
            if (tickType === 4) {
                const cachedItem = Array.from(this.priceCache.values()).find(item => item.reqId === reqId);
                if (cachedItem) {
                    cachedItem.price = price;
                    cachedItem.updatedAt = Date.now();
                }
            }
        });

        // Error handling
        this.api.on(EventName.error, (err, code, reqId) => {
            console.error(`IB API Error [${code}]: ${err}`);
        });

        // Disconnection
        this.api.on(EventName.disconnected, () => {
            this.connected = false;
            console.warn('⚠️  Disconnected from Interactive Brokers');
        });
    }

    /**
     * Disconnect from IB
     */
    async disconnect() {
        if (this.api && this.connected) {
            this.api.disconnect();
            this.connected = false;
            console.log('✅ Disconnected from Interactive Brokers');
        }
    }

    /**
     * Get account information
     */
    async getAccount() {
        if (!this.connected) {
            throw new Error('Not connected to IB Gateway');
        }

        return new Promise((resolve, reject) => {
            // Request account summary
            this.api.reqAccountSummary(9001, 'All', 'NetLiquidation,TotalCashValue,BuyingPower');

            const timeout = setTimeout(() => {
                reject(new Error('Account request timeout'));
            }, 5000);

            this.api.once(EventName.accountSummary, (reqId, account, tag, value, currency) => {
                clearTimeout(timeout);
                
                const accountData = {
                    account_number: account,
                    portfolio_value: parseFloat(value),
                    cash: this.accountCache?.TotalCashValue?.value || 0,
                    buying_power: this.accountCache?.BuyingPower?.value || 0,
                    currency: currency
                };

                resolve(this.normalizeAccount(accountData));
            });
        });
    }

    /**
     * Get current positions
     */
    async getPositions() {
        if (!this.connected) {
            throw new Error('Not connected to IB Gateway');
        }

        return new Promise((resolve, reject) => {
            // Clear position cache
            this.positionCache.clear();

            // Request positions
            this.api.reqPositions();

            // Wait for positions to be populated
            setTimeout(() => {
                const positions = Array.from(this.positionCache.values()).map(pos => ({
                    symbol: pos.symbol,
                    quantity: pos.position,
                    avg_entry_price: pos.avgCost,
                    current_price: 0, // Will be updated via market data
                    market_value: pos.position * pos.avgCost,
                    unrealized_pl: 0,
                    unrealized_plpc: 0
                }));

                resolve(positions.map(pos => this.normalizePosition(pos)));
            }, 2000);
        });
    }

    /**
     * Place an order
     */
    async placeOrder(order) {
        if (!this.connected) {
            throw new Error('Not connected to IB Gateway');
        }

        this.validateOrder(order);

        return new Promise((resolve, reject) => {
            const orderId = this.nextOrderId++;

            // Create IB contract
            const contract = {
                symbol: order.symbol.toUpperCase(),
                secType: 'STK',
                exchange: 'SMART',
                currency: 'USD'
            };

            // Create IB order
            const ibOrder = {
                orderId: orderId,
                action: order.side.toLowerCase() === 'buy' ? OrderAction.BUY : OrderAction.SELL,
                totalQuantity: order.quantity,
                orderType: order.orderType.toUpperCase() === 'MARKET' ? OrderType.MKT : OrderType.LMT,
                tif: TimeInForce.DAY
            };

            if (order.orderType.toLowerCase() === 'limit' && order.limitPrice) {
                ibOrder.lmtPrice = order.limitPrice;
            }

            // Set up callback for order status
            this.orderCallbacks.set(orderId, (status) => {
                if (status.status === 'Filled') {
                    resolve(this.normalizeOrder({
                        id: orderId.toString(),
                        symbol: order.symbol,
                        side: order.side,
                        quantity: order.quantity,
                        filled_qty: status.filled,
                        avg_fill_price: status.avgFillPrice,
                        status: 'filled',
                        order_type: order.orderType
                    }));
                    this.orderCallbacks.delete(orderId);
                } else if (status.status === 'Cancelled' || status.status === 'Rejected') {
                    reject(new Error(`Order ${status.status}: ${orderId}`));
                    this.orderCallbacks.delete(orderId);
                }
            });

            // Place order
            this.api.placeOrder(orderId, contract, ibOrder);

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.orderCallbacks.has(orderId)) {
                    this.orderCallbacks.delete(orderId);
                    reject(new Error('Order placement timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        if (!this.connected) {
            throw new Error('Not connected to IB Gateway');
        }

        this.api.cancelOrder(parseInt(orderId));
        return { success: true, orderId };
    }

    /**
     * Get current price for a symbol
     */
    async getCurrentPrice(symbol) {
        if (!this.connected) {
            throw new Error('Not connected to IB Gateway');
        }

        // Check cache
        const cached = this.priceCache.get(symbol);
        if (cached && Date.now() - cached.updatedAt < 5000) {
            return cached.price;
        }

        return new Promise((resolve, reject) => {
            const reqId = Date.now(); // Unique request ID

            const contract = {
                symbol: symbol.toUpperCase(),
                secType: 'STK',
                exchange: 'SMART',
                currency: 'USD'
            };

            // Cache entry
            this.priceCache.set(symbol, {
                reqId,
                price: 0,
                updatedAt: 0
            });

            // Request market data
            this.api.reqMktData(reqId, contract, '', false, false);

            // Wait for price update
            const timeout = setTimeout(() => {
                this.api.cancelMktData(reqId);
                const cached = this.priceCache.get(symbol);
                if (cached && cached.price > 0) {
                    resolve(cached.price);
                } else {
                    reject(new Error(`Timeout getting price for ${symbol}`));
                }
            }, 5000);

            // Check periodically for price update
            const checkInterval = setInterval(() => {
                const cached = this.priceCache.get(symbol);
                if (cached && cached.price > 0) {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    this.api.cancelMktData(reqId);
                    resolve(cached.price);
                }
            }, 100);
        });
    }

    /**
     * Get historical data
     */
    async getHistoricalData(symbol, timeframe, start, end) {
        if (!this.connected) {
            throw new Error('Not connected to IB Gateway');
        }

        return new Promise((resolve, reject) => {
            const reqId = Date.now();
            const bars = [];

            const contract = {
                symbol: symbol.toUpperCase(),
                secType: 'STK',
                exchange: 'SMART',
                currency: 'USD'
            };

            // Map timeframe to IB format
            const barSize = this.mapTimeframeToIB(timeframe);
            const duration = '1 M'; // 1 month of data

            this.api.on(EventName.historicalData, (reqId, date, open, high, low, close, volume) => {
                if (date.startsWith('finished')) {
                    resolve(bars);
                } else {
                    bars.push({
                        timestamp: new Date(date).toISOString(),
                        open,
                        high,
                        low,
                        close,
                        volume
                    });
                }
            });

            this.api.reqHistoricalData(
                reqId,
                contract,
                '', // endDateTime (empty = now)
                duration,
                barSize,
                'TRADES',
                1, // useRTH
                1  // formatDate
            );

            setTimeout(() => reject(new Error('Historical data timeout')), 10000);
        });
    }

    /**
     * Map timeframe to IB bar size
     */
    mapTimeframeToIB(timeframe) {
        const map = {
            '1Min': '1 min',
            '5Min': '5 mins',
            '15Min': '15 mins',
            '1Hour': '1 hour',
            '1Day': '1 day'
        };
        return map[timeframe] || '1 day';
    }

    /**
     * Normalize account data
     */
    normalizeAccount(data) {
        return {
            id: data.account_number,
            portfolio_value: parseFloat(data.portfolio_value || 0),
            cash: parseFloat(data.cash || 0),
            buying_power: parseFloat(data.buying_power || 0),
            currency: data.currency || 'USD'
        };
    }

    /**
     * Normalize position data
     */
    normalizePosition(data) {
        return {
            symbol: data.symbol,
            quantity: parseFloat(data.quantity || 0),
            avg_entry_price: parseFloat(data.avg_entry_price || 0),
            current_price: parseFloat(data.current_price || 0),
            market_value: parseFloat(data.market_value || 0),
            unrealized_pl: parseFloat(data.unrealized_pl || 0),
            unrealized_plpc: parseFloat(data.unrealized_plpc || 0)
        };
    }

    /**
     * Normalize order data
     */
    normalizeOrder(data) {
        return {
            id: data.id,
            symbol: data.symbol,
            side: data.side,
            quantity: parseFloat(data.quantity),
            filled_qty: parseFloat(data.filled_qty || 0),
            avg_fill_price: parseFloat(data.avg_fill_price || 0),
            status: data.status,
            order_type: data.order_type
        };
    }
}

module.exports = InteractiveBrokersBroker;

// Paper Trading Service - Simulated Order Execution
const { query, transaction, cache } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class PaperTradingService {
    constructor() {
        this.slippagePercent = 0.001; // 0.1% slippage
        this.commissionRate = 0.0; // Free for paper trading
    }

    /**
     * Execute a paper trade order
     */
    async executePaperTrade(portfolioId, order) {
        const {
            symbol,
            side, // 'buy' or 'sell'
            quantity,
            orderType = 'market', // market, limit
            limitPrice = null,
            strategy = 'manual'
        } = order;

        // Get current market price
        const currentPrice = await this.getCurrentPrice(symbol);

        if (!currentPrice) {
            throw new Error(`Unable to get current price for ${symbol}`);
        }

        // Calculate execution price with slippage
        const executionPrice = this.calculateExecutionPrice(currentPrice, side, orderType, limitPrice);

        if (!executionPrice) {
            return {
                status: 'rejected',
                reason: 'Limit price not met'
            };
        }

        // Calculate costs
        const totalAmount = quantity * executionPrice;
        const commission = totalAmount * this.commissionRate;
        const totalCost = side === 'buy' ? totalAmount + commission : totalAmount - commission;

        return await transaction(async (client) => {
            // Check portfolio balance for buy orders
            if (side === 'buy') {
                const result = await client.query(
                    'SELECT current_balance FROM portfolios WHERE id = $1',
                    [portfolioId]
                );
                const portfolio = result.rows[0]; // Fix: access rows array

                if (!portfolio || parseFloat(portfolio.current_balance) < totalCost) {
                    throw new Error('Insufficient funds for this trade');
                }

                // Deduct from balance
                await client.query(
                    'UPDATE portfolios SET current_balance = current_balance - $1, updated_at = NOW() WHERE id = $2',
                    [totalCost, portfolioId]
                );
            } else {
                // Check if position exists for sell orders
                const result = await client.query(
                    'SELECT quantity FROM positions WHERE portfolio_id = $1 AND symbol = $2',
                    [portfolioId, symbol]
                );
                const position = result.rows[0]; // Fix: access rows array

                if (!position || parseFloat(position.quantity) < quantity) {
                    throw new Error('Insufficient shares to sell');
                }

                // Add to balance
                await client.query(
                    'UPDATE portfolios SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2',
                    [totalCost, portfolioId]
                );
            }

            // Record the trade
            const tradeId = uuidv4();
            await client.query(
                `INSERT INTO trades (id, portfolio_id, symbol, side, quantity, price, commission, total_amount, order_type, strategy, execution_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'filled')`,
                [tradeId, portfolioId, symbol, side, quantity, executionPrice, commission, totalAmount, orderType, strategy]
            );

            // Update or create position
            await this.updatePosition(client, portfolioId, symbol, side, quantity, executionPrice);

            // Invalidate cache
            await cache.del(`portfolio:${portfolioId}`);
            await cache.del(`positions:${portfolioId}`);

            // Publish real-time update
            await cache.publish('trades', {
                portfolioId,
                tradeId,
                symbol,
                side,
                quantity,
                price: executionPrice
            });

            return {
                status: 'filled',
                tradeId,
                executionPrice,
                totalAmount,
                commission,
                executedAt: new Date()
            };
        });
    }

    /**
     * Update position after trade
     */
    async updatePosition(client, portfolioId, symbol, side, quantity, price) {
        const result = await client.query(
            'SELECT * FROM positions WHERE portfolio_id = $1 AND symbol = $2',
            [portfolioId, symbol]
        );
        const existingPosition = result.rows[0]; // Fix: access rows array

        if (side === 'buy') {
            if (existingPosition) {
                // Update existing position
                const newQuantity = parseFloat(existingPosition.quantity) + quantity;
                const newAverageCost = (
                    (parseFloat(existingPosition.average_cost) * parseFloat(existingPosition.quantity)) +
                    (price * quantity)
                ) / newQuantity;

                await client.query(
                    `UPDATE positions 
           SET quantity = $1, average_cost = $2, current_price = $3, updated_at = NOW()
           WHERE portfolio_id = $4 AND symbol = $5`,
                    [newQuantity, newAverageCost, price, portfolioId, symbol]
                );
            } else {
                // Create new position
                await client.query(
                    `INSERT INTO positions (portfolio_id, symbol, quantity, average_cost, current_price, asset_type)
           VALUES ($1, $2, $3, $4, $5, 'stock')`,
                    [portfolioId, symbol, quantity, price, price]
                );
            }
        } else {
            // Sell order
            if (existingPosition) {
                const newQuantity = parseFloat(existingPosition.quantity) - quantity;

                if (newQuantity <= 0) {
                    // Close position
                    await client.query(
                        'DELETE FROM positions WHERE portfolio_id = $1 AND symbol = $2',
                        [portfolioId, symbol]
                    );
                } else {
                    // Reduce position
                    await client.query(
                        `UPDATE positions 
             SET quantity = $1, current_price = $2, updated_at = NOW()
             WHERE portfolio_id = $3 AND symbol = $4`,
                        [newQuantity, price, portfolioId, symbol]
                    );
                }
            }
        }
    }

    /**
     * Calculate execution price with slippage
     */
    calculateExecutionPrice(marketPrice, side, orderType, limitPrice) {
        if (orderType === 'limit') {
            if (side === 'buy' && limitPrice < marketPrice) {
                return null; // Limit not met
            }
            if (side === 'sell' && limitPrice > marketPrice) {
                return null; // Limit not met
            }
            return limitPrice;
        }

        // Market order - apply slippage
        const slippage = marketPrice * this.slippagePercent;
        return side === 'buy'
            ? marketPrice + slippage
            : marketPrice - slippage;
    }

    /**
     * Get current market price (cached)
     */
    async getCurrentPrice(symbol) {
        const cacheKey = `price:${symbol}`;
        let price = await cache.get(cacheKey);

        if (!price) {
            // In production, fetch from real API
            // For now, simulate
            price = Math.random() * 500 + 100;
            await cache.set(cacheKey, price, 5); // Cache for 5 seconds
        }

        return price;
    }

    /**
     * Get portfolio summary
     */
    async getPortfolioSummary(portfolioId) {
        const cacheKey = `portfolio:${portfolioId}`;
        let summary = await cache.get(cacheKey);

        if (summary) {
            return summary;
        }

        const [portfolio] = await query(
            'SELECT * FROM portfolio_summary WHERE id = $1',
            [portfolioId]
        );

        if (portfolio) {
            await cache.set(cacheKey, portfolio, 30);
        }

        return portfolio;
    }

    /**
     * Get portfolio positions
     */
    async getPositions(portfolioId) {
        const positions = await query(
            'SELECT * FROM positions WHERE portfolio_id = $1 ORDER BY market_value DESC',
            [portfolioId],
            `positions:${portfolioId}`,
            30
        );

        // Update current prices in real-time
        for (const position of positions) {
            const currentPrice = await this.getCurrentPrice(position.symbol);
            position.current_price = currentPrice;
            position.market_value = position.quantity * currentPrice;
            position.unrealized_pnl = position.market_value - (position.quantity * position.average_cost);
            position.unrealized_pnl_percent = (position.unrealized_pnl / (position.quantity * position.average_cost)) * 100;
        }

        return positions;
    }

    /**
     * Get trade history
     */
    async getTradeHistory(portfolioId, limit = 100) {
        return await query(
            'SELECT * FROM trades WHERE portfolio_id = $1 ORDER BY execution_time DESC LIMIT $2',
            [portfolioId, limit]
        );
    }

    /**
     * Calculate performance metrics
     */
    async calculatePerformance(portfolioId) {
        const [portfolio] = await query(
            'SELECT * FROM portfolios WHERE id = $1',
            [portfolioId]
        );

        if (!portfolio) return null;

        const positions = await this.getPositions(portfolioId);
        const totalPositionValue = positions.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0);
        const totalValue = parseFloat(portfolio.current_balance) + totalPositionValue;
        const totalReturn = totalValue - parseFloat(portfolio.initial_balance);
        const totalReturnPercent = (totalReturn / parseFloat(portfolio.initial_balance)) * 100;

        return {
            portfolioId,
            totalValue,
            cash: parseFloat(portfolio.current_balance),
            positionsValue: totalPositionValue,
            totalReturn,
            totalReturnPercent,
            positionsCount: positions.length
        };
    }
}

module.exports = new PaperTradingService();



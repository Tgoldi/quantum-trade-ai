// Advanced Risk Management Service
const { query, cache } = require('../database/db');
const realTimeData = require('./realTimeDataService');

class RiskManagementService {
    constructor() {
        this.riskLimits = {
            maxPositionSize: 0.20, // 20% of portfolio per position
            maxDailyLoss: 0.02, // 2% max daily loss
            maxTotalExposure: 1.0, // 100% max exposure
            minCashReserve: 0.05, // 5% minimum cash
            maxLeverage: 1.0, // No leverage by default
            maxCorrelation: 0.7 // Max correlation between positions
        };

        this.positionSizingMethod = 'kelly'; // kelly, fixed_fractional, volatility_based
    }

    /**
     * Validate trade before execution
     */
    async validateTrade(portfolioId, trade) {
        const checks = {
            passed: true,
            violations: [],
            warnings: [],
            adjustedQuantity: trade.quantity
        };

        try {
            // Get portfolio state
            const portfolio = await this.getPortfolioState(portfolioId);

            // Check 1: Position size limit
            const positionSizeCheck = await this.checkPositionSize(portfolio, trade);
            if (!positionSizeCheck.passed) {
                checks.passed = false;
                checks.violations.push(positionSizeCheck.message);
            } else if (positionSizeCheck.adjusted) {
                checks.adjustedQuantity = positionSizeCheck.adjustedQuantity;
                checks.warnings.push(positionSizeCheck.message);
            }

            // Check 2: Daily loss limit
            const dailyLossCheck = await this.checkDailyLoss(portfolio, trade);
            if (!dailyLossCheck.passed) {
                checks.passed = false;
                checks.violations.push(dailyLossCheck.message);
            }

            // Check 3: Cash reserve
            const cashCheck = this.checkCashReserve(portfolio, trade);
            if (!cashCheck.passed) {
                checks.passed = false;
                checks.violations.push(cashCheck.message);
            }

            // Check 4: Correlation risk
            const correlationCheck = await this.checkCorrelation(portfolio, trade);
            if (!correlationCheck.passed) {
                checks.warnings.push(correlationCheck.message);
            }

            // Check 5: Volatility risk
            const volatilityCheck = await this.checkVolatility(trade.symbol);
            if (volatilityCheck.warning) {
                checks.warnings.push(volatilityCheck.message);
            }

            return checks;
        } catch (error) {
            console.error('Risk validation error:', error);
            return {
                passed: false,
                violations: ['Risk validation failed: ' + error.message],
                warnings: [],
                adjustedQuantity: trade.quantity
            };
        }
    }

    /**
     * Check position size limits
     */
    async checkPositionSize(portfolio, trade) {
        if (trade.side !== 'buy') {
            return { passed: true };
        }

        const price = await realTimeData.getCurrentPrice(trade.symbol);
        const tradeValue = trade.quantity * price;
        const portfolioValue = portfolio.totalValue;
        const positionSizePercent = tradeValue / portfolioValue;

        if (positionSizePercent > this.riskLimits.maxPositionSize) {
            // Auto-adjust quantity
            const maxTradeValue = portfolioValue * this.riskLimits.maxPositionSize;
            const adjustedQuantity = Math.floor(maxTradeValue / price);

            if (adjustedQuantity === 0) {
                return {
                    passed: false,
                    message: `Position too large. Max allowed: ${(this.riskLimits.maxPositionSize * 100).toFixed(0)}% of portfolio`
                };
            }

            return {
                passed: true,
                adjusted: true,
                adjustedQuantity,
                message: `Position size adjusted from ${trade.quantity} to ${adjustedQuantity} shares (${(this.riskLimits.maxPositionSize * 100).toFixed(0)}% limit)`
            };
        }

        return { passed: true };
    }

    /**
     * Check daily loss limit
     */
    async checkDailyLoss(portfolio, trade) {
        const todayPnL = await this.getTodayPnL(portfolio.id);
        const maxLoss = portfolio.totalValue * this.riskLimits.maxDailyLoss;

        if (Math.abs(todayPnL) >= maxLoss) {
            return {
                passed: false,
                message: `Daily loss limit reached: ${(todayPnL / portfolio.totalValue * 100).toFixed(2)}% (max: ${(this.riskLimits.maxDailyLoss * 100).toFixed(0)}%)`
            };
        }

        return { passed: true };
    }

    /**
     * Check cash reserve
     */
    checkCashReserve(portfolio, trade) {
        if (trade.side !== 'buy') {
            return { passed: true };
        }

        const minCash = portfolio.totalValue * this.riskLimits.minCashReserve;
        const remainingCash = portfolio.cash - (trade.quantity * trade.price);

        if (remainingCash < minCash) {
            return {
                passed: false,
                message: `Insufficient cash reserve. Min required: $${minCash.toFixed(2)}`
            };
        }

        return { passed: true };
    }

    /**
     * Check correlation between positions
     */
    async checkCorrelation(portfolio, trade) {
        // Simplified correlation check
        // In production, calculate actual correlations from historical data
        const sectorCorrelations = {
            'AAPL': 'tech', 'MSFT': 'tech', 'GOOGL': 'tech', 'META': 'tech',
            'NVDA': 'semiconductor', 'AMD': 'semiconductor',
            'TSLA': 'automotive', 'F': 'automotive',
            'JPM': 'finance', 'BAC': 'finance', 'WFC': 'finance'
        };

        const newSector = sectorCorrelations[trade.symbol] || 'other';
        let sectorExposure = 0;

        for (const position of portfolio.positions) {
            const positionSector = sectorCorrelations[position.symbol] || 'other';
            if (positionSector === newSector) {
                sectorExposure += position.market_value;
            }
        }

        const sectorPercent = (sectorExposure / portfolio.totalValue);

        if (sectorPercent > 0.4) { // 40% sector concentration
            return {
                passed: true, // Warning only, not blocking
                message: `High sector concentration: ${(sectorPercent * 100).toFixed(0)}% in ${newSector}`
            };
        }

        return { passed: true };
    }

    /**
     * Check volatility risk
     */
    async checkVolatility(symbol) {
        // Calculate historical volatility
        const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 30);

        if (historicalData.length < 2) {
            return { warning: false };
        }

        const returns = [];
        for (let i = 1; i < historicalData.length; i++) {
            const dailyReturn = (historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close;
            returns.push(dailyReturn);
        }

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

        if (volatility > 0.5) { // 50% annualized volatility
            return {
                warning: true,
                message: `High volatility detected: ${(volatility * 100).toFixed(1)}% annualized`,
                volatility
            };
        }

        return { warning: false, volatility };
    }

    /**
     * Calculate optimal position size using Kelly Criterion
     */
    calculateKellyPosition(winRate, avgWin, avgLoss, capital) {
        const winLossRatio = Math.abs(avgWin / avgLoss);
        const kellyPercent = (winRate - ((1 - winRate) / winLossRatio));

        // Use half-Kelly for safety (Kelly is aggressive)
        const halfKelly = Math.max(0, Math.min(kellyPercent / 2, this.riskLimits.maxPositionSize));

        return capital * halfKelly;
    }

    /**
     * Calculate position size based on volatility
     */
    async calculateVolatilityBasedPosition(symbol, capital, targetVolatility = 0.02) {
        const volatilityData = await this.checkVolatility(symbol);
        const symbolVolatility = volatilityData.volatility || 0.3;

        // Position size inversely proportional to volatility
        const positionSize = (targetVolatility / symbolVolatility) * capital;

        return Math.min(positionSize, capital * this.riskLimits.maxPositionSize);
    }

    /**
     * Auto-calculate stop loss
     */
    async calculateStopLoss(symbol, entryPrice, method = 'atr') {
        if (method === 'atr') {
            // Use Average True Range (ATR)
            const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 14);

            if (historicalData.length < 14) {
                // Fallback: 2% stop loss
                return entryPrice * 0.98;
            }

            // Calculate ATR
            let atrSum = 0;
            for (let i = 1; i < historicalData.length; i++) {
                const bar = historicalData[i];
                const prevClose = historicalData[i - 1].close;
                const tr = Math.max(
                    bar.high - bar.low,
                    Math.abs(bar.high - prevClose),
                    Math.abs(bar.low - prevClose)
                );
                atrSum += tr;
            }
            const atr = atrSum / 14;

            // Stop loss at 2 * ATR below entry
            return entryPrice - (2 * atr);
        } else {
            // Fixed percentage stop loss
            return entryPrice * 0.98; // 2% stop loss
        }
    }

    /**
     * Auto-calculate take profit
     */
    async calculateTakeProfit(symbol, entryPrice, riskRewardRatio = 2.0) {
        const stopLoss = await this.calculateStopLoss(symbol, entryPrice);
        const risk = entryPrice - stopLoss;
        const reward = risk * riskRewardRatio;

        return entryPrice + reward;
    }

    /**
     * Calculate Value at Risk (VaR)
     */
    async calculateVaR(portfolioId, confidenceLevel = 0.95, timeHorizon = 1) {
        const portfolio = await this.getPortfolioState(portfolioId);
        const positions = portfolio.positions;

        if (positions.length === 0) {
            return { var95: 0, var99: 0 };
        }

        // Get historical returns for all positions
        const allReturns = [];

        for (const position of positions) {
            const historicalData = await realTimeData.getHistoricalBars(position.symbol, '1Day', null, null, 252);
            const returns = [];

            for (let i = 1; i < historicalData.length; i++) {
                const dailyReturn = (historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close;
                returns.push(dailyReturn * position.market_value);
            }

            allReturns.push(...returns);
        }

        // Sort returns
        allReturns.sort((a, b) => a - b);

        // Calculate VaR at different confidence levels
        const var95Index = Math.floor(allReturns.length * 0.05);
        const var99Index = Math.floor(allReturns.length * 0.01);

        const var95 = Math.abs(allReturns[var95Index] || 0);
        const var99 = Math.abs(allReturns[var99Index] || 0);

        return {
            var95: var95 * Math.sqrt(timeHorizon),
            var99: var99 * Math.sqrt(timeHorizon),
            portfolioValue: portfolio.totalValue
        };
    }

    /**
     * Calculate portfolio metrics
     */
    async calculatePortfolioMetrics(portfolioId) {
        const portfolio = await this.getPortfolioState(portfolioId);
        const trades = await query(
            'SELECT * FROM trades WHERE portfolio_id = $1 AND execution_time >= NOW() - INTERVAL \'30 days\'',
            [portfolioId]
        );

        // Calculate win rate
        const closedTrades = trades.filter(t => t.side === 'sell');
        const wins = closedTrades.filter(t => parseFloat(t.total_amount) > 0).length;
        const winRate = closedTrades.length > 0 ? wins / closedTrades.length : 0;

        // Calculate Sharpe ratio
        const returns = [];
        for (let i = 1; i < trades.length; i++) {
            if (trades[i].side === 'sell' && trades[i - 1].side === 'buy') {
                const ret = (parseFloat(trades[i].price) - parseFloat(trades[i - 1].price)) / parseFloat(trades[i - 1].price);
                returns.push(ret);
            }
        }

        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const returnStd = returns.length > 1
            ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
            : 0;

        const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0;

        // Calculate max drawdown
        const performanceHistory = await query(
            'SELECT * FROM performance_metrics WHERE portfolio_id = $1 ORDER BY date',
            [portfolioId]
        );

        let maxDrawdown = 0;
        let peak = 0;

        for (const day of performanceHistory) {
            const value = parseFloat(day.portfolio_value);
            if (value > peak) {
                peak = value;
            }
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return {
            winRate,
            sharpeRatio,
            maxDrawdown,
            totalTrades: trades.length,
            avgReturn: avgReturn * 100,
            volatility: returnStd * Math.sqrt(252) * 100
        };
    }

    /**
     * Get portfolio current state
     */
    async getPortfolioState(portfolioId) {
        const cacheKey = `portfolio:state:${portfolioId}`;
        let state = await cache.get(cacheKey);

        if (state) {
            return state;
        }

        const [portfolio] = await query('SELECT * FROM portfolios WHERE id = $1', [portfolioId]);
        const positions = await query('SELECT * FROM positions WHERE portfolio_id = $1', [portfolioId]);

        // Update current prices
        for (const position of positions) {
            position.current_price = await realTimeData.getCurrentPrice(position.symbol);
            position.market_value = position.quantity * position.current_price;
        }

        const totalPositionValue = positions.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0);
        const totalValue = parseFloat(portfolio.current_balance) + totalPositionValue;

        state = {
            id: portfolio.id,
            cash: parseFloat(portfolio.current_balance),
            positionsValue: totalPositionValue,
            totalValue,
            positions
        };

        await cache.set(cacheKey, state, 10);
        return state;
    }

    /**
     * Get today's P&L
     */
    async getTodayPnL(portfolioId) {
        const today = new Date().toISOString().split('T')[0];
        const [metric] = await query(
            'SELECT daily_return, portfolio_value FROM performance_metrics WHERE portfolio_id = $1 AND date = $2',
            [portfolioId, today]
        );

        if (metric) {
            return parseFloat(metric.daily_return) * parseFloat(metric.portfolio_value);
        }

        return 0;
    }

    /**
     * Update risk limits
     */
    updateRiskLimits(newLimits) {
        this.riskLimits = { ...this.riskLimits, ...newLimits };
    }
}

module.exports = new RiskManagementService();



// Enhanced Backtesting Engine with Monte Carlo Simulation
const { query, cache } = require('../database/db');
const realTimeData = require('./realTimeDataService');
const riskManagement = require('./riskManagementService');
const { v4: uuidv4 } = require('uuid');

class BacktestingService {
    constructor() {
        this.commission = 0.001; // 0.1% commission
        this.slippage = 0.0005; // 0.05% slippage
    }

    /**
     * Run backtest with historical data
     */
    async runBacktest(config) {
        const {
            strategyConfig,
            symbols,
            startDate,
            endDate,
            initialCapital = 100000,
            userId
        } = config;

        console.log(`📊 Running backtest: ${strategyConfig.name} from ${startDate} to ${endDate}`);

        try {
            // Gather historical data for all symbols
            const historicalData = await this.gatherHistoricalData(symbols, startDate, endDate);

            // Initialize portfolio
            const portfolio = {
                cash: initialCapital,
                positions: {},
                value: initialCapital,
                trades: [],
                dailyValues: []
            };

            // Run simulation
            const results = await this.simulateStrategy(portfolio, historicalData, strategyConfig);

            // Calculate metrics
            const metrics = this.calculateBacktestMetrics(results, initialCapital);

            // Save results
            const backtestId = await this.saveBacktestResults({
                userId,
                name: strategyConfig.name,
                config: strategyConfig,
                startDate,
                endDate,
                initialCapital,
                results,
                metrics
            });

            return {
                id: backtestId,
                ...results,
                metrics
            };
        } catch (error) {
            console.error('Backtest error:', error);
            throw error;
        }
    }

    /**
     * Gather historical data for backtesting
     */
    async gatherHistoricalData(symbols, startDate, endDate) {
        const data = {};

        for (const symbol of symbols) {
            console.log(`📈 Fetching historical data for ${symbol}...`);

            const bars = await realTimeData.getHistoricalBars(
                symbol,
                '1Day',
                startDate,
                endDate,
                10000
            );

            data[symbol] = bars.sort((a, b) => new Date(a.time) - new Date(b.time));
        }

        return data;
    }

    /**
     * Simulate strategy over historical data
     */
    async simulateStrategy(portfolio, historicalData, strategyConfig) {
        const { type, parameters } = strategyConfig;

        // Get all unique dates
        const allDates = new Set();
        Object.values(historicalData).forEach(bars => {
            bars.forEach(bar => allDates.add(bar.time));
        });

        const sortedDates = Array.from(allDates).sort();

        // Simulate day by day
        for (const date of sortedDates) {
            // Get prices for this date
            const prices = {};
            for (const [symbol, bars] of Object.entries(historicalData)) {
                const bar = bars.find(b => b.time === date);
                if (bar) {
                    prices[symbol] = bar.close;
                }
            }

            // Update portfolio value
            let positionsValue = 0;
            for (const [symbol, position] of Object.entries(portfolio.positions)) {
                if (prices[symbol]) {
                    position.currentPrice = prices[symbol];
                    position.value = position.quantity * prices[symbol];
                    positionsValue += position.value;
                }
            }
            portfolio.value = portfolio.cash + positionsValue;

            // Record daily value
            portfolio.dailyValues.push({
                date,
                value: portfolio.value,
                cash: portfolio.cash,
                positionsValue
            });

            // Generate signals based on strategy
            const signals = await this.generateSignals(type, parameters, historicalData, date, prices);

            // Execute trades based on signals
            for (const signal of signals) {
                await this.executeBacktestTrade(portfolio, signal, prices[signal.symbol], date);
            }
        }

        return portfolio;
    }

    /**
     * Generate trading signals based on strategy
     */
    async generateSignals(strategyType, parameters, historicalData, currentDate, currentPrices) {
        const signals = [];

        for (const [symbol, bars] of Object.entries(historicalData)) {
            const relevantBars = bars.filter(b => new Date(b.time) <= new Date(currentDate));

            if (relevantBars.length < 50) continue; // Need enough data

            let signal = null;

            switch (strategyType) {
                case 'sma_crossover':
                    signal = this.smaCrossoverStrategy(relevantBars, parameters);
                    break;

                case 'rsi_oversold':
                    signal = this.rsiOversoldStrategy(relevantBars, parameters);
                    break;

                case 'macd':
                    signal = this.macdStrategy(relevantBars, parameters);
                    break;

                case 'mean_reversion':
                    signal = this.meanReversionStrategy(relevantBars, parameters);
                    break;

                case 'momentum':
                    signal = this.momentumStrategy(relevantBars, parameters);
                    break;

                default:
                    signal = null;
            }

            if (signal) {
                signals.push({
                    symbol,
                    action: signal.action,
                    quantity: signal.quantity,
                    reason: signal.reason
                });
            }
        }

        return signals;
    }

    /**
     * SMA Crossover Strategy
     */
    smaCrossoverStrategy(bars, params) {
        const { fastPeriod = 20, slowPeriod = 50 } = params;

        if (bars.length < slowPeriod) return null;

        const prices = bars.map(b => b.close);
        const fastSMA = prices.slice(-fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
        const slowSMA = prices.slice(-slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;

        const prevFastSMA = prices.slice(-fastPeriod - 1, -1).reduce((a, b) => a + b, 0) / fastPeriod;
        const prevSlowSMA = prices.slice(-slowPeriod - 1, -1).reduce((a, b) => a + b, 0) / slowPeriod;

        // Buy signal: fast crosses above slow
        if (prevFastSMA <= prevSlowSMA && fastSMA > slowSMA) {
            return {
                action: 'buy',
                quantity: 10,
                reason: `SMA crossover: ${fastPeriod} crossed above ${slowPeriod}`
            };
        }

        // Sell signal: fast crosses below slow
        if (prevFastSMA >= prevSlowSMA && fastSMA < slowSMA) {
            return {
                action: 'sell',
                quantity: 10,
                reason: `SMA crossover: ${fastPeriod} crossed below ${slowPeriod}`
            };
        }

        return null;
    }

    /**
     * RSI Oversold Strategy
     */
    rsiOversoldStrategy(bars, params) {
        const { period = 14, oversold = 30, overbought = 70 } = params;

        if (bars.length < period + 1) return null;

        const prices = bars.map(b => b.close);
        const rsi = this.calculateRSI(prices, period);

        if (rsi < oversold) {
            return {
                action: 'buy',
                quantity: 10,
                reason: `RSI oversold: ${rsi.toFixed(2)}`
            };
        }

        if (rsi > overbought) {
            return {
                action: 'sell',
                quantity: 10,
                reason: `RSI overbought: ${rsi.toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * MACD Strategy
     */
    macdStrategy(bars, params) {
        const { fast = 12, slow = 26, signal = 9 } = params;

        if (bars.length < slow + signal) return null;

        const prices = bars.map(b => b.close);
        const macd = this.calculateMACD(prices, fast, slow);
        const prevMACD = this.calculateMACD(prices.slice(0, -1), fast, slow);

        // Buy signal: MACD crosses above signal line
        if (prevMACD.histogram <= 0 && macd.histogram > 0) {
            return {
                action: 'buy',
                quantity: 10,
                reason: 'MACD bullish crossover'
            };
        }

        // Sell signal: MACD crosses below signal line
        if (prevMACD.histogram >= 0 && macd.histogram < 0) {
            return {
                action: 'sell',
                quantity: 10,
                reason: 'MACD bearish crossover'
            };
        }

        return null;
    }

    /**
     * Mean Reversion Strategy
     */
    meanReversionStrategy(bars, params) {
        const { period = 20, stdDevs = 2 } = params;

        if (bars.length < period) return null;

        const prices = bars.map(b => b.close);
        const recentPrices = prices.slice(-period);
        const mean = recentPrices.reduce((a, b) => a + b, 0) / period;
        const std = Math.sqrt(
            recentPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period
        );

        const currentPrice = prices[prices.length - 1];
        const lowerBand = mean - (std * stdDevs);
        const upperBand = mean + (std * stdDevs);

        if (currentPrice < lowerBand) {
            return {
                action: 'buy',
                quantity: 10,
                reason: `Mean reversion: price ${currentPrice.toFixed(2)} below lower band ${lowerBand.toFixed(2)}`
            };
        }

        if (currentPrice > upperBand) {
            return {
                action: 'sell',
                quantity: 10,
                reason: `Mean reversion: price ${currentPrice.toFixed(2)} above upper band ${upperBand.toFixed(2)}`
            };
        }

        return null;
    }

    /**
     * Momentum Strategy
     */
    momentumStrategy(bars, params) {
        const { lookback = 20, threshold = 0.05 } = params;

        if (bars.length < lookback) return null;

        const prices = bars.map(b => b.close);
        const currentPrice = prices[prices.length - 1];
        const pastPrice = prices[prices.length - lookback];
        const momentum = (currentPrice - pastPrice) / pastPrice;

        if (momentum > threshold) {
            return {
                action: 'buy',
                quantity: 10,
                reason: `Positive momentum: ${(momentum * 100).toFixed(2)}%`
            };
        }

        if (momentum < -threshold) {
            return {
                action: 'sell',
                quantity: 10,
                reason: `Negative momentum: ${(momentum * 100).toFixed(2)}%`
            };
        }

        return null;
    }

    /**
     * Execute backtest trade
     */
    async executeBacktestTrade(portfolio, signal, price, date) {
        const { symbol, action, quantity } = signal;

        const executionPrice = action === 'buy'
            ? price * (1 + this.slippage)
            : price * (1 - this.slippage);

        const cost = quantity * executionPrice;
        const commission = cost * this.commission;

        if (action === 'buy') {
            const totalCost = cost + commission;

            if (portfolio.cash < totalCost) {
                return; // Not enough cash
            }

            portfolio.cash -= totalCost;

            if (!portfolio.positions[symbol]) {
                portfolio.positions[symbol] = {
                    symbol,
                    quantity: 0,
                    averageCost: 0,
                    currentPrice: executionPrice
                };
            }

            const position = portfolio.positions[symbol];
            position.averageCost = ((position.averageCost * position.quantity) + cost) / (position.quantity + quantity);
            position.quantity += quantity;

            portfolio.trades.push({
                date,
                symbol,
                action,
                quantity,
                price: executionPrice,
                commission,
                total: totalCost
            });

        } else if (action === 'sell') {
            if (!portfolio.positions[symbol] || portfolio.positions[symbol].quantity < quantity) {
                return; // No position to sell
            }

            const totalRevenue = cost - commission;
            portfolio.cash += totalRevenue;

            const position = portfolio.positions[symbol];
            position.quantity -= quantity;

            if (position.quantity === 0) {
                delete portfolio.positions[symbol];
            }

            portfolio.trades.push({
                date,
                symbol,
                action,
                quantity,
                price: executionPrice,
                commission,
                total: totalRevenue
            });
        }
    }

    /**
     * Calculate comprehensive backtest metrics
     */
    calculateBacktestMetrics(portfolio, initialCapital) {
        const { dailyValues, trades } = portfolio;
        const finalValue = portfolio.value;

        // Total return
        const totalReturn = (finalValue - initialCapital) / initialCapital;

        // Calculate daily returns
        const dailyReturns = [];
        for (let i = 1; i < dailyValues.length; i++) {
            const ret = (dailyValues[i].value - dailyValues[i - 1].value) / dailyValues[i - 1].value;
            dailyReturns.push(ret);
        }

        // Sharpe ratio
        const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const returnStd = Math.sqrt(
            dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length
        );
        const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0;

        // Max drawdown
        let maxDrawdown = 0;
        let peak = initialCapital;

        for (const day of dailyValues) {
            if (day.value > peak) {
                peak = day.value;
            }
            const drawdown = (peak - day.value) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Win rate and trade statistics
        const buyTrades = trades.filter(t => t.action === 'buy');
        const sellTrades = trades.filter(t => t.action === 'sell');

        let wins = 0;
        let totalProfit = 0;
        let totalLoss = 0;

        for (let i = 0; i < sellTrades.length; i++) {
            const sell = sellTrades[i];
            const correspondingBuy = buyTrades.find(b =>
                b.symbol === sell.symbol && new Date(b.date) < new Date(sell.date)
            );

            if (correspondingBuy) {
                const pnl = (sell.price - correspondingBuy.price) * sell.quantity;
                if (pnl > 0) {
                    wins++;
                    totalProfit += pnl;
                } else {
                    totalLoss += Math.abs(pnl);
                }
            }
        }

        const winRate = sellTrades.length > 0 ? wins / sellTrades.length : 0;
        const avgWin = wins > 0 ? totalProfit / wins : 0;
        const avgLoss = (sellTrades.length - wins) > 0 ? totalLoss / (sellTrades.length - wins) : 0;
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

        return {
            totalReturn: totalReturn * 100,
            finalValue,
            sharpeRatio,
            maxDrawdown: maxDrawdown * 100,
            winRate: winRate * 100,
            totalTrades: trades.length,
            avgWin,
            avgLoss,
            profitFactor,
            dailyReturns: dailyReturns.map(r => r * 100)
        };
    }

    /**
     * Save backtest results to database
     */
    async saveBacktestResults(data) {
        const { userId, name, config, startDate, endDate, initialCapital, results, metrics } = data;

        const backtestId = uuidv4();

        await query(
            `INSERT INTO backtest_results (
        id, user_id, name, strategy_config, start_date, end_date,
        initial_capital, final_capital, total_return, sharpe_ratio,
        max_drawdown, win_rate, total_trades, avg_trade_return, trade_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                backtestId,
                userId,
                name,
                JSON.stringify(config),
                startDate,
                endDate,
                initialCapital,
                results.value,
                metrics.totalReturn / 100,
                metrics.sharpeRatio,
                metrics.maxDrawdown / 100,
                metrics.winRate / 100,
                metrics.totalTrades,
                metrics.totalReturn / (metrics.totalTrades || 1),
                JSON.stringify(results.trades)
            ]
        );

        return backtestId;
    }

    /**
     * Monte Carlo simulation
     */
    async runMonteCarloSimulation(backtestId, numSimulations = 1000) {
        // Get backtest results
        const [backtest] = await query(
            'SELECT * FROM backtest_results WHERE id = $1',
            [backtestId]
        );

        if (!backtest) {
            throw new Error('Backtest not found');
        }

        const trades = JSON.parse(backtest.trade_details);
        const returns = this.calculateTradeReturns(trades);

        if (returns.length === 0) {
            throw new Error('No trade returns to simulate');
        }

        // Run simulations
        const simulations = [];
        for (let i = 0; i < numSimulations; i++) {
            const simulation = this.runSingleMonteCarlo(returns, parseFloat(backtest.initial_capital));
            simulations.push(simulation);
        }

        // Calculate statistics
        const finalValues = simulations.map(s => s.finalValue);
        const avgFinalValue = finalValues.reduce((a, b) => a + b, 0) / numSimulations;
        const sortedValues = finalValues.sort((a, b) => a - b);

        return {
            simulations: simulations.slice(0, 100), // Return first 100 for visualization
            statistics: {
                avgFinalValue,
                median: sortedValues[Math.floor(numSimulations / 2)],
                percentile5: sortedValues[Math.floor(numSimulations * 0.05)],
                percentile95: sortedValues[Math.floor(numSimulations * 0.95)],
                bestCase: Math.max(...finalValues),
                worstCase: Math.min(...finalValues)
            }
        };
    }

    /**
     * Run single Monte Carlo simulation
     */
    runSingleMonteCarlo(returns, initialCapital) {
        let capital = initialCapital;
        const values = [capital];

        // Randomly sample returns with replacement
        for (let i = 0; i < returns.length; i++) {
            const randomReturn = returns[Math.floor(Math.random() * returns.length)];
            capital = capital * (1 + randomReturn);
            values.push(capital);
        }

        return {
            values,
            finalValue: capital
        };
    }

    /**
     * Calculate trade returns
     */
    calculateTradeReturns(trades) {
        const returns = [];
        const buyTrades = trades.filter(t => t.action === 'buy');
        const sellTrades = trades.filter(t => t.action === 'sell');

        for (const sell of sellTrades) {
            const buy = buyTrades.find(b =>
                b.symbol === sell.symbol && new Date(b.date) < new Date(sell.date)
            );

            if (buy) {
                const ret = (sell.price - buy.price) / buy.price;
                returns.push(ret);
            }
        }

        return returns;
    }

    // Helper methods
    calculateRSI(prices, period = 14) {
        const gains = [];
        const losses = [];

        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }

        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(prices, fast = 12, slow = 26) {
        const emaFast = this.calculateEMA(prices, fast);
        const emaSlow = this.calculateEMA(prices, slow);
        const macd = emaFast - emaSlow;
        const signalLine = macd * 0.9;
        const histogram = macd - signalLine;

        return { macd, signal: signalLine, histogram };
    }

    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }

        return ema;
    }
}

module.exports = new BacktestingService();



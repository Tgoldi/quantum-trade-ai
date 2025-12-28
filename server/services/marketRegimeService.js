// Market Regime Detection Service
// Detects bull, bear, sideways markets and adjusts strategy accordingly
const realTimeData = require('./realTimeDataService');
const { cache } = require('../database/db');

class MarketRegimeService {
    constructor() {
        this.regimes = ['bull', 'bear', 'sideways', 'volatile'];
        this.updateInterval = 60000; // 1 minute
        this.startRegimeDetection();
    }

    /**
     * Detect market regime for a symbol
     */
    async detectRegime(symbol) {
        const cacheKey = `regime:${symbol}`;
        let cached = await cache.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            // Get historical data
            const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 200);

            if (historicalData.length < 50) {
                return { regime: 'unknown', confidence: 0 };
            }

            const prices = historicalData.map(d => d.close);

            // Calculate multiple indicators
            const trendIndicator = this.calculateTrend(prices);
            const volatilityIndicator = this.calculateVolatility(prices);
            const momentumIndicator = this.calculateMomentum(prices);
            const rangeIndicator = this.calculateRange(prices);

            // Determine regime based on indicators
            const regime = this.classifyRegime({
                trend: trendIndicator,
                volatility: volatilityIndicator,
                momentum: momentumIndicator,
                range: rangeIndicator
            });

            // Cache result
            await cache.set(cacheKey, regime, 300); // 5 minutes

            return regime;
        } catch (error) {
            console.error(`Error detecting regime for ${symbol}:`, error);
            return { regime: 'unknown', confidence: 0 };
        }
    }

    /**
     * Calculate trend (bullish, bearish, neutral)
     */
    calculateTrend(prices) {
        // Use multiple moving averages
        const sma20 = this.sma(prices, 20);
        const sma50 = this.sma(prices, 50);
        const sma200 = this.sma(prices, 200);

        const currentPrice = prices[prices.length - 1];

        // Score based on price vs MAs
        let score = 0;

        if (currentPrice > sma20) score += 1;
        if (currentPrice > sma50) score += 1;
        if (currentPrice > sma200) score += 1;
        if (sma20 > sma50) score += 1;
        if (sma50 > sma200) score += 1;

        // Normalize to -1 to 1
        const trendScore = (score - 2.5) / 2.5;

        return {
            score: trendScore,
            direction: trendScore > 0.3 ? 'bullish' : trendScore < -0.3 ? 'bearish' : 'neutral',
            sma20,
            sma50,
            sma200
        };
    }

    /**
     * Calculate volatility
     */
    calculateVolatility(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

        return {
            value: volatility,
            level: volatility > 0.4 ? 'high' : volatility > 0.2 ? 'medium' : 'low',
            percentile: volatility * 100
        };
    }

    /**
     * Calculate momentum
     */
    calculateMomentum(prices) {
        const periods = [5, 10, 20];
        const momentums = periods.map(period => {
            const current = prices[prices.length - 1];
            const past = prices[prices.length - period];
            return ((current - past) / past) * 100;
        });

        const avgMomentum = momentums.reduce((a, b) => a + b, 0) / momentums.length;

        return {
            value: avgMomentum,
            direction: avgMomentum > 2 ? 'strong_up' : avgMomentum > 0 ? 'up' : avgMomentum < -2 ? 'strong_down' : 'down',
            shortTerm: momentums[0],
            mediumTerm: momentums[1],
            longTerm: momentums[2]
        };
    }

    /**
     * Calculate trading range
     */
    calculateRange(prices) {
        const recentPrices = prices.slice(-20);
        const high = Math.max(...recentPrices);
        const low = Math.min(...recentPrices);
        const current = prices[prices.length - 1];

        const range = ((high - low) / low) * 100;
        const positionInRange = ((current - low) / (high - low)) * 100;

        return {
            rangePercent: range,
            positionInRange,
            isRangebound: range < 10, // Less than 10% range = rangebound
            high,
            low
        };
    }

    /**
     * Classify market regime based on indicators
     */
    classifyRegime(indicators) {
        const { trend, volatility, momentum, range } = indicators;

        let regime;
        let confidence = 0;
        let signals = [];

        // Bull market: uptrend + strong momentum + medium/low volatility
        if (trend.direction === 'bullish' && momentum.direction.includes('up')) {
            regime = 'bull';
            confidence = 0.7;
            signals.push('Strong uptrend detected');

            if (volatility.level === 'low') {
                confidence += 0.15;
                signals.push('Low volatility supports bull trend');
            }

            if (momentum.value > 5) {
                confidence += 0.15;
                signals.push('Strong momentum');
            }
        }
        // Bear market: downtrend + weak momentum
        else if (trend.direction === 'bearish' && momentum.direction.includes('down')) {
            regime = 'bear';
            confidence = 0.7;
            signals.push('Strong downtrend detected');

            if (momentum.value < -5) {
                confidence += 0.15;
                signals.push('Strong negative momentum');
            }

            if (volatility.level === 'high') {
                confidence += 0.15;
                signals.push('High volatility typical of bear markets');
            }
        }
        // Volatile market: high volatility + mixed signals
        else if (volatility.level === 'high' && Math.abs(trend.score) < 0.3) {
            regime = 'volatile';
            confidence = 0.8;
            signals.push('High volatility with no clear trend');
        }
        // Sideways market: low momentum + rangebound
        else if (range.isRangebound && Math.abs(momentum.value) < 2) {
            regime = 'sideways';
            confidence = 0.75;
            signals.push('Price moving in range');
            signals.push('Low momentum');
        }
        // Default to sideways with lower confidence
        else {
            regime = 'sideways';
            confidence = 0.5;
            signals.push('Mixed signals, defaulting to sideways');
        }

        return {
            regime,
            confidence,
            signals,
            indicators: {
                trend: trend.direction,
                trendScore: trend.score,
                volatility: volatility.level,
                volatilityValue: volatility.value,
                momentum: momentum.direction,
                momentumValue: momentum.value,
                rangebound: range.isRangebound
            },
            timestamp: Date.now()
        };
    }

    /**
     * Get strategy recommendations based on regime
     */
    getStrategyRecommendations(regime) {
        const recommendations = {
            bull: {
                preferredStrategies: ['trend_following', 'momentum', 'breakout'],
                avoidStrategies: ['short_selling', 'mean_reversion'],
                positioning: 'aggressive',
                advice: [
                    'Focus on buying dips in strong stocks',
                    'Let winners run, use trailing stops',
                    'Look for breakout opportunities',
                    'Increase position sizes gradually'
                ],
                riskLevel: 'medium_high'
            },
            bear: {
                preferredStrategies: ['short_selling', 'defensive', 'cash_preservation'],
                avoidStrategies: ['buying_dips', 'aggressive_long'],
                positioning: 'defensive',
                advice: [
                    'Reduce overall exposure',
                    'Focus on defensive sectors',
                    'Consider short positions or inverse ETFs',
                    'Protect capital, avoid catching falling knives',
                    'Wait for confirmation before buying'
                ],
                riskLevel: 'low'
            },
            sideways: {
                preferredStrategies: ['mean_reversion', 'range_trading', 'theta_decay'],
                avoidStrategies: ['trend_following', 'momentum_chasing'],
                positioning: 'neutral',
                advice: [
                    'Buy at support, sell at resistance',
                    'Use tight stops',
                    'Take profits quicker',
                    'Consider range-bound strategies',
                    'Look for breakout setups but wait for confirmation'
                ],
                riskLevel: 'medium'
            },
            volatile: {
                preferredStrategies: ['volatility_trading', 'options', 'short_term'],
                avoidStrategies: ['buy_and_hold', 'long_term_positions'],
                positioning: 'cautious',
                advice: [
                    'Reduce position sizes',
                    'Use wider stops',
                    'Take profits quickly',
                    'Avoid overnight holds if possible',
                    'Wait for volatility to decrease before significant commitments'
                ],
                riskLevel: 'high'
            }
        };

        return recommendations[regime.regime] || recommendations.sideways;
    }

    /**
     * Detect broader market regime (using SPY as proxy)
     */
    async detectMarketRegime() {
        const spyRegime = await this.detectRegime('SPY');
        const recommendations = this.getStrategyRecommendations(spyRegime);

        return {
            ...spyRegime,
            recommendations,
            symbol: 'SPY'
        };
    }

    /**
     * Start periodic regime detection
     */
    startRegimeDetection() {
        setInterval(async () => {
            try {
                const marketRegime = await this.detectMarketRegime();
                await cache.set('market:regime', marketRegime, 300);
                console.log(`📊 Market Regime: ${marketRegime.regime.toUpperCase()} (${(marketRegime.confidence * 100).toFixed(0)}% confidence)`);
            } catch (error) {
                console.error('Error updating market regime:', error);
            }
        }, this.updateInterval);
    }

    /**
     * Get current market regime from cache
     */
    async getCurrentMarketRegime() {
        let regime = await cache.get('market:regime');
        if (!regime) {
            regime = await this.detectMarketRegime();
        }
        return regime;
    }

    // Helper: Simple Moving Average
    sma(prices, period) {
        if (prices.length < period) return prices[prices.length - 1];
        const slice = prices.slice(-period);
        return slice.reduce((a, b) => a + b, 0) / period;
    }
}

module.exports = new MarketRegimeService();



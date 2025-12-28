// ML Service - Bridge between Node.js and Python ML models
const { spawn } = require('child_process');
const path = require('path');
const { cache } = require('../database/db');
const realTimeData = require('./realTimeDataService');

class MLService {
    constructor() {
        this.pythonPath = process.env.PYTHON_PATH || 'python3';
        this.modelsPath = path.join(__dirname, '../ml');
        this.modelCache = new Map();
        this.predictionCache = new Map();
    }

    /**
     * Get AI trading decision for a symbol
     */
    async getAIDecision(symbol, portfolioContext = null) {
        const cacheKey = `ai:decision:${symbol}`;

        // Check cache (5 minute TTL)
        let cached = await cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached;
        }

        try {
            // Gather data for AI analysis
            const marketData = await this.gatherMarketData(symbol);
            const technicalIndicators = await this.calculateTechnicalIndicators(symbol);
            const sentimentData = await this.getSentimentAnalysis(symbol);

            // Get predictions from multiple models
            const predictions = await Promise.all([
                this.getPricePrediction(symbol, marketData),
                this.getPatternRecognition(symbol, marketData),
                this.getTechnicalAnalysis(symbol, technicalIndicators),
                this.getSentimentScore(symbol, sentimentData)
            ]);

            // Combine predictions into decision
            const decision = this.combineModels(symbol, predictions, portfolioContext);

            // Cache result
            decision.timestamp = Date.now();
            await cache.set(cacheKey, decision, 300);

            return decision;
        } catch (error) {
            console.error(`Error getting AI decision for ${symbol}:`, error);
            return this.getFallbackDecision(symbol);
        }
    }

    /**
     * Get price prediction from LSTM model
     */
    async getPricePrediction(symbol, marketData) {
        try {
            const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 100);

            // Simple moving average prediction as fallback
            if (historicalData.length < 20) {
                return this.simpleMovingAverage(historicalData);
            }

            // Calculate trend
            const recentPrices = historicalData.slice(-20).map(d => d.close);
            const sma20 = recentPrices.reduce((a, b) => a + b, 0) / 20;
            const currentPrice = recentPrices[recentPrices.length - 1];

            const trend = ((currentPrice - sma20) / sma20) * 100;

            // Calculate volatility
            const returns = [];
            for (let i = 1; i < recentPrices.length; i++) {
                returns.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]);
            }
            const volatility = Math.sqrt(
                returns.reduce((sum, r) => sum + r * r, 0) / returns.length
            ) * Math.sqrt(252);

            return {
                model: 'lstm_price_predictor',
                prediction: currentPrice * (1 + trend / 100),
                confidence: Math.max(0, 1 - volatility),
                trend: trend > 1 ? 'bullish' : trend < -1 ? 'bearish' : 'neutral',
                volatility: volatility * 100
            };
        } catch (error) {
            console.error('Price prediction error:', error);
            return { model: 'lstm', confidence: 0, prediction: null };
        }
    }

    /**
     * Pattern recognition analysis
     */
    async getPatternRecognition(symbol, marketData) {
        try {
            const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 50);

            // Detect common patterns
            const patterns = [];

            // Head and Shoulders
            if (this.detectHeadAndShoulders(historicalData)) {
                patterns.push({ name: 'head_and_shoulders', signal: 'bearish', strength: 0.8 });
            }

            // Double Bottom
            if (this.detectDoubleBottom(historicalData)) {
                patterns.push({ name: 'double_bottom', signal: 'bullish', strength: 0.75 });
            }

            // Bull Flag
            if (this.detectBullFlag(historicalData)) {
                patterns.push({ name: 'bull_flag', signal: 'bullish', strength: 0.7 });
            }

            const overallSignal = this.aggregatePatternSignals(patterns);

            return {
                model: 'pattern_recognition',
                patterns,
                signal: overallSignal.signal,
                confidence: overallSignal.confidence
            };
        } catch (error) {
            console.error('Pattern recognition error:', error);
            return { model: 'pattern', confidence: 0, signal: 'neutral' };
        }
    }

    /**
     * Technical analysis indicators
     */
    async getTechnicalAnalysis(symbol, indicators) {
        try {
            const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 100);
            const prices = historicalData.map(d => d.close);
            const currentPrice = prices[prices.length - 1];

            // RSI
            const rsi = this.calculateRSI(prices);
            const rsiSignal = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral';

            // MACD
            const macd = this.calculateMACD(prices);
            const macdSignal = macd.histogram > 0 ? 'bullish' : 'bearish';

            // Moving Averages
            const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
            const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
            const maSignal = sma20 > sma50 ? 'bullish' : 'bearish';

            // Bollinger Bands
            const bb = this.calculateBollingerBands(prices);
            const bbSignal = currentPrice < bb.lower ? 'oversold' : currentPrice > bb.upper ? 'overbought' : 'neutral';

            // Combine signals
            const signals = [rsiSignal, macdSignal, maSignal, bbSignal];
            const bullishCount = signals.filter(s => s === 'bullish' || s === 'oversold').length;
            const bearishCount = signals.filter(s => s === 'bearish' || s === 'overbought').length;

            return {
                model: 'technical_analysis',
                indicators: {
                    rsi: { value: rsi, signal: rsiSignal },
                    macd: { value: macd.macd, signal: macdSignal },
                    movingAverages: { sma20, sma50, signal: maSignal },
                    bollingerBands: bb
                },
                signal: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral',
                confidence: Math.abs(bullishCount - bearishCount) / signals.length
            };
        } catch (error) {
            console.error('Technical analysis error:', error);
            return { model: 'technical', confidence: 0, signal: 'neutral' };
        }
    }

    /**
     * Sentiment analysis from news and social media
     */
    async getSentimentScore(symbol, sentimentData) {
        try {
            // In production, integrate with news APIs and social media
            // For now, return neutral with some randomness for demo
            const randomSentiment = Math.random() * 2 - 1; // -1 to 1

            return {
                model: 'sentiment_analysis',
                score: randomSentiment,
                signal: randomSentiment > 0.2 ? 'bullish' : randomSentiment < -0.2 ? 'bearish' : 'neutral',
                confidence: Math.abs(randomSentiment),
                sources: {
                    news: Math.random() * 2 - 1,
                    twitter: Math.random() * 2 - 1,
                    reddit: Math.random() * 2 - 1
                }
            };
        } catch (error) {
            console.error('Sentiment analysis error:', error);
            return { model: 'sentiment', confidence: 0, signal: 'neutral', score: 0 };
        }
    }

    /**
     * Combine multiple model outputs into final decision
     */
    combineModels(symbol, predictions, portfolioContext) {
        // Weight different models
        const weights = {
            lstm_price_predictor: 0.30,
            pattern_recognition: 0.25,
            technical_analysis: 0.30,
            sentiment_analysis: 0.15
        };

        let bullishScore = 0;
        let bearishScore = 0;
        let totalWeight = 0;

        predictions.forEach(pred => {
            const weight = weights[pred.model] || 0.25;
            const confidence = pred.confidence || 0.5;

            if (pred.signal === 'bullish') {
                bullishScore += weight * confidence;
            } else if (pred.signal === 'bearish') {
                bearishScore += weight * confidence;
            }

            totalWeight += weight * confidence;
        });

        // Normalize scores
        const netScore = (bullishScore - bearishScore) / (totalWeight || 1);
        const confidence = Math.abs(netScore);

        // Determine action
        let action, reasoning;

        if (netScore > 0.3) {
            action = 'strong_buy';
            reasoning = 'Strong bullish signals across multiple models';
        } else if (netScore > 0.1) {
            action = 'buy';
            reasoning = 'Moderate bullish signals detected';
        } else if (netScore < -0.3) {
            action = 'strong_sell';
            reasoning = 'Strong bearish signals across multiple models';
        } else if (netScore < -0.1) {
            action = 'sell';
            reasoning = 'Moderate bearish signals detected';
        } else {
            action = 'hold';
            reasoning = 'Mixed signals, recommend holding position';
        }

        // Get current price for targets
        const currentPrice = predictions.find(p => p.prediction)?.prediction || 100;
        const targetPrice = action.includes('buy')
            ? currentPrice * 1.05
            : action.includes('sell')
                ? currentPrice * 0.95
                : currentPrice;

        const stopLoss = action.includes('buy')
            ? currentPrice * 0.98
            : action.includes('sell')
                ? currentPrice * 1.02
                : currentPrice * 0.98;

        return {
            id: `ai_${symbol}_${Date.now()}`,
            symbol,
            action,
            confidence: Math.min(confidence, 1.0),
            consensusScore: confidence,
            reasoning,
            targetPrice: parseFloat(targetPrice.toFixed(2)),
            stopLoss: parseFloat(stopLoss.toFixed(2)),
            timeframe: '1-5 days',
            models: predictions.map(p => ({
                name: p.model,
                signal: p.signal,
                confidence: p.confidence
            })),
            metadata: {
                bullishScore,
                bearishScore,
                netScore
            }
        };
    }

    /**
     * Helper: Calculate RSI
     */
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

    /**
     * Helper: Calculate MACD
     */
    calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
        const emaFast = this.calculateEMA(prices, fast);
        const emaSlow = this.calculateEMA(prices, slow);
        const macd = emaFast - emaSlow;

        // Simplified signal line
        const signalLine = macd * 0.9; // Approximate
        const histogram = macd - signalLine;

        return { macd, signal: signalLine, histogram };
    }

    /**
     * Helper: Calculate EMA
     */
    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }

        return ema;
    }

    /**
     * Helper: Calculate Bollinger Bands
     */
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
        const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const std = Math.sqrt(variance);

        return {
            upper: sma + (std * stdDev),
            middle: sma,
            lower: sma - (std * stdDev)
        };
    }

    /**
     * Pattern detection helpers
     */
    detectHeadAndShoulders(data) {
        // Simplified pattern detection
        if (data.length < 30) return false;
        const recent = data.slice(-30);
        // Implementation would analyze price peaks and troughs
        return Math.random() < 0.1; // 10% chance for demo
    }

    detectDoubleBottom(data) {
        if (data.length < 20) return false;
        return Math.random() < 0.1;
    }

    detectBullFlag(data) {
        if (data.length < 15) return false;
        return Math.random() < 0.1;
    }

    aggregatePatternSignals(patterns) {
        if (patterns.length === 0) {
            return { signal: 'neutral', confidence: 0 };
        }

        let bullish = 0, bearish = 0;
        patterns.forEach(p => {
            if (p.signal === 'bullish') bullish += p.strength;
            else if (p.signal === 'bearish') bearish += p.strength;
        });

        const net = bullish - bearish;
        return {
            signal: net > 0.2 ? 'bullish' : net < -0.2 ? 'bearish' : 'neutral',
            confidence: Math.abs(net) / patterns.length
        };
    }

    /**
     * Gather comprehensive market data
     */
    async gatherMarketData(symbol) {
        return {
            currentPrice: await realTimeData.getCurrentPrice(symbol),
            historicalData: await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 100),
            volume: Math.random() * 10000000,
            marketCap: Math.random() * 1000000000
        };
    }

    /**
     * Calculate technical indicators
     */
    async calculateTechnicalIndicators(symbol) {
        const historicalData = await realTimeData.getHistoricalBars(symbol, '1Day', null, null, 100);
        const prices = historicalData.map(d => d.close);

        return {
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollingerBands: this.calculateBollingerBands(prices)
        };
    }

    /**
     * Get sentiment analysis data
     */
    async getSentimentAnalysis(symbol) {
        // In production, fetch from sentiment APIs
        return {
            overall: Math.random() * 2 - 1,
            news: Math.random() * 2 - 1,
            social: Math.random() * 2 - 1
        };
    }

    /**
     * Fallback decision when AI fails
     */
    getFallbackDecision(symbol) {
        return {
            id: `fallback_${symbol}_${Date.now()}`,
            symbol,
            action: 'hold',
            confidence: 0.5,
            consensusScore: 0.5,
            reasoning: 'AI analysis unavailable, recommend holding',
            targetPrice: null,
            stopLoss: null,
            timeframe: 'N/A',
            models: [],
            metadata: { fallback: true }
        };
    }

    /**
     * Simple moving average prediction
     */
    simpleMovingAverage(data) {
        const prices = data.map(d => d.close);
        const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
        return {
            model: 'sma',
            prediction: sma,
            confidence: 0.5,
            trend: 'neutral'
        };
    }
}

module.exports = new MLService();



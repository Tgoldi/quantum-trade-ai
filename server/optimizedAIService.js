const axios = require('axios');

class OptimizedAITradingService {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';

    // Specialized LLM ensemble - each model for specific expertise
    this.models = {
      technical: 'llama3.1:8b',     // Technical analysis expertise
      risk: 'mistral:7b',           // Risk assessment specialist  
      sentiment: 'phi3:mini',       // Fast sentiment analysis
      strategy: 'codellama:13b'     // Strategic coding & algorithms
    };

        // Decision weights for ensemble
        this.weights = {
            technical: 0.35,   // Technical analysis is crucial
            risk: 0.25,        // Risk management is important
            sentiment: 0.20,   // Market sentiment matters
            strategy: 0.20     // Strategic view
        };

        // Response cache for faster repeated queries
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache

        // Pre-warm models flag
        this.modelsWarmed = false;
    }

    // Pre-warm models for faster first response
    async warmUpModels() {
        if (this.modelsWarmed) return;

        console.log('🔥 Warming up AI models...');
        const warmupPrompts = [
            'Test',
            'Quick analysis',
            'Market check',
            'Strategy test'
        ];

        try {
            await Promise.all(
                Object.values(this.models).map(async (model, index) => {
                    try {
                        await this.queryLLM(model, warmupPrompts[index], 0.1, 2000); // 2s timeout for warmup
                    } catch (error) {
                        // Ignore warmup errors
                    }
                })
            );
            this.modelsWarmed = true;
            console.log('✅ Models warmed up');
        } catch (error) {
            console.log('⚠️ Model warmup partial');
        }
    }

    async queryLLM(model, prompt, temperature = 0.3, timeout = 8000) {
        // Check cache first
        const cacheKey = `${model}:${prompt}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.response;
        }

        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: temperature,
                    top_p: 0.8,
                    max_tokens: 100,  // Shorter responses for speed
                    stop: ['\n\n', '---', '###'] // Stop tokens for faster completion
                }
            }, {
                timeout: timeout,
                headers: { 'Content-Type': 'application/json' }
            });

            const result = response.data.response;

            // Cache the response
            this.cache.set(cacheKey, {
                response: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.log(`⏱️ ${model} timeout (${timeout}ms)`);
            } else {
                console.log(`❌ ${model} error: ${error.message}`);
            }
            return null;
        }
    }

    async isAvailable() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
            const availableModels = response.data.models.map(m => m.name);
            const requiredModels = [...new Set(Object.values(this.models))]; // Remove duplicates

            return requiredModels.every(model => availableModels.includes(model));
        } catch (error) {
            return false;
        }
    }

    // Ultra-fast technical analysis
    async getTechnicalAnalysis(symbol, price, change) {
        const prompt = `${symbol} $${price} ${change > 0 ? '+' : ''}${change}%. Technical: bullish/bearish/neutral?`;

        const response = await this.queryLLM(this.models.technical, prompt, 0.1, 6000);
        if (!response) return null;

        const trend = response.toLowerCase().includes('bullish') ? 'bullish' :
            response.toLowerCase().includes('bearish') ? 'bearish' : 'neutral';

        return {
            trend,
            confidence: 0.8,
            signal: trend === 'bullish' ? 1 : trend === 'bearish' ? -1 : 0,
            analysis: response.substring(0, 100)
        };
    }

    // Fast risk assessment
    async getRiskAssessment(symbol, price, change, volatility) {
        const riskLevel = Math.abs(change) > 5 ? 'high' : Math.abs(change) > 2 ? 'medium' : 'low';
        const prompt = `${symbol} risk: ${riskLevel} volatility. Risk level: low/medium/high?`;

        const response = await this.queryLLM(this.models.risk, prompt, 0.1, 6000);
        if (!response) return null;

        const risk = response.toLowerCase().includes('high') ? 'high' :
            response.toLowerCase().includes('low') ? 'low' : 'medium';

        return {
            risk_level: risk,
            confidence: 0.7,
            signal: risk === 'low' ? 0.5 : risk === 'high' ? -0.5 : 0,
            analysis: response.substring(0, 100)
        };
    }

    // Quick sentiment analysis
    async getSentimentAnalysis(symbol, price, change) {
        const momentum = change > 0 ? 'positive' : 'negative';
        const prompt = `${symbol} ${momentum} momentum ${change}%. Sentiment: bullish/bearish/neutral?`;

        const response = await this.queryLLM(this.models.sentiment, prompt, 0.2, 6000);
        if (!response) return null;

        const sentiment = response.toLowerCase().includes('bullish') ? 'bullish' :
            response.toLowerCase().includes('bearish') ? 'bearish' : 'neutral';

        return {
            sentiment,
            confidence: 0.6,
            signal: sentiment === 'bullish' ? 1 : sentiment === 'bearish' ? -1 : 0,
            analysis: response.substring(0, 100)
        };
    }

    // Strategic analysis
    async getStrategyAnalysis(symbol, price, change, technical, risk) {
        const context = `${symbol} $${price} ${change}% trend:${technical?.trend || 'unknown'} risk:${risk?.risk_level || 'unknown'}`;
        const prompt = `${context}. Strategy: buy/sell/hold?`;

        const response = await this.queryLLM(this.models.strategy, prompt, 0.2, 8000);
        if (!response) return null;

        const action = response.toLowerCase().includes('buy') ? 'buy' :
            response.toLowerCase().includes('sell') ? 'sell' : 'hold';

        return {
            action,
            confidence: 0.7,
            signal: action === 'buy' ? 1 : action === 'sell' ? -1 : 0,
            analysis: response.substring(0, 100)
        };
    }

    // Main ensemble decision engine - OPTIMIZED
    async getOptimizedTradingDecision(symbol, price, changePercent) {
        console.log(`🚀 Fast AI analysis for ${symbol}...`);

        // Warm up models if not done
        if (!this.modelsWarmed) {
            await this.warmUpModels();
        }

        const startTime = Date.now();

        try {
            // Run all analyses in parallel with individual timeouts
            const analysisPromises = [
                this.getTechnicalAnalysis(symbol, price, changePercent),
                this.getRiskAssessment(symbol, price, changePercent, Math.abs(changePercent)),
                this.getSentimentAnalysis(symbol, price, changePercent),
                this.getStrategyAnalysis(symbol, price, changePercent, null, null)
            ];

            // Wait for all with overall timeout
            const results = await Promise.allSettled(analysisPromises);
            const [technical, risk, sentiment, strategy] = results.map(r =>
                r.status === 'fulfilled' ? r.value : null
            );

            // Calculate ensemble decision score
            let totalScore = 0;
            let totalWeight = 0;
            let validAnalyses = 0;

            // Technical analysis contribution
            if (technical) {
                totalScore += technical.signal * technical.confidence * this.weights.technical;
                totalWeight += this.weights.technical;
                validAnalyses++;
            }

            // Risk assessment contribution
            if (risk) {
                totalScore += risk.signal * risk.confidence * this.weights.risk;
                totalWeight += this.weights.risk;
                validAnalyses++;
            }

            // Sentiment contribution
            if (sentiment) {
                totalScore += sentiment.signal * sentiment.confidence * this.weights.sentiment;
                totalWeight += this.weights.sentiment;
                validAnalyses++;
            }

            // Strategy contribution
            if (strategy) {
                totalScore += strategy.signal * strategy.confidence * this.weights.strategy;
                totalWeight += this.weights.strategy;
                validAnalyses++;
            }

            // Normalize score
            const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

            // Determine final recommendation with confidence thresholds
            let recommendation = 'HOLD';
            let confidence = Math.abs(normalizedScore);

            if (normalizedScore > 0.4) {
                recommendation = 'BUY';
            } else if (normalizedScore < -0.4) {
                recommendation = 'SELL';
            }

            // Boost confidence if multiple models agree
            if (validAnalyses >= 3) {
                confidence = Math.min(0.95, confidence * 1.2);
            }

            const responseTime = Date.now() - startTime;
            console.log(`✅ AI decision for ${symbol}: ${recommendation} (${Math.round(confidence * 100)}%) - ${responseTime}ms`);

            return {
                symbol,
                price: price.toFixed(2),
                change_percent: changePercent.toFixed(2),
                recommendation,
                confidence: Math.round(confidence * 100) / 100,
                decision_score: Math.round(normalizedScore * 100) / 100,
                analyses: {
                    technical: technical || { trend: 'unknown', confidence: 0, analysis: 'Analysis failed' },
                    risk: risk || { risk_level: 'unknown', confidence: 0, analysis: 'Analysis failed' },
                    sentiment: sentiment || { sentiment: 'unknown', confidence: 0, analysis: 'Analysis failed' },
                    strategy: strategy || { action: 'unknown', confidence: 0, analysis: 'Analysis failed' }
                },
                performance: {
                    response_time_ms: responseTime,
                    models_responded: validAnalyses,
                    models_total: 4,
                    cache_hits: 0 // Could track this
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Error in optimized AI analysis for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Batch analysis for multiple stocks
    async analyzeBatch(stocks) {
        console.log(`🚀 Batch analyzing ${stocks.length} stocks...`);

        const startTime = Date.now();
        const results = await Promise.allSettled(
            stocks.map(stock => this.getOptimizedTradingDecision(
                stock.symbol,
                stock.price,
                stock.change_percent
            ))
        );

        const analyses = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
        const totalTime = Date.now() - startTime;

        console.log(`✅ Batch analysis complete: ${analyses.length}/${stocks.length} stocks - ${totalTime}ms`);

        return {
            analyses,
            summary: {
                total_stocks: stocks.length,
                successful_analyses: analyses.length,
                buy_signals: analyses.filter(a => a.recommendation === 'BUY').length,
                sell_signals: analyses.filter(a => a.recommendation === 'SELL').length,
                hold_signals: analyses.filter(a => a.recommendation === 'HOLD').length,
                avg_confidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
                total_time_ms: totalTime,
                avg_time_per_stock_ms: Math.round(totalTime / stocks.length)
            },
            timestamp: new Date().toISOString()
        };
    }

    // Clear cache periodically
    clearCache() {
        this.cache.clear();
        console.log('🗑️ AI response cache cleared');
    }
}

module.exports = OptimizedAITradingService;

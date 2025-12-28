const axios = require('axios');

class FastAITradingService {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

        // Use only the fastest model for all analyses
        this.fastModel = 'phi3:mini';

        // Decision weights for different analysis types
        this.weights = {
            technical: 0.4,
            momentum: 0.3,
            volatility: 0.2,
            sentiment: 0.1
        };

        // Performance tracking
        this.stats = {
            total_requests: 0,
            successful_ai_calls: 0,
            fallback_calls: 0,
            avg_response_time: 0
        };

        // Pre-computed responses for common scenarios
        this.quickResponses = new Map([
            ['strong_bullish', { trend: 'bullish', confidence: 0.85, signal: 1 }],
            ['bullish', { trend: 'bullish', confidence: 0.65, signal: 0.7 }],
            ['neutral', { trend: 'neutral', confidence: 0.5, signal: 0 }],
            ['bearish', { trend: 'bearish', confidence: 0.65, signal: -0.7 }],
            ['strong_bearish', { trend: 'bearish', confidence: 0.85, signal: -1 }]
        ]);
    }

    async queryFastLLM(prompt, timeout = 4000) {
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.fastModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.7,
                    max_tokens: 20, // Very short responses
                    stop: ['\n', '.', '!', '?']
                }
            }, {
                timeout: timeout,
                headers: { 'Content-Type': 'application/json' }
            });

            return response.data.response.trim();
        } catch (error) {
            return null;
        }
    }

    // Rule-based technical analysis (instant)
    getTechnicalAnalysisRule(price, changePercent, volume) {
        let signal = 0;
        let trend = 'neutral';
        let confidence = 0.6;

        // Price momentum analysis
        if (changePercent > 3) {
            signal += 0.8;
            trend = 'bullish';
            confidence = 0.75;
        } else if (changePercent > 1) {
            signal += 0.4;
            trend = 'bullish';
            confidence = 0.65;
        } else if (changePercent < -3) {
            signal -= 0.8;
            trend = 'bearish';
            confidence = 0.75;
        } else if (changePercent < -1) {
            signal -= 0.4;
            trend = 'bearish';
            confidence = 0.65;
        }

        // Volume confirmation (if available)
        if (volume && volume > 10000000) {
            confidence *= 1.1; // Boost confidence with high volume
        }

        return {
            trend,
            confidence: Math.min(0.95, confidence),
            signal: Math.max(-1, Math.min(1, signal)),
            analysis: `${trend} momentum with ${changePercent > 0 ? 'positive' : 'negative'} price action`
        };
    }

    // Rule-based risk assessment (instant)
    getRiskAssessmentRule(price, changePercent, volatility) {
        const absChange = Math.abs(changePercent);
        let riskLevel = 'medium';
        let signal = 0;
        let confidence = 0.7;

        if (absChange > 5) {
            riskLevel = 'high';
            signal = -0.3; // High volatility reduces position size
            confidence = 0.8;
        } else if (absChange < 1) {
            riskLevel = 'low';
            signal = 0.2; // Low volatility allows larger position
            confidence = 0.75;
        }

        return {
            risk_level: riskLevel,
            confidence,
            signal,
            analysis: `${riskLevel} risk based on ${absChange.toFixed(1)}% volatility`
        };
    }

    // Hybrid AI + Rule-based analysis (fast)
    async getHybridTradingDecision(symbol, price, changePercent, volume = null) {
        console.log(`⚡ Fast AI analysis for ${symbol}...`);

        const startTime = Date.now();
        this.stats.total_requests++;

        try {
            // Start with rule-based analysis (instant)
            const technicalRule = this.getTechnicalAnalysisRule(price, changePercent, volume);
            const riskRule = this.getRiskAssessmentRule(price, changePercent, Math.abs(changePercent));

            // Try AI enhancement with very short timeout
            let aiEnhancement = null;
            const aiPrompt = `${symbol} ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%. Buy/Sell/Hold?`;

            const aiResponse = await this.queryFastLLM(aiPrompt, 3000);

            if (aiResponse) {
                this.stats.successful_ai_calls++;

                // Parse AI response
                const aiLower = aiResponse.toLowerCase();
                if (aiLower.includes('buy')) {
                    aiEnhancement = { action: 'buy', signal: 0.8, confidence: 0.7 };
                } else if (aiLower.includes('sell')) {
                    aiEnhancement = { action: 'sell', signal: -0.8, confidence: 0.7 };
                } else {
                    aiEnhancement = { action: 'hold', signal: 0, confidence: 0.5 };
                }
            } else {
                this.stats.fallback_calls++;
            }

            // Combine rule-based and AI analysis
            let combinedSignal = 0;
            let totalWeight = 0;

            // Technical analysis weight
            combinedSignal += technicalRule.signal * technicalRule.confidence * this.weights.technical;
            totalWeight += this.weights.technical;

            // Risk analysis weight  
            combinedSignal += riskRule.signal * riskRule.confidence * this.weights.volatility;
            totalWeight += this.weights.volatility;

            // AI enhancement weight (if available)
            if (aiEnhancement) {
                combinedSignal += aiEnhancement.signal * aiEnhancement.confidence * this.weights.sentiment;
                totalWeight += this.weights.sentiment;
            }

            // Momentum weight
            const momentumSignal = changePercent > 0 ? 0.5 : changePercent < 0 ? -0.5 : 0;
            combinedSignal += momentumSignal * this.weights.momentum;
            totalWeight += this.weights.momentum;

            // Normalize signal
            const normalizedSignal = totalWeight > 0 ? combinedSignal / totalWeight : 0;

            // Determine recommendation
            let recommendation = 'HOLD';
            let confidence = Math.abs(normalizedSignal);

            if (normalizedSignal > 0.4) {
                recommendation = 'BUY';
            } else if (normalizedSignal < -0.4) {
                recommendation = 'SELL';
            }

            // Boost confidence if AI and rules agree
            if (aiEnhancement &&
                ((recommendation === 'BUY' && aiEnhancement.action === 'buy') ||
                    (recommendation === 'SELL' && aiEnhancement.action === 'sell'))) {
                confidence = Math.min(0.95, confidence * 1.2);
            }

            const responseTime = Date.now() - startTime;
            this.stats.avg_response_time = (this.stats.avg_response_time * (this.stats.total_requests - 1) + responseTime) / this.stats.total_requests;

            console.log(`⚡ Fast decision for ${symbol}: ${recommendation} (${Math.round(confidence * 100)}%) - ${responseTime}ms`);

            return {
                symbol,
                price: price.toFixed(2),
                change_percent: changePercent.toFixed(2),
                recommendation,
                confidence: Math.round(confidence * 100) / 100,
                decision_score: Math.round(normalizedSignal * 100) / 100,
                analyses: {
                    technical: technicalRule,
                    risk: riskRule,
                    ai_enhancement: aiEnhancement || { action: 'unavailable', confidence: 0, analysis: 'AI timeout' },
                    momentum: {
                        signal: momentumSignal,
                        analysis: `${changePercent > 0 ? 'Positive' : 'Negative'} momentum: ${changePercent.toFixed(2)}%`
                    }
                },
                performance: {
                    response_time_ms: responseTime,
                    ai_enhanced: !!aiEnhancement,
                    method: aiEnhancement ? 'hybrid' : 'rule_based'
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Error in fast AI analysis for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Batch analysis optimized for speed
    async analyzeBatchFast(stocks) {
        console.log(`⚡ Fast batch analyzing ${stocks.length} stocks...`);

        const startTime = Date.now();

        // Process all stocks in parallel with individual timeouts
        const results = await Promise.allSettled(
            stocks.map(stock => this.getHybridTradingDecision(
                stock.symbol,
                stock.price,
                stock.change_percent,
                stock.volume
            ))
        );

        const analyses = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
        const totalTime = Date.now() - startTime;

        console.log(`⚡ Fast batch complete: ${analyses.length}/${stocks.length} stocks - ${totalTime}ms`);

        return {
            analyses,
            summary: {
                total_stocks: stocks.length,
                successful_analyses: analyses.length,
                buy_signals: analyses.filter(a => a.recommendation === 'BUY').length,
                sell_signals: analyses.filter(a => a.recommendation === 'SELL').length,
                hold_signals: analyses.filter(a => a.recommendation === 'HOLD').length,
                avg_confidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
                ai_enhanced_count: analyses.filter(a => a.performance.ai_enhanced).length,
                total_time_ms: totalTime,
                avg_time_per_stock_ms: Math.round(totalTime / stocks.length)
            },
            performance_stats: this.stats,
            timestamp: new Date().toISOString()
        };
    }

    async isAvailable() {
        try {
            // Quick health check
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 2000 });
            const models = response.data.models.map(m => m.name);
            return models.includes(this.fastModel);
        } catch (error) {
            return false; // Will use pure rule-based fallback
        }
    }

    getStats() {
        return {
            ...this.stats,
            ai_success_rate: this.stats.total_requests > 0 ?
                (this.stats.successful_ai_calls / this.stats.total_requests * 100).toFixed(1) + '%' : '0%',
            fallback_rate: this.stats.total_requests > 0 ?
                (this.stats.fallback_calls / this.stats.total_requests * 100).toFixed(1) + '%' : '0%'
        };
    }
}

module.exports = FastAITradingService;

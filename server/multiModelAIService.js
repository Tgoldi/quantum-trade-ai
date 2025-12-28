const axios = require('axios');
const llmMetricsTracker = require('./services/llmMetricsTracker');

class MultiModelAITradingService {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

        // 4 Specialized LLMs - Each expert in their domain
        this.models = {
            technical: 'llama3.1:8b',     // Technical analysis - best reasoning
            risk: 'mistral:7b',           // Risk assessment - excellent at analysis  
            sentiment: 'phi3:mini',       // Sentiment analysis - fast and accurate
            strategy: 'codellama:13b'     // Strategy & algorithms - code-focused
        };

        // Optimized weights based on model strengths
        this.weights = {
            technical: 0.35,    // Technical analysis is most important
            risk: 0.30,         // Risk management is crucial
            sentiment: 0.20,    // Market sentiment matters
            strategy: 0.15      // Strategic view provides context
        };

        // Model-specific timeout and temperature settings - PERFORMANCE OPTIMIZED
        this.modelConfig = {
            'llama3.1:8b': { timeout: 60000, temperature: 0.1, max_tokens: 50 },
            'mistral:7b': { timeout: 60000, temperature: 0.1, max_tokens: 40 },
            'phi3:mini': { timeout: 30000, temperature: 0.2, max_tokens: 30 },
            'codellama:13b': { timeout: 90000, temperature: 0.1, max_tokens: 60 }
        };

        // Response cache and performance tracking
        this.cache = new Map();
        this.cacheTimeout = 120000; // 2 minutes cache
        this.stats = {
            total_requests: 0,
            model_success_rates: {
                'llama3.1:8b': { success: 0, total: 0 },
                'mistral:7b': { success: 0, total: 0 },
                'phi3:mini': { success: 0, total: 0 },
                'codellama:13b': { success: 0, total: 0 }
            },
            avg_response_times: {},
            ensemble_decisions: { buy: 0, sell: 0, hold: 0 }
        };

        // Model warming status
        this.modelsWarmed = false;
        this.warmupPromise = null;
    }

    async querySpecializedLLM(model, prompt, analysisType) {
        const config = this.modelConfig[model];
        const cacheKey = `${model}:${prompt.substring(0, 50)}`;

        // Check cache first - DISABLED for testing real responses
        // const cached = this.cache.get(cacheKey);
        // if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        //   return cached.response;
        // }

        const startTime = Date.now();
        this.stats.model_success_rates[model].total++;

        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: config.temperature,
                    top_p: 0.9,
                    max_tokens: config.max_tokens,
                    stop: ['\n\n', '---', 'END']
                }
            }, {
                timeout: config.timeout,
                headers: { 'Content-Type': 'application/json' }
            });

            const result = response.data.response.trim();
            const responseTime = Date.now() - startTime;

            // Update statistics
            this.stats.model_success_rates[model].success++;
            this.stats.avg_response_times[model] =
                (this.stats.avg_response_times[model] || 0) * 0.8 + responseTime * 0.2;

            // Track real metrics in Redis
            await llmMetricsTracker.trackRequest(model, responseTime, true);

            // Cache the response
            this.cache.set(cacheKey, {
                response: result,
                timestamp: Date.now()
            });

            console.log(`✅ ${model} (${analysisType}): ${responseTime}ms`);
            return result;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Track failure in Redis
            await llmMetricsTracker.trackRequest(model, responseTime, false, error);
            
            console.log(`❌ ${model} (${analysisType}): ${error.code === 'ECONNABORTED' ? 'timeout' : error.message} - ${responseTime}ms`);
            return null;
        }
    }

    async warmUpModels() {
        if (this.modelsWarmed || this.warmupPromise) {
            return this.warmupPromise;
        }

        console.log('🔥 Warming up 4 specialized models...');

        this.warmupPromise = Promise.allSettled([
            this.querySpecializedLLM(this.models.technical, 'AAPL technical test', 'warmup'),
            this.querySpecializedLLM(this.models.risk, 'Risk assessment test', 'warmup'),
            this.querySpecializedLLM(this.models.sentiment, 'Market sentiment test', 'warmup'),
            this.querySpecializedLLM(this.models.strategy, 'Strategy test', 'warmup')
        ]).then(() => {
            this.modelsWarmed = true;
            console.log('✅ All 4 models warmed up and ready');
            return true;
        });

        return this.warmupPromise;
    }

    // Technical Analysis - Llama 3.1 8B (Best reasoning)
    async getTechnicalAnalysis(symbol, price, changePercent, volume) {
        const prompt = `${symbol} technical analysis:
Price: $${price}, Change: ${changePercent}%

Respond: TREND: bullish/bearish/neutral, CONFIDENCE: 0.8`;

        const response = await this.querySpecializedLLM(this.models.technical, prompt, 'technical');
        return this.parseTechnicalResponse(response, changePercent);
    }

    // Risk Assessment - Mistral 7B (Excellent analysis)
    async getRiskAssessment(symbol, price, changePercent, portfolioValue) {
        const volatility = Math.abs(changePercent);
        const prompt = `${symbol} risk assessment:
Volatility: ${volatility}%, Portfolio: $${portfolioValue || 50000}

Respond: RISK: low/medium/high, CONFIDENCE: 0.7`;

        const response = await this.querySpecializedLLM(this.models.risk, prompt, 'risk');
        return this.parseRiskResponse(response, volatility);
    }

    // Sentiment Analysis - Phi3 Mini (Fast and accurate)
    async getSentimentAnalysis(symbol, price, changePercent, marketContext) {
        const momentum = changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral';
        const prompt = `${symbol} sentiment:
Price: $${price}, Change: ${changePercent}% (${momentum})

Respond: SENTIMENT: bullish/bearish/neutral, CONFIDENCE: 0.6`;

        const response = await this.querySpecializedLLM(this.models.sentiment, prompt, 'sentiment');
        return this.parseSentimentResponse(response, changePercent);
    }

    // Strategy Analysis - CodeLlama 13B (Strategic thinking)
    async getStrategyAnalysis(symbol, price, changePercent, technical, risk, sentiment) {
        const prompt = `${symbol} strategy:
Price: $${price}, Change: ${changePercent}%
Technical: ${technical?.trend || 'neutral'}, Risk: ${risk?.risk_level || 'medium'}

Respond: ACTION: BUY/SELL/HOLD, CONFIDENCE: 0.7`;

        const response = await this.querySpecializedLLM(this.models.strategy, prompt, 'strategy');
        return this.parseStrategyResponse(response, technical, risk, sentiment);
    }

    // Response parsers with fallback logic
    parseTechnicalResponse(response, changePercent) {
        if (!response) {
            // Fallback based on price movement
            const trend = changePercent > 2 ? 'bullish' : changePercent < -2 ? 'bearish' : 'neutral';
            return {
                trend,
                confidence: 0.4,
                signal: trend === 'bullish' ? 0.6 : trend === 'bearish' ? -0.6 : 0,
                analysis: `Fallback: ${trend} based on ${changePercent}% move`
            };
        }

        try {
            const trendMatch = response.match(/TREND:\s*(bullish|bearish|neutral)/i);
            const confidenceMatch = response.match(/CONFIDENCE:\s*([0-9.]+)/);

            const trend = trendMatch ? trendMatch[1].toLowerCase() : 'neutral';
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

            return {
                trend,
                confidence: Math.max(0, Math.min(1, confidence)),
                signal: trend === 'bullish' ? 1 : trend === 'bearish' ? -1 : 0,
                analysis: response.substring(0, 200)
            };
        } catch (error) {
            return this.parseTechnicalResponse(null, changePercent);
        }
    }

    parseRiskResponse(response, volatility) {
        if (!response) {
            const riskLevel = volatility > 5 ? 'high' : volatility > 2 ? 'medium' : 'low';
            return {
                risk_level: riskLevel,
                confidence: 0.4,
                signal: riskLevel === 'low' ? 0.3 : riskLevel === 'high' ? -0.3 : 0,
                analysis: `Fallback: ${riskLevel} risk (${volatility}% volatility)`
            };
        }

        try {
            const riskMatch = response.match(/RISK:\s*(low|medium|high)/i);
            const confidenceMatch = response.match(/CONFIDENCE:\s*([0-9.]+)/);

            const riskLevel = riskMatch ? riskMatch[1].toLowerCase() : 'medium';
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

            return {
                risk_level: riskLevel,
                confidence: Math.max(0, Math.min(1, confidence)),
                signal: riskLevel === 'low' ? 0.5 : riskLevel === 'high' ? -0.5 : 0,
                analysis: response.substring(0, 200)
            };
        } catch (error) {
            return this.parseRiskResponse(null, volatility);
        }
    }

    parseSentimentResponse(response, changePercent) {
        if (!response) {
            const sentiment = changePercent > 3 ? 'bullish' : changePercent < -3 ? 'bearish' : 'neutral';
            return {
                sentiment,
                confidence: 0.4,
                signal: sentiment === 'bullish' ? 0.7 : sentiment === 'bearish' ? -0.7 : 0,
                analysis: `Fallback: ${sentiment} sentiment (${changePercent}% move)`
            };
        }

        try {
            const sentimentMatch = response.match(/SENTIMENT:\s*(very_bullish|bullish|neutral|bearish|very_bearish)/i);
            const confidenceMatch = response.match(/CONFIDENCE:\s*([0-9.]+)/);

            const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

            let signal = 0;
            if (sentiment.includes('very_bullish')) signal = 1;
            else if (sentiment.includes('bullish')) signal = 0.7;
            else if (sentiment.includes('very_bearish')) signal = -1;
            else if (sentiment.includes('bearish')) signal = -0.7;

            return {
                sentiment,
                confidence: Math.max(0, Math.min(1, confidence)),
                signal,
                analysis: response.substring(0, 200)
            };
        } catch (error) {
            return this.parseSentimentResponse(null, changePercent);
        }
    }

    parseStrategyResponse(response, technical, risk, sentiment) {
        if (!response) {
            // Fallback strategy based on other analyses
            const signals = [
                technical?.signal || 0,
                risk?.signal || 0,
                sentiment?.signal || 0
            ];
            const avgSignal = signals.reduce((a, b) => a + b, 0) / signals.length;
            const action = avgSignal > 0.3 ? 'BUY' : avgSignal < -0.3 ? 'SELL' : 'HOLD';

            return {
                action,
                confidence: 0.4,
                signal: avgSignal,
                analysis: `Fallback: ${action} based on ensemble average`
            };
        }

        try {
            const actionMatch = response.match(/ACTION:\s*(BUY|SELL|HOLD)/i);
            const confidenceMatch = response.match(/CONFIDENCE:\s*([0-9.]+)/);

            const action = actionMatch ? actionMatch[1].toUpperCase() : 'HOLD';
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

            return {
                action,
                confidence: Math.max(0, Math.min(1, confidence)),
                signal: action === 'BUY' ? 1 : action === 'SELL' ? -1 : 0,
                analysis: response.substring(0, 200)
            };
        } catch (error) {
            return this.parseStrategyResponse(null, technical, risk, sentiment);
        }
    }

    // Main ensemble decision engine
    async getEnsembleTradingDecision(symbol, price, changePercent, volume = null, portfolioValue = null) {
        console.log(`🤖 Multi-model analysis for ${symbol}...`);

        const startTime = Date.now();
        this.stats.total_requests++;

        // Ensure models are warmed up
        await this.warmUpModels();

        try {
            // Run all 4 specialized analyses in parallel
            const analysisPromises = [
                this.getTechnicalAnalysis(symbol, price, changePercent, volume),
                this.getRiskAssessment(symbol, price, changePercent, portfolioValue),
                this.getSentimentAnalysis(symbol, price, changePercent, 'normal'),
                // Strategy analysis depends on others, so we'll run it after
            ];

            const [technical, risk, sentiment] = await Promise.allSettled(analysisPromises);

            // Extract results
            const techResult = technical.status === 'fulfilled' ? technical.value : null;
            const riskResult = risk.status === 'fulfilled' ? risk.value : null;
            const sentResult = sentiment.status === 'fulfilled' ? sentiment.value : null;

            // Run strategy analysis with context from other analyses
            const strategyResult = await this.getStrategyAnalysis(
                symbol, price, changePercent, techResult, riskResult, sentResult
            );

            // Calculate weighted ensemble decision
            let totalScore = 0;
            let totalWeight = 0;
            let validAnalyses = 0;

            // Technical analysis contribution
            if (techResult) {
                totalScore += techResult.signal * techResult.confidence * this.weights.technical;
                totalWeight += this.weights.technical;
                validAnalyses++;
            }

            // Risk assessment contribution
            if (riskResult) {
                totalScore += riskResult.signal * riskResult.confidence * this.weights.risk;
                totalWeight += this.weights.risk;
                validAnalyses++;
            }

            // Sentiment contribution
            if (sentResult) {
                totalScore += sentResult.signal * sentResult.confidence * this.weights.sentiment;
                totalWeight += this.weights.sentiment;
                validAnalyses++;
            }

            // Strategy contribution
            if (strategyResult) {
                totalScore += strategyResult.signal * strategyResult.confidence * this.weights.strategy;
                totalWeight += this.weights.strategy;
                validAnalyses++;
            }

            // Normalize score
            const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

            // Determine final recommendation with higher thresholds for better decisions
            let recommendation = 'HOLD';
            let confidence = Math.abs(normalizedScore);

            if (normalizedScore > 0.5) {
                recommendation = 'BUY';
            } else if (normalizedScore < -0.5) {
                recommendation = 'SELL';
            }

            // Boost confidence if multiple models agree
            if (validAnalyses >= 3) {
                const agreements = [techResult, riskResult, sentResult, strategyResult]
                    .filter(r => r && Math.sign(r.signal) === Math.sign(normalizedScore))
                    .length;

                if (agreements >= 3) {
                    confidence = Math.min(0.95, confidence * 1.3);
                }
            }

            // Update statistics
            this.stats.ensemble_decisions[recommendation.toLowerCase()]++;

            const responseTime = Date.now() - startTime;
            console.log(`✅ Ensemble decision for ${symbol}: ${recommendation} (${Math.round(confidence * 100)}%) - ${responseTime}ms - ${validAnalyses}/4 models`);

            return {
                symbol,
                price: price.toFixed(2),
                change_percent: changePercent.toFixed(2),
                recommendation,
                confidence: Math.round(confidence * 100) / 100,
                decision_score: Math.round(normalizedScore * 100) / 100,
                analyses: {
                    technical: techResult || { trend: 'unknown', confidence: 0, analysis: 'Analysis failed' },
                    risk: riskResult || { risk_level: 'unknown', confidence: 0, analysis: 'Analysis failed' },
                    sentiment: sentResult || { sentiment: 'unknown', confidence: 0, analysis: 'Analysis failed' },
                    strategy: strategyResult || { action: 'unknown', confidence: 0, analysis: 'Analysis failed' }
                },
                ensemble: {
                    models_responded: validAnalyses,
                    models_total: 4,
                    weighted_score: normalizedScore,
                    agreement_level: validAnalyses >= 3 ? 'high' : validAnalyses >= 2 ? 'medium' : 'low'
                },
                performance: {
                    response_time_ms: responseTime,
                    cache_hits: 0 // Could track this
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Error in ensemble analysis for ${symbol}:`, error.message);
            throw error;
        }
    }

    async isAvailable() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
            const availableModels = response.data.models.map(m => m.name);
            const requiredModels = Object.values(this.models);

            const missingModels = requiredModels.filter(model => !availableModels.includes(model));
            if (missingModels.length > 0) {
                console.log(`⚠️ Missing models: ${missingModels.join(', ')}`);
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    getStats() {
        const modelStats = {};
        Object.keys(this.stats.model_success_rates).forEach(model => {
            const stats = this.stats.model_success_rates[model];
            modelStats[model] = {
                success_rate: stats.total > 0 ? `${Math.round(stats.success / stats.total * 100)}%` : '0%',
                avg_response_time: Math.round(this.stats.avg_response_times[model] || 0) + 'ms'
            };
        });

        return {
            total_requests: this.stats.total_requests,
            models_warmed: this.modelsWarmed,
            cache_size: this.cache.size,
            model_performance: modelStats,
            ensemble_decisions: this.stats.ensemble_decisions,
            service_type: 'multi_model_ensemble'
        };
    }
}

module.exports = MultiModelAITradingService;

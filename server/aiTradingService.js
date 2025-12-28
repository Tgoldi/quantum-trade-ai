const axios = require('axios');

class AITradingService {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';

        // Define our LLM ensemble
        this.models = {
            technical: 'llama3.1:8b',     // Technical analysis
            risk: 'mistral:7b',           // Risk assessment  
            sentiment: 'phi3:mini',       // Market sentiment
            strategy: 'llama3.1:8b',      // Trading strategy
            algorithm: 'codellama:13b'    // Strategy generation & algorithms
        };

        // Weights for ensemble decision making
        this.weights = {
            technical: 0.25,
            risk: 0.25,
            sentiment: 0.20,
            strategy: 0.20,
            algorithm: 0.10
        };
    }

    async queryLLM(model, prompt, temperature = 0.7) {
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: temperature,
                    top_p: 0.9,
                    max_tokens: 1000
                }
            }, {
                timeout: 15000 // 15 second timeout
            });

            return response.data.response;
        } catch (error) {
            console.error(`❌ Error querying ${model}:`, error.message);
            return null;
        }
    }

    async isAvailable() {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
                timeout: 5000
            });

            const availableModels = response.data.models.map(m => m.name);
            const requiredModels = Object.values(this.models);
            const missingModels = requiredModels.filter(model => !availableModels.includes(model));

            if (missingModels.length > 0) {
                console.log(`⚠️ Missing models: ${missingModels.join(', ')}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Ollama not available:', error.message);
            return false;
        }
    }

    async getTechnicalAnalysis(marketData) {
        const prompt = `Analyze ${marketData.symbol} stock:
Price: $${marketData.price}, Change: ${marketData.change_percent}%

Respond in JSON format:
{"trend": "bullish/bearish/neutral", "confidence": 0.8, "analysis": "brief analysis"}`;

        const response = await this.queryLLM(this.models.technical, prompt, 0.3);
        return this.parseTechnicalResponse(response);
    }

    async getRiskAssessment(marketData, portfolioData) {
        const prompt = `
As a risk management expert, assess the risk of this trading opportunity:

Stock: ${marketData.symbol}
Current Price: $${marketData.price}
Volatility: ${marketData.change_percent}%
Market Cap: ${marketData.market_cap || 'N/A'}
Portfolio Value: $${portfolioData?.equity || 'N/A'}
Current Positions: ${portfolioData?.positions_count || 0}

Analyze:
1. Position sizing recommendation
2. Risk/reward ratio
3. Maximum acceptable loss
4. Portfolio impact
5. Market conditions risk

Format as JSON:
{
  "risk_level": "low|medium|high",
  "confidence": 0.0-1.0,
  "position_size_percent": number,
  "max_loss_percent": number,
  "risk_reward_ratio": number,
  "assessment": "detailed risk analysis"
}
`;

        const response = await this.queryLLM(this.models.risk, prompt, 0.2);
        return this.parseRiskResponse(response);
    }

    async getMarketSentiment(marketData, newsData = []) {
        const newsText = Array.isArray(newsData) ? newsData.slice(0, 3).map(n => n.headline).join('. ') : '';

        const prompt = `
As a market sentiment analyst, evaluate the current sentiment for this stock:

Stock: ${marketData.symbol}
Price Movement: ${marketData.change_percent}%
Volume: ${marketData.volume}
Recent News: ${newsText || 'No recent news'}

Analyze:
1. Overall market sentiment
2. Social media/retail sentiment
3. Institutional sentiment indicators
4. News impact on price
5. Sentiment trend direction

Format as JSON:
{
  "sentiment": "very_bullish|bullish|neutral|bearish|very_bearish",
  "confidence": 0.0-1.0,
  "social_sentiment": number,
  "institutional_sentiment": number,
  "news_impact": "positive|neutral|negative",
  "analysis": "sentiment analysis details"
}
`;

        const response = await this.queryLLM(this.models.sentiment, prompt, 0.4);
        return this.parseSentimentResponse(response);
    }

    async getTradingStrategy(marketData, technicalAnalysis, riskAssessment) {
        const prompt = `
As a trading strategy expert, develop a trading plan based on this analysis:

Stock: ${marketData.symbol}
Current Price: $${marketData.price}
Technical Trend: ${technicalAnalysis?.trend || 'unknown'}
Risk Level: ${riskAssessment?.risk_level || 'unknown'}
Price Target: $${technicalAnalysis?.price_target || 'N/A'}

Create a comprehensive trading strategy:
1. Entry strategy (buy/sell/hold)
2. Entry price range
3. Stop loss level
4. Take profit targets
5. Time horizon
6. Position management rules

Format as JSON:
{
  "action": "buy|sell|hold",
  "confidence": 0.0-1.0,
  "entry_price_min": number,
  "entry_price_max": number,
  "stop_loss": number,
  "take_profit_1": number,
  "take_profit_2": number,
  "time_horizon": "scalp|day|swing|position",
  "strategy": "detailed strategy explanation"
}
`;

        const response = await this.queryLLM(this.models.strategy, prompt, 0.3);
        return this.parseStrategyResponse(response);
    }

    async generateTradingAlgorithm(requirements) {
        const prompt = `
As a quantitative developer, create a trading algorithm based on these requirements:

Requirements: ${requirements}

Generate a Python-like pseudocode algorithm that includes:
1. Entry conditions
2. Exit conditions  
3. Risk management rules
4. Position sizing logic
5. Portfolio management
6. Backtesting framework

Provide both the algorithm logic and implementation notes.

Format as JSON:
{
  "algorithm_type": "momentum|mean_reversion|breakout|arbitrage",
  "complexity": "simple|intermediate|advanced",
  "expected_returns": number,
  "max_drawdown": number,
  "algorithm_code": "pseudocode here",
  "implementation_notes": "detailed notes",
  "backtesting_metrics": "key metrics to track"
}
`;

        const response = await this.queryLLM(this.models.algorithm, prompt, 0.2);
        return this.parseAlgorithmResponse(response);
    }

    // Response parsers
    parseTechnicalResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                trend: parsed.trend || 'neutral',
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
                support_level: parsed.support_level || 0,
                resistance_level: parsed.resistance_level || 0,
                price_target: parsed.price_target || 0,
                analysis: parsed.analysis || response
            };
        } catch (error) {
            return {
                trend: 'neutral',
                confidence: 0.5,
                support_level: 0,
                resistance_level: 0,
                price_target: 0,
                analysis: response || 'Technical analysis unavailable'
            };
        }
    }

    parseRiskResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                risk_level: parsed.risk_level || 'medium',
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
                position_size_percent: Math.max(0, Math.min(100, parsed.position_size_percent || 5)),
                max_loss_percent: Math.max(0, Math.min(50, parsed.max_loss_percent || 2)),
                risk_reward_ratio: Math.max(0, parsed.risk_reward_ratio || 2),
                assessment: parsed.assessment || response
            };
        } catch (error) {
            return {
                risk_level: 'medium',
                confidence: 0.5,
                position_size_percent: 5,
                max_loss_percent: 2,
                risk_reward_ratio: 2,
                assessment: response || 'Risk assessment unavailable'
            };
        }
    }

    parseSentimentResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                sentiment: parsed.sentiment || 'neutral',
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
                social_sentiment: Math.max(-100, Math.min(100, parsed.social_sentiment || 0)),
                institutional_sentiment: Math.max(-100, Math.min(100, parsed.institutional_sentiment || 0)),
                news_impact: parsed.news_impact || 'neutral',
                analysis: parsed.analysis || response
            };
        } catch (error) {
            return {
                sentiment: 'neutral',
                confidence: 0.5,
                social_sentiment: 0,
                institutional_sentiment: 0,
                news_impact: 'neutral',
                analysis: response || 'Sentiment analysis unavailable'
            };
        }
    }

    parseStrategyResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                action: parsed.action || 'hold',
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
                entry_price_min: parsed.entry_price_min || 0,
                entry_price_max: parsed.entry_price_max || 0,
                stop_loss: parsed.stop_loss || 0,
                take_profit_1: parsed.take_profit_1 || 0,
                take_profit_2: parsed.take_profit_2 || 0,
                time_horizon: parsed.time_horizon || 'swing',
                strategy: parsed.strategy || response
            };
        } catch (error) {
            return {
                action: 'hold',
                confidence: 0.5,
                entry_price_min: 0,
                entry_price_max: 0,
                stop_loss: 0,
                take_profit_1: 0,
                take_profit_2: 0,
                time_horizon: 'swing',
                strategy: response || 'Trading strategy unavailable'
            };
        }
    }

    parseAlgorithmResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                algorithm_type: parsed.algorithm_type || 'momentum',
                complexity: parsed.complexity || 'intermediate',
                expected_returns: parsed.expected_returns || 0,
                max_drawdown: parsed.max_drawdown || 0,
                algorithm_code: parsed.algorithm_code || response,
                implementation_notes: parsed.implementation_notes || 'Implementation notes unavailable',
                backtesting_metrics: parsed.backtesting_metrics || 'Standard metrics'
            };
        } catch (error) {
            return {
                algorithm_type: 'momentum',
                complexity: 'intermediate',
                expected_returns: 0,
                max_drawdown: 0,
                algorithm_code: response || 'Algorithm code unavailable',
                implementation_notes: 'Implementation notes unavailable',
                backtesting_metrics: 'Standard metrics'
            };
        }
    }

    // Portfolio Analysis
    async analyzePortfolio(stocksData, portfolioData, marketMovers) {
        console.log('🤖 Starting AI portfolio analysis...');

        try {
            // Analyze each stock in the portfolio
            const stockAnalyses = await Promise.all(
                stocksData.slice(0, 3).map(async (stock) => {
                    const analysis = await this.getAITradingDecision(stock, portfolioData);
                    return {
                        symbol: stock.symbol,
                        current_price: stock.price,
                        recommendation: analysis.recommendation,
                        confidence: analysis.confidence,
                        decision_score: analysis.decision_score
                    };
                })
            );

            // Overall portfolio health
            const totalValue = portfolioData.total_value || 0;
            const cashRatio = portfolioData.cash / totalValue;
            const diversificationScore = stocksData.length >= 5 ? 0.8 : stocksData.length * 0.15;

            // Portfolio risk assessment
            let portfolioRisk = 'medium';
            if (cashRatio > 0.3) portfolioRisk = 'low';
            else if (cashRatio < 0.1 && diversificationScore < 0.5) portfolioRisk = 'high';

            // Generate recommendations
            const recommendations = [];

            if (cashRatio > 0.5) {
                recommendations.push('Consider increasing market exposure - high cash ratio detected');
            }
            if (diversificationScore < 0.6) {
                recommendations.push('Improve portfolio diversification across sectors');
            }

            const buySignals = stockAnalyses.filter(s => s.recommendation === 'BUY').length;
            const sellSignals = stockAnalyses.filter(s => s.recommendation === 'SELL').length;

            if (sellSignals > buySignals) {
                recommendations.push('Consider defensive positioning - multiple sell signals detected');
            }

            console.log('✅ Portfolio analysis complete');

            return {
                portfolio_value: totalValue,
                cash_ratio: Math.round(cashRatio * 100) / 100,
                diversification_score: Math.round(diversificationScore * 100) / 100,
                risk_level: portfolioRisk,
                stock_analyses: stockAnalyses,
                recommendations: recommendations,
                market_outlook: buySignals > sellSignals ? 'bullish' : sellSignals > buySignals ? 'bearish' : 'neutral',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error in portfolio analysis:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Main ensemble decision engine
    async getAITradingDecision(marketData, portfolioData = null, newsData = []) {
        console.log(`🤖 Starting AI analysis for ${marketData.symbol}...`);

        try {
            // Run all analyses in parallel
            const [technical, risk, sentiment, strategy] = await Promise.all([
                this.getTechnicalAnalysis(marketData),
                this.getRiskAssessment(marketData, portfolioData),
                this.getMarketSentiment(marketData, newsData),
                this.getTradingStrategy(marketData, null, null) // Will be updated with results
            ]);

            // Calculate weighted decision score
            let decisionScore = 0;
            let totalWeight = 0;

            // Technical analysis contribution
            if (technical) {
                const techScore = technical.trend === 'bullish' ? 1 : technical.trend === 'bearish' ? -1 : 0;
                decisionScore += techScore * technical.confidence * this.weights.technical;
                totalWeight += this.weights.technical;
            }

            // Risk assessment contribution
            if (risk) {
                const riskScore = risk.risk_level === 'low' ? 0.5 : risk.risk_level === 'high' ? -0.5 : 0;
                decisionScore += riskScore * risk.confidence * this.weights.risk;
                totalWeight += this.weights.risk;
            }

            // Sentiment contribution
            if (sentiment) {
                const sentimentScore = sentiment.sentiment.includes('bullish') ? 1 :
                    sentiment.sentiment.includes('bearish') ? -1 : 0;
                decisionScore += sentimentScore * sentiment.confidence * this.weights.sentiment;
                totalWeight += this.weights.sentiment;
            }

            // Strategy contribution
            if (strategy) {
                const strategyScore = strategy.action === 'buy' ? 1 : strategy.action === 'sell' ? -1 : 0;
                decisionScore += strategyScore * strategy.confidence * this.weights.strategy;
                totalWeight += this.weights.strategy;
            }

            // Normalize the decision score
            const normalizedScore = totalWeight > 0 ? decisionScore / totalWeight : 0;

            // Determine final recommendation
            let recommendation = 'HOLD';
            let confidence = Math.abs(normalizedScore);

            if (normalizedScore > 0.3) {
                recommendation = 'BUY';
            } else if (normalizedScore < -0.3) {
                recommendation = 'SELL';
            }

            console.log(`✅ AI analysis complete for ${marketData.symbol}: ${recommendation} (${Math.round(confidence * 100)}%)`);

            return {
                symbol: marketData.symbol,
                recommendation,
                confidence: Math.round(confidence * 100) / 100,
                decision_score: Math.round(normalizedScore * 100) / 100,
                analyses: {
                    technical,
                    risk,
                    sentiment,
                    strategy
                },
                timestamp: new Date().toISOString(),
                models_used: Object.keys(this.models).length
            };

        } catch (error) {
            console.error('❌ Error in AI trading decision:', error);
            return {
                symbol: marketData.symbol,
                recommendation: 'HOLD',
                confidence: 0,
                decision_score: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = AITradingService;

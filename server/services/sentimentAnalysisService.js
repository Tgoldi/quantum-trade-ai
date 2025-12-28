// Sentiment Analysis Service
// Analyzes news, social media, and market sentiment
const axios = require('axios');
const { query, cache } = require('../database/db');

class SentimentAnalysisService {
    constructor() {
        this.newsAPIKey = process.env.NEWS_API_KEY;
        this.updateInterval = 300000; // 5 minutes
        this.startSentimentMonitoring();
    }

    /**
     * Get comprehensive sentiment for a symbol
     */
    async getSentiment(symbol) {
        const cacheKey = `sentiment:${symbol}`;
        let cached = await cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached;
        }

        try {
            // Gather sentiment from multiple sources
            const [newsStats, socialSentiment, insiderActivity, optionsFlow] = await Promise.all([
                this.getNewsSentiment(symbol),
                this.getSocialMediaSentiment(symbol),
                this.getInsiderActivity(symbol),
                this.getOptionsFlow(symbol)
            ]);

            // Combine sentiments with weights
            const combinedSentiment = this.combineSentiments({
                news: newsSentiment,
                social: socialSentiment,
                insider: insiderActivity,
                options: optionsFlow
            });

            const result = {
                symbol,
                overall: combinedSentiment,
                breakdown: {
                    news: newsStats,
                    social: socialSentiment,
                    insider: insiderActivity,
                    options: optionsFlow
                },
                timestamp: Date.now()
            };

            // Cache result
            await cache.set(cacheKey, result, 300);

            return result;
        } catch (error) {
            console.error(`Error getting sentiment for ${symbol}:`, error);
            return this.getDefaultSentiment(symbol);
        }
    }

    /**
     * Get news sentiment
     */
    async getNewsSentiment(symbol) {
        try {
            // In production, use NewsAPI, Finnhub, or AlphaVantage
            // For now, simulate sentiment

            const articles = this.simulateNewsArticles(symbol);

            let totalSentiment = 0;
            let positiveCount = 0;
            let negativeCount = 0;
            let neutralCount = 0;

            for (const article of articles) {
                const sentiment = this.analyzeTextSentiment(article.title + ' ' + article.description);
                totalSentiment += sentiment.score;

                if (sentiment.score > 0.2) positiveCount++;
                else if (sentiment.score < -0.2) negativeCount++;
                else neutralCount++;

                // Store in database
                await query(
                    `INSERT INTO sentiment_data (symbol, source, sentiment_score, raw_text, url, published_at, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
                    [
                        symbol,
                        'news',
                        sentiment.score,
                        article.title,
                        article.url,
                        article.publishedAt,
                        JSON.stringify({ keywords: sentiment.keywords })
                    ]
                );
            }

            const avgSentiment = articles.length > 0 ? totalSentiment / articles.length : 0;

            return {
                score: avgSentiment,
                signal: avgSentiment > 0.2 ? 'bullish' : avgSentiment < -0.2 ? 'bearish' : 'neutral',
                articleCount: articles.length,
                positive: positiveCount,
                negative: negativeCount,
                neutral: neutralCount,
                recentHeadlines: articles.slice(0, 5).map(a => a.title)
            };
        } catch (error) {
            console.error('News sentiment error:', error);
            return { score: 0, signal: 'neutral', articleCount: 0 };
        }
    }

    /**
     * Get social media sentiment (Twitter/Reddit)
     */
    async getSocialMediaSentiment(symbol) {
        try {
            // In production, integrate with Twitter API, Reddit API
            // For now, simulate

            const mentions = Math.floor(Math.random() * 1000) + 100;
            const sentiment = (Math.random() * 2 - 1); // -1 to 1

            return {
                score: sentiment,
                signal: sentiment > 0.2 ? 'bullish' : sentiment < -0.2 ? 'bearish' : 'neutral',
                platforms: {
                    twitter: {
                        mentions: Math.floor(mentions * 0.6),
                        sentiment: sentiment * 0.9
                    },
                    reddit: {
                        mentions: Math.floor(mentions * 0.3),
                        sentiment: sentiment * 1.1,
                        topSubreddits: ['wallstreetbets', 'stocks', 'investing']
                    },
                    stocktwits: {
                        mentions: Math.floor(mentions * 0.1),
                        sentiment: sentiment * 1.05
                    }
                },
                totalMentions: mentions,
                trending: Math.random() > 0.8
            };
        } catch (error) {
            console.error('Social sentiment error:', error);
            return { score: 0, signal: 'neutral', totalMentions: 0 };
        }
    }

    /**
     * Get insider trading activity
     */
    async getInsiderActivity(symbol) {
        try {
            // In production, use SEC filings or services like OpenInsider
            // Insider buying = bullish, selling = bearish

            const hasInsiderActivity = Math.random() > 0.7;

            if (!hasInsiderActivity) {
                return {
                    score: 0,
                    signal: 'neutral',
                    recentTransactions: []
                };
            }

            const activityType = Math.random() > 0.5 ? 'buy' : 'sell';
            const value = Math.floor(Math.random() * 10000000) + 100000;

            const score = activityType === 'buy' ? 0.5 : -0.5;

            return {
                score,
                signal: activityType === 'buy' ? 'bullish' : 'bearish',
                recentTransactions: [
                    {
                        type: activityType,
                        value,
                        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                        insider: 'Executive'
                    }
                ],
                netBuyingLast30Days: activityType === 'buy' ? value : -value
            };
        } catch (error) {
            console.error('Insider activity error:', error);
            return { score: 0, signal: 'neutral', recentTransactions: [] };
        }
    }

    /**
     * Get options flow (unusual options activity)
     */
    async getOptionsFlow(symbol) {
        try {
            // In production, use options data providers
            // High call volume = bullish, high put volume = bearish

            const hasUnusualActivity = Math.random() > 0.6;

            if (!hasUnusualActivity) {
                return {
                    score: 0,
                    signal: 'neutral',
                    callPutRatio: 1.0
                };
            }

            const callVolume = Math.floor(Math.random() * 10000) + 1000;
            const putVolume = Math.floor(Math.random() * 10000) + 1000;
            const callPutRatio = callVolume / putVolume;

            const score = callPutRatio > 1.5 ? 0.6 : callPutRatio < 0.7 ? -0.6 : 0;

            return {
                score,
                signal: callPutRatio > 1.5 ? 'bullish' : callPutRatio < 0.7 ? 'bearish' : 'neutral',
                callPutRatio,
                callVolume,
                putVolume,
                unusualActivity: Math.abs(score) > 0.5,
                largeOrders: [
                    {
                        type: callPutRatio > 1 ? 'call' : 'put',
                        strike: Math.floor(Math.random() * 100) + 100,
                        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        volume: Math.floor(Math.random() * 1000) + 500
                    }
                ]
            };
        } catch (error) {
            console.error('Options flow error:', error);
            return { score: 0, signal: 'neutral', callPutRatio: 1.0 };
        }
    }

    /**
     * Combine sentiments from multiple sources
     */
    combineSentiments(sources) {
        // Weight different sources
        const weights = {
            news: 0.30,
            social: 0.20,
            insider: 0.30,
            options: 0.20
        };

        let totalScore = 0;
        let totalWeight = 0;

        for (const [source, data] of Object.entries(sources)) {
            if (data && data.score !== undefined) {
                totalScore += data.score * weights[source];
                totalWeight += weights[source];
            }
        }

        const combinedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

        return {
            score: combinedScore,
            signal: combinedScore > 0.2 ? 'bullish' : combinedScore < -0.2 ? 'bearish' : 'neutral',
            confidence: Math.abs(combinedScore),
            breakdown: {
                news: sources.news?.score || 0,
                social: sources.social?.score || 0,
                insider: sources.insider?.score || 0,
                options: sources.options?.score || 0
            }
        };
    }

    /**
     * Analyze text sentiment using simple keyword matching
     * In production, use NLP libraries or APIs like Google NLP, OpenAI
     */
    analyzeTextSentiment(text) {
        const positiveWords = [
            'bullish', 'surge', 'rally', 'gains', 'growth', 'profit', 'strong',
            'beat', 'upgrade', 'outperform', 'breakthrough', 'soar', 'jump', 'rise',
            'positive', 'optimistic', 'recovery', 'expansion', 'opportunity'
        ];

        const negativeWords = [
            'bearish', 'crash', 'fall', 'losses', 'decline', 'weak', 'miss',
            'downgrade', 'underperform', 'concerns', 'plunge', 'drop', 'tumble',
            'negative', 'pessimistic', 'risk', 'warning', 'threat', 'uncertainty'
        ];

        const lowerText = text.toLowerCase();

        let positiveCount = 0;
        let negativeCount = 0;
        const keywords = [];

        for (const word of positiveWords) {
            if (lowerText.includes(word)) {
                positiveCount++;
                keywords.push(word);
            }
        }

        for (const word of negativeWords) {
            if (lowerText.includes(word)) {
                negativeCount++;
                keywords.push(word);
            }
        }

        const totalWords = positiveCount + negativeCount;
        const score = totalWords > 0
            ? (positiveCount - negativeCount) / totalWords
            : 0;

        return {
            score,
            keywords,
            positiveCount,
            negativeCount
        };
    }

    /**
     * Simulate news articles (for demo)
     */
    simulateNewsArticles(symbol) {
        const templates = [
            { title: `${symbol} Surges on Strong Earnings`, sentiment: 0.8 },
            { title: `${symbol} Stock Falls After Guidance Cut`, sentiment: -0.7 },
            { title: `Analysts Upgrade ${symbol} to Buy`, sentiment: 0.6 },
            { title: `${symbol} Announces New Product Launch`, sentiment: 0.5 },
            { title: `${symbol} Faces Regulatory Concerns`, sentiment: -0.6 },
            { title: `${symbol} Reports Steady Growth`, sentiment: 0.4 },
            { title: `Market Volatility Impacts ${symbol}`, sentiment: -0.3 },
            { title: `${symbol} Beats Revenue Expectations`, sentiment: 0.7 }
        ];

        const numArticles = Math.floor(Math.random() * 5) + 3;
        const articles = [];

        for (let i = 0; i < numArticles; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            articles.push({
                title: template.title,
                description: `Latest news and analysis on ${symbol} stock performance and market outlook.`,
                url: `https://example.com/news/${symbol.toLowerCase()}-${i}`,
                publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                sentiment: template.sentiment
            });
        }

        return articles;
    }

    /**
     * Get default sentiment
     */
    getDefaultSentiment(symbol) {
        return {
            symbol,
            overall: {
                score: 0,
                signal: 'neutral',
                confidence: 0
            },
            breakdown: {
                news: { score: 0, signal: 'neutral' },
                social: { score: 0, signal: 'neutral' },
                insider: { score: 0, signal: 'neutral' },
                options: { score: 0, signal: 'neutral' }
            },
            timestamp: Date.now()
        };
    }

    /**
     * Get market-wide sentiment
     */
    async getMarketSentiment() {
        try {
            // Use major indices as proxy
            const indices = ['SPY', 'QQQ', 'IWM'];
            const sentiments = await Promise.all(
                indices.map(symbol => this.getSentiment(symbol))
            );

            const avgScore = sentiments.reduce((sum, s) => sum + s.overall.score, 0) / sentiments.length;

            return {
                score: avgScore,
                signal: avgScore > 0.2 ? 'bullish' : avgScore < -0.2 ? 'bearish' : 'neutral',
                indices: sentiments.map(s => ({
                    symbol: s.symbol,
                    score: s.overall.score,
                    signal: s.overall.signal
                })),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Market sentiment error:', error);
            return { score: 0, signal: 'neutral' };
        }
    }

    /**
     * Start periodic sentiment monitoring
     */
    startSentimentMonitoring() {
        setInterval(async () => {
            try {
                const marketSentiment = await this.getMarketSentiment();
                await cache.set('market:sentiment', marketSentiment, 300);
                console.log(`💬 Market Sentiment: ${marketSentiment.signal.toUpperCase()} (${(marketSentiment.score * 100).toFixed(1)}%)`);
            } catch (error) {
                console.error('Sentiment monitoring error:', error);
            }
        }, this.updateInterval);
    }

    /**
     * Get trending stocks based on sentiment
     */
    async getTrendingStocks(limit = 10) {
        const recentSentiment = await query(
            `SELECT symbol, AVG(sentiment_score) as avg_sentiment, COUNT(*) as mention_count
       FROM sentiment_data
       WHERE collected_at >= NOW() - INTERVAL '24 hours'
       GROUP BY symbol
       HAVING COUNT(*) > 5
       ORDER BY mention_count DESC, ABS(AVG(sentiment_score)) DESC
       LIMIT $1`,
            [limit]
        );

        return recentSentiment.map(row => ({
            symbol: row.symbol,
            sentiment: parseFloat(row.avg_sentiment),
            mentions: parseInt(row.mention_count),
            signal: parseFloat(row.avg_sentiment) > 0.2 ? 'bullish' : parseFloat(row.avg_sentiment) < -0.2 ? 'bearish' : 'neutral'
        }));
    }
}

module.exports = new SentimentAnalysisService();



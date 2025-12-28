// Trade Journal & Performance Analytics Service
const { query, transaction } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class TradeJournalService {
    /**
     * Add journal entry for a trade
     */
    async addJournalEntry(tradeId, entry) {
        const {
            preTradeThoughts,
            strategy,
            emotionalState,
            marketCondition,
            targetPrice,
            stopLoss,
            riskRewardRatio,
            notes
        } = entry;

        const journalId = uuidv4();

        await query(
            `INSERT INTO trade_journal (
        id, trade_id, pre_trade_thoughts, strategy, emotional_state,
        market_condition, target_price, stop_loss, risk_reward_ratio, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                journalId,
                tradeId,
                preTradeThoughts,
                strategy,
                emotionalState,
                marketCondition,
                targetPrice,
                stopLoss,
                riskRewardRatio,
                notes
            ]
        );

        return journalId;
    }

    /**
     * Update journal entry with post-trade analysis
     */
    async updatePostTrade(journalId, postTradeData) {
        const {
            postTradeThoughts,
            whatWentWell,
            whatWentWrong,
            lessons,
            emotionalImpact,
            wouldRepeat
        } = postTradeData;

        await query(
            `UPDATE trade_journal SET
        post_trade_thoughts = $1,
        what_went_well = $2,
        what_went_wrong = $3,
        lessons = $4,
        emotional_impact = $5,
        would_repeat = $6,
        updated_at = NOW()
      WHERE id = $7`,
            [
                postTradeThoughts,
                whatWentWell,
                whatWentWrong,
                lessons,
                emotionalImpact,
                wouldRepeat,
                journalId
            ]
        );
    }

    /**
     * Analyze trading patterns and mistakes
     */
    async analyzePerformance(portfolioId, timeframe = '30d') {
        const trades = await query(
            `SELECT t.*, tj.*
       FROM trades t
       LEFT JOIN trade_journal tj ON t.id = tj.trade_id
       WHERE t.portfolio_id = $1
       AND t.execution_time >= NOW() - INTERVAL '${timeframe}'
       ORDER BY t.execution_time DESC`,
            [portfolioId]
        );

        // Calculate win/loss patterns
        const analysis = {
            totalTrades: trades.length,
            wins: 0,
            losses: 0,
            breakeven: 0,
            avgWin: 0,
            avgLoss: 0,
            biggestWin: 0,
            biggestLoss: 0,
            commonMistakes: [],
            emotionalPatterns: {},
            strategyPerformance: {},
            timeOfDayAnalysis: {},
            lessons: []
        };

        let totalWinAmount = 0;
        let totalLossAmount = 0;

        // Group trades into pairs (buy + sell)
        const tradePairs = this.groupTradePairs(trades);

        for (const pair of tradePairs) {
            if (!pair.sell) continue;

            const pnl = (pair.sell.price - pair.buy.price) * pair.buy.quantity;
            const pnlPercent = ((pair.sell.price - pair.buy.price) / pair.buy.price) * 100;

            if (pnl > 0) {
                analysis.wins++;
                totalWinAmount += pnl;
                analysis.biggestWin = Math.max(analysis.biggestWin, pnl);
            } else if (pnl < 0) {
                analysis.losses++;
                totalLossAmount += Math.abs(pnl);
                analysis.biggestLoss = Math.min(analysis.biggestLoss, pnl);

                // Analyze loss for mistakes
                const mistakes = this.identifyMistakes(pair);
                analysis.commonMistakes.push(...mistakes);
            } else {
                analysis.breakeven++;
            }

            // Strategy performance
            const strategy = pair.buy.strategy || 'unknown';
            if (!analysis.strategyPerformance[strategy]) {
                analysis.strategyPerformance[strategy] = {
                    trades: 0,
                    wins: 0,
                    losses: 0,
                    totalPnL: 0
                };
            }
            analysis.strategyPerformance[strategy].trades++;
            analysis.strategyPerformance[strategy].totalPnL += pnl;
            if (pnl > 0) analysis.strategyPerformance[strategy].wins++;
            else if (pnl < 0) analysis.strategyPerformance[strategy].losses++;

            // Time of day analysis
            const hour = new Date(pair.buy.execution_time).getHours();
            const timeBlock = this.getTimeBlock(hour);
            if (!analysis.timeOfDayAnalysis[timeBlock]) {
                analysis.timeOfDayAnalysis[timeBlock] = {
                    trades: 0,
                    wins: 0,
                    totalPnL: 0
                };
            }
            analysis.timeOfDayAnalysis[timeBlock].trades++;
            if (pnl > 0) analysis.timeOfDayAnalysis[timeBlock].wins++;
            analysis.timeOfDayAnalysis[timeBlock].totalPnL += pnl;

            // Emotional patterns from journal
            if (pair.journal) {
                const emotion = pair.journal.emotional_state;
                if (emotion) {
                    if (!analysis.emotionalPatterns[emotion]) {
                        analysis.emotionalPatterns[emotion] = {
                            trades: 0,
                            wins: 0,
                            avgPnL: 0,
                            totalPnL: 0
                        };
                    }
                    analysis.emotionalPatterns[emotion].trades++;
                    if (pnl > 0) analysis.emotionalPatterns[emotion].wins++;
                    analysis.emotionalPatterns[emotion].totalPnL += pnl;
                }

                // Collect lessons
                if (pair.journal.lessons) {
                    analysis.lessons.push(pair.journal.lessons);
                }
            }
        }

        // Calculate averages
        analysis.avgWin = analysis.wins > 0 ? totalWinAmount / analysis.wins : 0;
        analysis.avgLoss = analysis.losses > 0 ? totalLossAmount / analysis.losses : 0;
        analysis.winRate = analysis.totalTrades > 0
            ? (analysis.wins / analysis.totalTrades) * 100
            : 0;
        analysis.profitFactor = analysis.avgLoss > 0
            ? analysis.avgWin / analysis.avgLoss
            : 0;

        // Calculate emotional impact on performance
        for (const emotion in analysis.emotionalPatterns) {
            const pattern = analysis.emotionalPatterns[emotion];
            pattern.avgPnL = pattern.totalPnL / pattern.trades;
            pattern.winRate = (pattern.wins / pattern.trades) * 100;
        }

        // Identify most common mistakes
        analysis.commonMistakes = this.categorizeCommonMistakes(analysis.commonMistakes);

        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    /**
     * Group trades into buy-sell pairs
     */
    groupTradePairs(trades) {
        const pairs = [];
        const buyTrades = trades.filter(t => t.side === 'buy');
        const sellTrades = trades.filter(t => t.side === 'sell');

        for (const buy of buyTrades) {
            const correspondingSell = sellTrades.find(
                s => s.symbol === buy.symbol &&
                    new Date(s.execution_time) > new Date(buy.execution_time)
            );

            const journal = trades.find(t => t.trade_id === buy.id);

            pairs.push({
                buy,
                sell: correspondingSell || null,
                journal
            });
        }

        return pairs;
    }

    /**
     * Identify mistakes in a losing trade
     */
    identifyMistakes(tradePair) {
        const mistakes = [];
        const { buy, sell, journal } = tradePair;

        if (!sell) return mistakes;

        const pnlPercent = ((sell.price - buy.price) / buy.price) * 100;

        // Mistake 1: No stop loss
        if (journal && !journal.stop_loss && pnlPercent < -5) {
            mistakes.push({
                type: 'no_stop_loss',
                severity: 'high',
                description: 'Trade lacked a predefined stop loss',
                impact: pnlPercent
            });
        }

        // Mistake 2: Cutting winners, letting losers run
        if (journal && journal.target_price) {
            const targetReached = sell.price >= journal.target_price;
            const exitedEarly = !targetReached && pnlPercent > 2;

            if (exitedEarly) {
                mistakes.push({
                    type: 'cut_winner_early',
                    severity: 'medium',
                    description: 'Exited profitable trade before target'
                });
            }
        }

        // Mistake 3: Held losing trade too long
        if (pnlPercent < -10) {
            mistakes.push({
                type: 'held_loser_too_long',
                severity: 'high',
                description: 'Loss exceeded reasonable threshold',
                impact: pnlPercent
            });
        }

        // Mistake 4: Emotional trading
        if (journal && journal.emotional_state &&
            ['fear', 'greed', 'FOMO', 'revenge'].includes(journal.emotional_state)) {
            mistakes.push({
                type: 'emotional_trading',
                severity: 'high',
                description: `Trade influenced by ${journal.emotional_state}`,
                emotion: journal.emotional_state
            });
        }

        // Mistake 5: Poor risk/reward ratio
        if (journal && journal.risk_reward_ratio && journal.risk_reward_ratio < 1.5) {
            mistakes.push({
                type: 'poor_risk_reward',
                severity: 'medium',
                description: 'Risk/reward ratio was suboptimal',
                ratio: journal.risk_reward_ratio
            });
        }

        return mistakes;
    }

    /**
     * Categorize and count common mistakes
     */
    categorizeCommonMistakes(mistakes) {
        const categories = {};

        for (const mistake of mistakes) {
            if (!categories[mistake.type]) {
                categories[mistake.type] = {
                    type: mistake.type,
                    count: 0,
                    severity: mistake.severity,
                    description: mistake.description,
                    examples: []
                };
            }
            categories[mistake.type].count++;
            categories[mistake.type].examples.push(mistake);
        }

        // Sort by count
        return Object.values(categories).sort((a, b) => b.count - a.count);
    }

    /**
     * Get time block for trade
     */
    getTimeBlock(hour) {
        if (hour >= 9 && hour < 12) return 'morning_session';
        if (hour >= 12 && hour < 15) return 'midday_session';
        if (hour >= 15 && hour < 16) return 'power_hour';
        return 'after_hours';
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Win rate recommendation
        if (analysis.winRate < 40) {
            recommendations.push({
                category: 'strategy',
                priority: 'high',
                title: 'Low Win Rate Detected',
                description: `Your win rate of ${analysis.winRate.toFixed(1)}% is below optimal. Focus on quality over quantity.`,
                actionItems: [
                    'Review entry criteria - are you being too aggressive?',
                    'Wait for higher probability setups',
                    'Consider paper trading new strategies before going live'
                ]
            });
        }

        // Risk/reward recommendation
        if (analysis.profitFactor < 1.5) {
            recommendations.push({
                category: 'risk_management',
                priority: 'high',
                title: 'Improve Risk/Reward Ratio',
                description: 'Average winners are not sufficiently larger than average losers',
                actionItems: [
                    'Let winners run longer',
                    'Cut losses quicker',
                    'Aim for minimum 2:1 risk/reward on each trade'
                ]
            });
        }

        // Emotional trading
        const negativeEmotions = ['fear', 'greed', 'FOMO', 'revenge'];
        let emotionalTrades = 0;
        for (const emotion of negativeEmotions) {
            if (analysis.emotionalPatterns[emotion]) {
                emotionalTrades += analysis.emotionalPatterns[emotion].trades;
            }
        }

        if (emotionalTrades > analysis.totalTrades * 0.2) {
            recommendations.push({
                category: 'psychology',
                priority: 'critical',
                title: 'Emotional Trading Detected',
                description: 'Significant number of trades influenced by negative emotions',
                actionItems: [
                    'Take a break after losses',
                    'Set strict trading rules and follow them',
                    'Consider reducing position sizes to reduce emotional attachment',
                    'Keep a detailed journal to identify emotional triggers'
                ]
            });
        }

        // Best performing strategy
        const strategies = Object.entries(analysis.strategyPerformance)
            .sort((a, b) => b[1].totalPnL - a[1].totalPnL);

        if (strategies.length > 1) {
            const best = strategies[0];
            recommendations.push({
                category: 'strategy',
                priority: 'medium',
                title: 'Focus on Best Performing Strategy',
                description: `Your ${best[0]} strategy has the best performance`,
                actionItems: [
                    `Increase allocation to ${best[0]} setups`,
                    'Analyze why this strategy works better for you',
                    'Consider reducing or eliminating underperforming strategies'
                ]
            });
        }

        // Time of day analysis
        const bestTime = Object.entries(analysis.timeOfDayAnalysis)
            .sort((a, b) => b[1].totalPnL - a[1].totalPnL)[0];

        if (bestTime) {
            recommendations.push({
                category: 'timing',
                priority: 'low',
                title: 'Optimal Trading Time Identified',
                description: `You perform best during ${bestTime[0].replace('_', ' ')}`,
                actionItems: [
                    `Focus your energy on ${bestTime[0].replace('_', ' ')}`,
                    'Avoid trading during your underperforming times',
                    'Align your trading schedule with your peak performance'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Get trading statistics for period
     */
    async getStatistics(portfolioId, period = '30d') {
        const stats = await query(
            `SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN side = 'buy' THEN 1 ELSE 0 END) as buys,
        SUM(CASE WHEN side = 'sell' THEN 1 ELSE 0 END) as sells,
        AVG(price) as avg_price,
        SUM(commission) as total_commission,
        COUNT(DISTINCT symbol) as symbols_traded,
        COUNT(DISTINCT DATE(execution_time)) as trading_days
      FROM trades
      WHERE portfolio_id = $1
      AND execution_time >= NOW() - INTERVAL '${period}'`,
            [portfolioId]
        );

        return stats[0];
    }

    /**
     * Export journal entries
     */
    async exportJournal(portfolioId, format = 'json') {
        const entries = await query(
            `SELECT t.*, tj.*
       FROM trades t
       LEFT JOIN trade_journal tj ON t.id = tj.trade_id
       WHERE t.portfolio_id = $1
       ORDER BY t.execution_time DESC`,
            [portfolioId]
        );

        if (format === 'csv') {
            return this.convertToCSV(entries);
        }

        return entries;
    }

    /**
     * Convert entries to CSV format
     */
    convertToCSV(entries) {
        const headers = [
            'Date', 'Symbol', 'Side', 'Quantity', 'Price', 'Total',
            'Strategy', 'Emotional State', 'Notes', 'Lessons'
        ];

        const rows = entries.map(entry => [
            entry.execution_time,
            entry.symbol,
            entry.side,
            entry.quantity,
            entry.price,
            entry.total_amount,
            entry.strategy || '',
            entry.emotional_state || '',
            entry.notes || '',
            entry.lessons || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

module.exports = new TradeJournalService();



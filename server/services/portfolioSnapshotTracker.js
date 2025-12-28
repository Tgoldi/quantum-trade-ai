/**
 * Portfolio Snapshot Tracker
 * Stores daily portfolio values to calculate accurate day change %
 */

const { cache, query } = require('../database/db');

class PortfolioSnapshotTracker {
    /**
     * Store current portfolio snapshot
     */
    async storeSnapshot(userId, portfolioValue) {
        const today = new Date().toISOString().split('T')[0];
        const key = `portfolio_snapshot:${userId}:${today}`;
        
        try {
            await cache.set(key, portfolioValue.toString(), 86400); // 24 hour TTL
            console.log(`📸 Stored portfolio snapshot for user ${userId}: $${portfolioValue}`);
        } catch (error) {
            console.error('Error storing portfolio snapshot:', error);
        }
    }

    /**
     * Get yesterday's portfolio value
     */
    async getYesterdayValue(userId) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        const key = `portfolio_snapshot:${userId}:${dateStr}`;
        
        try {
            const value = await cache.get(key);
            return value ? parseFloat(value) : null;
        } catch (error) {
            console.error('Error getting yesterday snapshot:', error);
            return null;
        }
    }

    /**
     * Calculate real day change
     */
    async calculateDayChange(userId, currentValue) {
        const yesterdayValue = await this.getYesterdayValue(userId);
        
        if (!yesterdayValue) {
            // No historical data yet, return 0
            return {
                day_change: 0,
                day_change_percent: 0,
                has_historical_data: false
            };
        }
        
        const dayChange = currentValue - yesterdayValue;
        const dayChangePercent = (dayChange / yesterdayValue) * 100;
        
        return {
            day_change: parseFloat(dayChange.toFixed(2)),
            day_change_percent: parseFloat(dayChangePercent.toFixed(2)),
            has_historical_data: true,
            yesterday_value: yesterdayValue
        };
    }

    /**
     * Get weekly snapshots for charting
     */
    async getWeeklySnapshots(userId) {
        const snapshots = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const key = `portfolio_snapshot:${userId}:${dateStr}`;
            
            try {
                const value = await cache.get(key);
                if (value) {
                    snapshots.push({
                        date: dateStr,
                        value: parseFloat(value)
                    });
                }
            } catch (error) {
                console.warn(`Could not get snapshot for ${dateStr}`);
            }
        }
        
        return snapshots;
    }
}

module.exports = new PortfolioSnapshotTracker();




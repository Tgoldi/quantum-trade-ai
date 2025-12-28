// Monitoring, Logging & Error Tracking Service
const winston = require('winston');
const { query, cache } = require('../database/db');

class MonitoringService {
    constructor() {
        // Configure Winston logger
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'quantumtrade-api' },
            transports: [
                // Console logging
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                // File logging
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 10485760,
                    maxFiles: 10
                })
            ]
        });

        // Performance metrics
        this.metrics = {
            requests: 0,
            errors: 0,
            trades: 0,
            aiDecisions: 0,
            averageResponseTime: 0
        };

        this.startMetricsCollection();
    }

    /**
     * Log info message
     */
    info(message, metadata = {}) {
        this.logger.info(message, metadata);
    }

    /**
     * Log warning
     */
    warn(message, metadata = {}) {
        this.logger.warn(message, metadata);
    }

    /**
     * Log error
     */
    error(message, error = null, metadata = {}) {
        this.logger.error(message, {
            ...metadata,
            error: error ? {
                message: error.message,
                stack: error.stack,
                code: error.code
            } : null
        });

        this.metrics.errors++;

        // Store critical errors in database
        if (error) {
            this.storeSystemLog('error', message, error, metadata);
        }
    }

    /**
     * Log debug message
     */
    debug(message, metadata = {}) {
        this.logger.debug(message, metadata);
    }

    /**
     * Store log in database
     */
    async storeSystemLog(level, message, error = null, metadata = {}) {
        try {
            await query(
                `INSERT INTO system_logs (level, component, message, error_stack, metadata, user_id, portfolio_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    level,
                    metadata.component || 'general',
                    message,
                    error ? error.stack : null,
                    JSON.stringify(metadata),
                    metadata.userId || null,
                    metadata.portfolioId || null
                ]
            );
        } catch (err) {
            this.logger.error('Failed to store system log', { error: err });
        }
    }

    /**
     * Track API request
     */
    trackRequest(method, path, duration, statusCode) {
        this.metrics.requests++;

        // Update average response time
        const currentAvg = this.metrics.averageResponseTime;
        const totalRequests = this.metrics.requests;
        this.metrics.averageResponseTime =
            ((currentAvg * (totalRequests - 1)) + duration) / totalRequests;

        // Log slow requests
        if (duration > 1000) {
            this.warn('Slow request detected', {
                method,
                path,
                duration,
                statusCode
            });
        }
    }

    /**
     * Track trade execution
     */
    trackTrade(trade) {
        this.metrics.trades++;

        this.info('Trade executed', {
            component: 'trading',
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            status: trade.status
        });
    }

    /**
     * Track AI decision
     */
    trackAIDecision(decision) {
        this.metrics.aiDecisions++;

        this.info('AI decision generated', {
            component: 'ai',
            symbol: decision.symbol,
            action: decision.action,
            confidence: decision.confidence
        });
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
    }

    /**
     * Start collecting metrics periodically
     */
    startMetricsCollection() {
        setInterval(async () => {
            const metrics = this.getMetrics();

            // Cache current metrics
            await cache.set('system:metrics', metrics, 60);

            // Log metrics summary
            this.debug('System metrics', metrics);

        }, 60000); // Every minute
    }

    /**
     * Get system health
     */
    async getSystemHealth() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            components: {}
        };

        try {
            // Check database
            await query('SELECT 1');
            health.components.database = { status: 'up' };
        } catch (error) {
            health.components.database = { status: 'down', error: error.message };
            health.status = 'degraded';
        }

        try {
            // Check Redis
            await cache.set('health:check', Date.now(), 5);
            health.components.redis = { status: 'up' };
        } catch (error) {
            health.components.redis = { status: 'down', error: error.message };
            health.status = 'degraded';
        }

        // Add metrics
        health.metrics = this.getMetrics();

        return health;
    }

    /**
     * Alert on critical errors
     */
    async sendAlert(level, message, details = {}) {
        this.error(`ALERT [${level}]: ${message}`, null, details);

        // In production, integrate with:
        // - PagerDuty
        // - Slack
        // - Email
        // - SMS

        console.log(`🚨 ALERT [${level}]: ${message}`);
    }

    /**
     * Monitor portfolio performance
     */
    async monitorPortfolios() {
        try {
            const portfolios = await query(`
        SELECT p.id, p.name, p.user_id, p.current_balance,
               COALESCE(SUM(pos.market_value), 0) as positions_value
        FROM portfolios p
        LEFT JOIN positions pos ON p.id = pos.portfolio_id
        WHERE p.is_active = true
        GROUP BY p.id
      `);

            for (const portfolio of portfolios) {
                const totalValue = parseFloat(portfolio.current_balance) +
                    parseFloat(portfolio.positions_value || 0);

                // Alert on significant losses
                if (totalValue < parseFloat(portfolio.initial_balance) * 0.9) {
                    await this.sendAlert('warning', 'Portfolio significant loss', {
                        portfolioId: portfolio.id,
                        userId: portfolio.user_id,
                        loss: ((totalValue / portfolio.initial_balance - 1) * 100).toFixed(2) + '%'
                    });
                }
            }
        } catch (error) {
            this.error('Portfolio monitoring failed', error);
        }
    }

    /**
     * Generate daily report
     */
    async generateDailyReport() {
        try {
            const today = new Date().toISOString().split('T')[0];

            const report = {
                date: today,
                trades: await query(
                    'SELECT COUNT(*) as count, SUM(total_amount) as volume FROM trades WHERE DATE(execution_time) = $1',
                    [today]
                ),
                newUsers: await query(
                    'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = $1',
                    [today]
                ),
                aiDecisions: await query(
                    'SELECT COUNT(*) as count FROM ai_decisions WHERE DATE(created_at) = $1',
                    [today]
                ),
                systemErrors: await query(
                    'SELECT COUNT(*) as count FROM system_logs WHERE level = \'error\' AND DATE(timestamp) = $1',
                    [today]
                ),
                metrics: this.getMetrics()
            };

            this.info('Daily report generated', report);

            // Store report
            await cache.set(`report:daily:${today}`, report, 86400 * 30); // Keep for 30 days

            return report;
        } catch (error) {
            this.error('Failed to generate daily report', error);
            throw error;
        }
    }

    /**
     * Get system logs
     */
    async getSystemLogs(filters = {}) {
        const { level, component, startDate, endDate, limit = 100 } = filters;

        let whereClauses = [];
        let params = [];
        let paramCount = 1;

        if (level) {
            whereClauses.push(`level = $${paramCount++}`);
            params.push(level);
        }

        if (component) {
            whereClauses.push(`component = $${paramCount++}`);
            params.push(component);
        }

        if (startDate) {
            whereClauses.push(`timestamp >= $${paramCount++}`);
            params.push(startDate);
        }

        if (endDate) {
            whereClauses.push(`timestamp <= $${paramCount++}`);
            params.push(endDate);
        }

        const whereClause = whereClauses.length > 0
            ? 'WHERE ' + whereClauses.join(' AND ')
            : '';

        params.push(limit);

        const logs = await query(
            `SELECT * FROM system_logs ${whereClause} ORDER BY timestamp DESC LIMIT $${paramCount}`,
            params
        );

        return logs;
    }
}

// Export singleton
module.exports = new MonitoringService();



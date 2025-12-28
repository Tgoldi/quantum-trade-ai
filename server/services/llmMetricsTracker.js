/**
 * LLM Metrics Tracker
 * Tracks real usage of Ollama models for accurate performance metrics
 */

const { cache } = require('../database/db');

class LLMMetricsTracker {
    constructor() {
        this.metricsPrefix = 'llm_metrics';
    }

    /**
     * Track a new AI request
     */
    async trackRequest(model, latency, success, error = null) {
        const timestamp = Date.now();
        const hour = new Date().getHours();
        
        try {
            // Increment total requests
            await cache.incr(`${this.metricsPrefix}:total_requests`);
            
            // Increment model-specific requests
            await cache.incr(`${this.metricsPrefix}:model:${model}:requests`);
            
            // Track success/failure
            if (success) {
                await cache.incr(`${this.metricsPrefix}:total_success`);
                await cache.incr(`${this.metricsPrefix}:model:${model}:success`);
            } else {
                await cache.incr(`${this.metricsPrefix}:total_errors`);
                await cache.incr(`${this.metricsPrefix}:model:${model}:errors`);
                
                // Store error details
                await cache.lpush(`${this.metricsPrefix}:errors`, JSON.stringify({
                    model,
                    error: error?.message || 'Unknown error',
                    timestamp
                }));
                await cache.ltrim(`${this.metricsPrefix}:errors`, 0, 99); // Keep last 100 errors
            }
            
            // Track latency (rolling average)
            await cache.lpush(`${this.metricsPrefix}:latencies`, latency);
            await cache.ltrim(`${this.metricsPrefix}:latencies`, 0, 999); // Keep last 1000
            
            await cache.lpush(`${this.metricsPrefix}:model:${model}:latencies`, latency);
            await cache.ltrim(`${this.metricsPrefix}:model:${model}:latencies`, 0, 99);
            
            // Track hourly requests
            await cache.incr(`${this.metricsPrefix}:hourly:${hour}`);
            await cache.expire(`${this.metricsPrefix}:hourly:${hour}`, 7200); // 2 hours TTL
            
            // Track daily requests
            const day = new Date().toISOString().split('T')[0];
            await cache.incr(`${this.metricsPrefix}:daily:${day}`);
            await cache.expire(`${this.metricsPrefix}:daily:${day}`, 604800); // 7 days TTL
            
        } catch (error) {
            console.error('Error tracking LLM metrics:', error);
        }
    }

    /**
     * Get comprehensive metrics
     */
    async getMetrics() {
        try {
            const totalRequests = parseInt(await cache.get(`${this.metricsPrefix}:total_requests`) || '0');
            const totalSuccess = parseInt(await cache.get(`${this.metricsPrefix}:total_success`) || '0');
            const totalErrors = parseInt(await cache.get(`${this.metricsPrefix}:total_errors`) || '0');
            
            // Calculate success rate
            const successRate = totalRequests > 0 ? totalSuccess / totalRequests : 1.0;
            
            // Calculate average latency
            const latencies = await cache.lrange(`${this.metricsPrefix}:latencies`, 0, -1);
            const avgLatency = latencies.length > 0
                ? latencies.reduce((sum, l) => sum + parseInt(l), 0) / latencies.length
                : 0;
            
            // Get last 24 hours data
            const day = new Date().toISOString().split('T')[0];
            const requestsToday = parseInt(await cache.get(`${this.metricsPrefix}:daily:${day}`) || '0');
            
            // Get top models by usage
            const modelStats = await this.getModelStats();
            const topModels = modelStats
                .sort((a, b) => b.requests - a.requests)
                .slice(0, 3)
                .map(m => m.name);
            
            return {
                totalRequests,
                successRate: parseFloat(successRate.toFixed(3)),
                avgLatency: Math.round(avgLatency),
                avgCost: 0.00, // Ollama is free!
                topModels,
                last24Hours: {
                    requests: requestsToday,
                    cost: 0.00,
                    errors: totalErrors
                },
                models: modelStats
            };
        } catch (error) {
            console.error('Error getting LLM metrics:', error);
            return {
                totalRequests: 0,
                successRate: 0,
                avgLatency: 0,
                avgCost: 0,
                topModels: [],
                last24Hours: { requests: 0, cost: 0, errors: 0 },
                models: []
            };
        }
    }

    /**
     * Get per-model statistics
     */
    async getModelStats() {
        const models = ['llama3.1:8b', 'mistral:7b', 'phi3:mini', 'codellama:13b'];
        const stats = [];
        
        for (const model of models) {
            const requests = parseInt(await cache.get(`${this.metricsPrefix}:model:${model}:requests`) || '0');
            const success = parseInt(await cache.get(`${this.metricsPrefix}:model:${model}:success`) || '0');
            const errors = parseInt(await cache.get(`${this.metricsPrefix}:model:${model}:errors`) || '0');
            
            const latencies = await cache.lrange(`${this.metricsPrefix}:model:${model}:latencies`, 0, -1);
            const avgLatency = latencies.length > 0
                ? latencies.reduce((sum, l) => sum + parseInt(l), 0) / latencies.length
                : 0;
            
            stats.push({
                name: model,
                requests,
                success,
                errors,
                successRate: requests > 0 ? success / requests : 1.0,
                avgLatency: Math.round(avgLatency)
            });
        }
        
        return stats;
    }

    /**
     * Reset all metrics (for testing/admin)
     */
    async resetMetrics() {
        const keys = await cache.keys(`${this.metricsPrefix}:*`);
        for (const key of keys) {
            await cache.del(key);
        }
        console.log('✅ LLM metrics reset');
    }
}

module.exports = new LLMMetricsTracker();




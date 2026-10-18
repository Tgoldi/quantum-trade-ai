// Database Connection Manager
const { Pool } = require('pg');
const Redis = require('redis');

// PostgreSQL Connection Pool (Supabase)
// Legacy fallback host kept so existing deployments that never set DB_HOST keep working.
// Set DB_HOST explicitly; a warning is emitted whenever this fallback is used.
const LEGACY_DEFAULT_DB_HOST = 'db.ngwbwanpamfqoaitofih.supabase.co';
if (!process.env.DB_HOST) {
    console.warn('⚠️ DB_HOST is not set; falling back to legacy default host. Set DB_HOST explicitly.');
}
if (process.env.DB_SSL !== 'true' && process.env.DB_SSL !== 'false') {
    console.warn('⚠️ DB_SSL is not set; database connection is unencrypted. Set DB_SSL=true to enable TLS.');
}

const pgPool = new Pool({
    host: process.env.DB_HOST || LEGACY_DEFAULT_DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
});

// Redis Client for caching
const redisClient = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Connection event handlers
pgPool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});

pgPool.on('error', (err) => {
    console.error('❌ PostgreSQL error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

// Database query helper with caching
async function query(text, params, cacheKey = null, cacheTTL = 60) {
    // Try cache first if cacheKey provided
    if (cacheKey && redisClient.connected) {
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                console.log(`📦 Cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.warn('Cache read error:', err);
        }
    }

    // Execute query
    const start = Date.now();
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.DB_DEBUG === 'true') {
        console.log('📊 Executed query', { duration, rows: res.rowCount });
    }

    // Cache result if requested
    if (cacheKey && redisClient.connected && res.rows) {
        try {
            await redisClient.setex(cacheKey, cacheTTL, JSON.stringify(res.rows));
        } catch (err) {
            console.warn('Cache write error:', err);
        }
    }

    return res.rows;
}

// Transaction helper
async function transaction(callback) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Cache helpers
const cache = {
    async get(key) {
        if (!redisClient.connected) return null;
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    },

    async set(key, value, ttl = 60) {
        if (!redisClient.connected) return;
        await redisClient.setex(key, ttl, JSON.stringify(value));
    },

    async del(key) {
        if (!redisClient.connected) return;
        await redisClient.del(key);
    },

    async flush() {
        if (!redisClient.connected) return;
        await redisClient.flushdb();
    },

    // Redis increment operations for metrics tracking
    async incr(key) {
        if (!redisClient.connected) return 0;
        return await redisClient.incr(key);
    },

    // Redis list operations for metrics tracking
    async lpush(key, value) {
        if (!redisClient.connected) return 0;
        return await redisClient.lpush(key, value);
    },

    async lrange(key, start, stop) {
        if (!redisClient.connected) return [];
        return await redisClient.lrange(key, start, stop);
    },

    async ltrim(key, start, stop) {
        if (!redisClient.connected) return;
        await redisClient.ltrim(key, start, stop);
    },

    async keys(pattern) {
        if (!redisClient.connected) return [];
        return await redisClient.keys(pattern);
    },

    async expire(key, seconds) {
        if (!redisClient.connected) return;
        await redisClient.expire(key, seconds);
    },

    // Subscribe to real-time updates
    async subscribe(channel, callback) {
        const subscriber = redisClient.duplicate();
        await subscriber.subscribe(channel);
        subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                callback(JSON.parse(message));
            }
        });
        return subscriber;
    },

    // Publish real-time updates
    async publish(channel, data) {
        if (!redisClient.connected) return;
        await redisClient.publish(channel, JSON.stringify(data));
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, closing database connections');
    await pgPool.end();
    await redisClient.quit();
});

module.exports = {
    query,
    transaction,
    cache,
    pgPool,
    redisClient
};



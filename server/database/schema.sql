-- QuantumTrade AI - Database Schema
-- PostgreSQL Database for Trading Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- ============================================
-- PORTFOLIOS
-- ============================================

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- paper, live
    broker VARCHAR(100), -- alpaca, interactive_brokers, etc
    broker_account_id VARCHAR(255),
    initial_balance DECIMAL(20, 2) NOT NULL,
    current_balance DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_portfolios_type ON portfolios(type);

-- ============================================
-- POSITIONS (Current Holdings)
-- ============================================

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(50), -- stock, crypto, option, futures
    quantity DECIMAL(20, 8) NOT NULL,
    average_cost DECIMAL(20, 4) NOT NULL,
    current_price DECIMAL(20, 4),
    market_value DECIMAL(20, 2),
    unrealized_pnl DECIMAL(20, 2),
    unrealized_pnl_percent DECIMAL(10, 4),
    opened_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);

-- ============================================
-- TRADES (Historical Executions)
-- ============================================

CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- buy, sell
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 4) NOT NULL,
    commission DECIMAL(20, 4) DEFAULT 0,
    total_amount DECIMAL(20, 2) NOT NULL,
    order_type VARCHAR(50), -- market, limit, stop, stop_limit
    strategy VARCHAR(100), -- ai_decision, manual, algorithmic
    execution_time TIMESTAMP NOT NULL,
    broker_order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'filled', -- filled, partial, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, execution_time)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('trades', 'execution_time');

CREATE INDEX idx_trades_portfolio ON trades(portfolio_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_execution ON trades(execution_time DESC);

-- ============================================
-- AI DECISIONS
-- ============================================

CREATE TABLE ai_decisions (
    id UUID DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    decision VARCHAR(50) NOT NULL, -- strong_buy, buy, hold, sell, strong_sell
    confidence_score DECIMAL(5, 4) NOT NULL,
    consensus_score DECIMAL(5, 4),
    reasoning TEXT NOT NULL,
    target_price DECIMAL(20, 4),
    stop_loss DECIMAL(20, 4),
    expected_return DECIMAL(10, 4),
    risk_score DECIMAL(5, 4),
    model_version VARCHAR(50),
    model_weights JSONB,
    executed BOOLEAN DEFAULT false,
    execution_result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('ai_decisions', 'created_at');

CREATE INDEX idx_ai_decisions_portfolio ON ai_decisions(portfolio_id);
CREATE INDEX idx_ai_decisions_symbol ON ai_decisions(symbol);
CREATE INDEX idx_ai_decisions_executed ON ai_decisions(executed);

-- ============================================
-- MARKET DATA (Time Series)
-- ============================================

CREATE TABLE market_data (
    time TIMESTAMP NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    open DECIMAL(20, 4),
    high DECIMAL(20, 4),
    low DECIMAL(20, 4),
    close DECIMAL(20, 4),
    volume BIGINT,
    vwap DECIMAL(20, 4),
    trade_count INTEGER,
    timeframe VARCHAR(10), -- 1m, 5m, 15m, 1h, 1d
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (symbol, time)
);

SELECT create_hypertable('market_data', 'time');

CREATE INDEX idx_market_data_symbol ON market_data(symbol, time DESC);
CREATE INDEX idx_market_data_timeframe ON market_data(timeframe, time DESC);

-- ============================================
-- ALERTS & NOTIFICATIONS
-- ============================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- price, technical, ai, risk
    symbol VARCHAR(20),
    condition JSONB NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    channels VARCHAR(100)[], -- push, email, sms, telegram
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at);

-- ============================================
-- BACKTESTING RESULTS
-- ============================================

CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    strategy_config JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(20, 2) NOT NULL,
    final_capital DECIMAL(20, 2) NOT NULL,
    total_return DECIMAL(10, 4) NOT NULL,
    sharpe_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    win_rate DECIMAL(5, 4),
    total_trades INTEGER,
    avg_trade_return DECIMAL(10, 4),
    trade_details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_backtest_user ON backtest_results(user_id);
CREATE INDEX idx_backtest_created ON backtest_results(created_at DESC);

-- ============================================
-- SENTIMENT DATA
-- ============================================

CREATE TABLE sentiment_data (
    id UUID DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    source VARCHAR(100) NOT NULL, -- news, twitter, reddit, insider
    sentiment_score DECIMAL(5, 4) NOT NULL, -- -1 to 1
    confidence DECIMAL(5, 4),
    raw_text TEXT,
    processed_text TEXT,
    entities JSONB,
    keywords VARCHAR(100)[],
    url TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP NOT NULL,
    collected_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, published_at)
);

SELECT create_hypertable('sentiment_data', 'published_at');

CREATE INDEX idx_sentiment_symbol ON sentiment_data(symbol, published_at DESC);
CREATE INDEX idx_sentiment_source ON sentiment_data(source);

-- ============================================
-- RISK METRICS
-- ============================================

CREATE TABLE risk_metrics (
    id UUID DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    calculated_at TIMESTAMP NOT NULL,
    var_95 DECIMAL(20, 2), -- Value at Risk 95%
    var_99 DECIMAL(20, 2), -- Value at Risk 99%
    expected_shortfall DECIMAL(20, 2),
    beta DECIMAL(10, 4),
    alpha DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    sortino_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    volatility DECIMAL(10, 4),
    correlation_matrix JSONB,
    exposure_breakdown JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, calculated_at)
);

SELECT create_hypertable('risk_metrics', 'calculated_at');

CREATE INDEX idx_risk_metrics_portfolio ON risk_metrics(portfolio_id, calculated_at DESC);

-- ============================================
-- PERFORMANCE METRICS
-- ============================================

CREATE TABLE performance_metrics (
    id UUID DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    portfolio_value DECIMAL(20, 2) NOT NULL,
    daily_return DECIMAL(10, 4),
    cumulative_return DECIMAL(10, 4),
    benchmark_return DECIMAL(10, 4),
    alpha DECIMAL(10, 4),
    drawdown DECIMAL(10, 4),
    win_rate DECIMAL(5, 4),
    avg_win DECIMAL(20, 2),
    avg_loss DECIMAL(20, 2),
    profit_factor DECIMAL(10, 4),
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, date),
    UNIQUE(portfolio_id, date)
);

SELECT create_hypertable('performance_metrics', 'date');

CREATE INDEX idx_performance_portfolio ON performance_metrics(portfolio_id, date DESC);

-- ============================================
-- SYSTEM LOGS
-- ============================================

CREATE TABLE system_logs (
    id UUID DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    level VARCHAR(20) NOT NULL, -- debug, info, warning, error, critical
    component VARCHAR(100), -- api, ai_engine, risk_manager, etc
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    error_stack TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, timestamp)
);

SELECT create_hypertable('system_logs', 'timestamp');

CREATE INDEX idx_logs_level ON system_logs(level, timestamp DESC);
CREATE INDEX idx_logs_component ON system_logs(component, timestamp DESC);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Portfolio Summary View
CREATE VIEW portfolio_summary AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.type,
    p.current_balance,
    COUNT(pos.id) as position_count,
    SUM(pos.market_value) as total_position_value,
    SUM(pos.unrealized_pnl) as total_unrealized_pnl,
    (p.current_balance + COALESCE(SUM(pos.market_value), 0)) as total_portfolio_value
FROM portfolios p
LEFT JOIN positions pos ON p.id = pos.portfolio_id
GROUP BY p.id;

-- Trade Statistics View
CREATE VIEW trade_statistics AS
SELECT 
    portfolio_id,
    COUNT(*) as total_trades,
    SUM(CASE WHEN side = 'buy' THEN quantity ELSE 0 END) as total_bought,
    SUM(CASE WHEN side = 'sell' THEN quantity ELSE 0 END) as total_sold,
    AVG(price) as avg_price,
    SUM(commission) as total_commission,
    DATE(execution_time) as trade_date
FROM trades
GROUP BY portfolio_id, DATE(execution_time);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate position metrics on update
CREATE OR REPLACE FUNCTION calculate_position_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_price IS NOT NULL THEN
        NEW.market_value = NEW.quantity * NEW.current_price;
        NEW.unrealized_pnl = NEW.market_value - (NEW.quantity * NEW.average_cost);
        NEW.unrealized_pnl_percent = (NEW.unrealized_pnl / (NEW.quantity * NEW.average_cost)) * 100;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_position_metrics BEFORE INSERT OR UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION calculate_position_metrics();

-- ============================================
-- SEED DATA (Development)
-- ============================================

-- Create demo user
INSERT INTO users (email, username, password_hash, first_name, last_name, subscription_tier)
VALUES ('demo@quantumtrade.ai', 'demo', '$2b$10$demo_hash', 'Demo', 'User', 'pro')
ON CONFLICT (email) DO NOTHING;

-- Create demo portfolios
INSERT INTO portfolios (user_id, name, type, initial_balance, current_balance)
SELECT id, 'Paper Trading', 'paper', 100000.00, 100000.00
FROM users WHERE email = 'demo@quantumtrade.ai'
ON CONFLICT DO NOTHING;

INSERT INTO portfolios (user_id, name, type, initial_balance, current_balance, broker)
SELECT id, 'Live Trading - Alpaca', 'live', 10000.00, 10000.00, 'alpaca'
FROM users WHERE email = 'demo@quantumtrade.ai'
ON CONFLICT DO NOTHING;

COMMIT;


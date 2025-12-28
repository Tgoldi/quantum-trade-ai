    -- Supabase Database Schema for QuantumTrade AI
    -- This replaces the PostgreSQL schema with Supabase-optimized version

    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Users table (extends Supabase auth.users)
    CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
    );

    -- Portfolios table
    CREATE TABLE public.portfolios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'paper' CHECK (type IN ('paper', 'live')),
    current_balance DECIMAL(15,2) DEFAULT 100000.00,
    initial_balance DECIMAL(15,2) DEFAULT 100000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Positions table
    CREATE TABLE public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    average_cost DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    market_value DECIMAL(15,2),
    unrealized_pnl DECIMAL(15,2),
    unrealized_pnl_percent DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
    );

    -- Trades table
    CREATE TABLE public.trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(15,4) NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    price DECIMAL(10,2),
    filled_price DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
    filled_quantity DECIMAL(15,4) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(15,2),
    execution_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- AI Decisions table
    CREATE TABLE public.ai_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('buy', 'sell', 'hold')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    model_name TEXT,
    input_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Market Data table (TimescaleDB for time-series)
    CREATE TABLE public.market_data (
    symbol TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(10,2),
    high DECIMAL(10,2),
    low DECIMAL(10,2),
    close DECIMAL(10,2),
    volume BIGINT,
    PRIMARY KEY (symbol, timestamp)
    );

    -- Convert to hypertable for TimescaleDB (if extension is available)
    -- SELECT create_hypertable('market_data', 'timestamp');

    -- Risk Metrics table
    CREATE TABLE public.risk_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    var_95 DECIMAL(15,2),
    var_99 DECIMAL(15,2),
    sharpe_ratio DECIMAL(5,2),
    max_drawdown DECIMAL(5,2),
    beta DECIMAL(5,2),
    alpha DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Backtest Results table
    CREATE TABLE public.backtest_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    strategy_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(15,2) NOT NULL,
    final_capital DECIMAL(15,2) NOT NULL,
    total_return DECIMAL(5,2) NOT NULL,
    annualized_return DECIMAL(5,2),
    sharpe_ratio DECIMAL(5,2),
    max_drawdown DECIMAL(5,2),
    win_rate DECIMAL(5,2),
    total_trades INTEGER,
    parameters JSONB,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Alerts table
    CREATE TABLE public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('price', 'volume', 'technical', 'news')),
    condition TEXT NOT NULL,
    threshold_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Performance Metrics table
    CREATE TABLE public.performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Sentiment Data table
    CREATE TABLE public.sentiment_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('news', 'social', 'insider', 'options')),
    sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    raw_data JSONB,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- System Logs table
    CREATE TABLE public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Row Level Security (RLS) Policies

    -- Enable RLS on all tables
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.risk_metrics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

    -- Users policies
    CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

    -- Portfolios policies
    CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

    -- Positions policies
    CREATE POLICY "Users can view own positions" ON public.positions
    FOR SELECT USING (
        EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = positions.portfolio_id 
        AND portfolios.user_id = auth.uid()
        )
    );

    CREATE POLICY "Users can manage own positions" ON public.positions
    FOR ALL USING (
        EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = positions.portfolio_id 
        AND portfolios.user_id = auth.uid()
        )
    );

    -- Trades policies
    CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

    -- AI Decisions policies
    CREATE POLICY "Users can view own AI decisions" ON public.ai_decisions
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own AI decisions" ON public.ai_decisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Risk Metrics policies
    CREATE POLICY "Users can view own risk metrics" ON public.risk_metrics
    FOR SELECT USING (
        EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = risk_metrics.portfolio_id 
        AND portfolios.user_id = auth.uid()
        )
    );

    -- Backtest Results policies
    CREATE POLICY "Users can view own backtest results" ON public.backtest_results
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own backtest results" ON public.backtest_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Alerts policies
    CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

    -- Performance Metrics policies
    CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
    FOR SELECT USING (
        EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = performance_metrics.portfolio_id 
        AND portfolios.user_id = auth.uid()
        )
    );

    -- Functions and Triggers

    -- Function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Triggers for updated_at
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Function to create default portfolio for new users
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
    INSERT INTO public.portfolios (user_id, name, type, current_balance, initial_balance)
    VALUES (NEW.id, 'Paper Trading', 'paper', 100000.00, 100000.00);
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to create default portfolio
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- Indexes for performance
    CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
    CREATE INDEX idx_positions_portfolio_id ON public.positions(portfolio_id);
    CREATE INDEX idx_trades_user_id ON public.trades(user_id);
    CREATE INDEX idx_trades_portfolio_id ON public.trades(portfolio_id);
    CREATE INDEX idx_ai_decisions_user_id ON public.ai_decisions(user_id);
    CREATE INDEX idx_market_data_symbol_timestamp ON public.market_data(symbol, timestamp);
    CREATE INDEX idx_risk_metrics_portfolio_id ON public.risk_metrics(portfolio_id);
    CREATE INDEX idx_backtest_results_user_id ON public.backtest_results(user_id);
    CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
    CREATE INDEX idx_performance_metrics_portfolio_id ON public.performance_metrics(portfolio_id);
    CREATE INDEX idx_sentiment_data_symbol ON public.sentiment_data(symbol);
    CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at);

    -- Sample data (optional)
    INSERT INTO public.users (id, email, username, first_name, last_name, subscription_tier)
    VALUES 
    (uuid_generate_v4(), 'demo@quantumtrade.ai', 'demo', 'Demo', 'User', 'free')
    ON CONFLICT (email) DO NOTHING;


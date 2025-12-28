// Supabase Service - Replaces backendService with Supabase
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ngwbwanpamfqoaitofih.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

class SupabaseService {
    constructor() {
        this.supabase = supabase
    }

    // Authentication methods
    async register(userData) {
        const { data, error } = await this.supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    username: userData.username
                }
            }
        })

        if (error) throw error

        // Create user profile
        if (data.user) {
            const { error: profileError } = await this.supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: userData.email,
                    username: userData.username,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    subscription_tier: 'free',
                    is_active: true
                })

            if (profileError) throw profileError

            // Create default portfolio
            const { error: portfolioError } = await this.supabase
                .from('portfolios')
                .insert({
                    user_id: data.user.id,
                    name: 'Paper Trading',
                    type: 'paper',
                    current_balance: 100000,
                    initial_balance: 100000
                })

            if (portfolioError) throw portfolioError
        }

        return {
            user: data.user,
            tokens: {
                accessToken: data.session?.access_token,
                refreshToken: data.session?.refresh_token
            }
        }
    }

    async login(credentials) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: credentials.emailOrUsername,
            password: credentials.password
        })

        if (error) throw error

        // Get user profile
        const { data: profile } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

        // Get portfolios
        const { data: portfolios } = await this.supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', data.user.id)

        return {
            user: { ...data.user, ...profile },
            portfolios: portfolios || [],
            tokens: {
                accessToken: data.session?.access_token,
                refreshToken: data.session?.refresh_token
            }
        }
    }

    async logout() {
        const { error } = await this.supabase.auth.signOut()
        if (error) throw error
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        const { data: profile } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

        return { ...user, ...profile }
    }

    // Portfolio methods
    async getPortfolios() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await this.supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', user.id)

        if (error) throw error
        return data
    }

    async getPortfolioSummary() {
        return await this.getPortfolios()
    }

    async getPositions(portfolioId) {
        const { data, error } = await this.supabase
            .from('positions')
            .select('*')
            .eq('portfolio_id', portfolioId)

        if (error) throw error
        return data
    }

    // Market data methods
    async getMarketData(symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT']) {
        // For now, return mock data since we don't have a market data API
        const prices = {}
        symbols.forEach(symbol => {
            prices[symbol] = {
                symbol,
                price: Math.random() * 200 + 50, // Mock price
                change: (Math.random() - 0.5) * 10,
                changePercent: (Math.random() - 0.5) * 5
            }
        })
        return prices
    }

    async getMarketMovers() {
        // Mock data for now
        return {
            gainers: [],
            losers: [],
            mostActive: []
        }
    }

    // Trading methods
    async placeOrder(orderData) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await this.supabase
            .from('trades')
            .insert({
                portfolio_id: orderData.portfolioId,
                symbol: orderData.symbol,
                side: orderData.side,
                quantity: orderData.quantity,
                order_type: orderData.orderType,
                price: orderData.price || null,
                status: 'pending',
                user_id: user.id
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    // AI Decision methods
    async getAIDecision(symbol) {
        // Mock AI decision
        return {
            symbol,
            action: Math.random() > 0.5 ? 'buy' : 'sell',
            confidence: Math.random() * 0.4 + 0.6, // 60-100%
            reasoning: 'AI analysis suggests market conditions favor this action',
            timestamp: new Date().toISOString()
        }
    }

    async getAIDecisions() {
        const symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL']
        const decisions = await Promise.all(
            symbols.map(symbol => this.getAIDecision(symbol))
        )
        return decisions
    }

    // Real-time subscriptions
    subscribeToPortfolio(portfolioId, callback) {
        return this.supabase
            .channel('portfolio-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'portfolios',
                filter: `id=eq.${portfolioId}`
            }, callback)
            .subscribe()
    }

    subscribeToTrades(portfolioId, callback) {
        return this.supabase
            .channel('trade-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'trades',
                filter: `portfolio_id=eq.${portfolioId}`
            }, callback)
            .subscribe()
    }

    // Token management (for compatibility with existing auth context)
    getAuthToken() {
        return localStorage.getItem('supabase.auth.token')
    }

    setAuthToken(token) {
        localStorage.setItem('supabase.auth.token', token)
    }

    clearAuthToken() {
        localStorage.removeItem('supabase.auth.token')
    }

    // Health check
    async healthCheck() {
        const { data, error } = await this.supabase
            .from('users')
            .select('count')
            .limit(1)

        if (error) throw error
        return { status: 'ok', timestamp: new Date().toISOString() }
    }
}

// Create and export singleton instance
const supabaseService = new SupabaseService()
export default supabaseService

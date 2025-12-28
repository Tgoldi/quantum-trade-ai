// Authentication & Authorization Service
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction, cache } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'quantum-trade-secret-change-in-production';
        this.jwtExpiration = '7d';
        this.refreshTokenExpiration = '30d';
    }

    /**
     * Register new user
     */
    async register(userData) {
        const { email, username, password, firstName, lastName } = userData;

        // Validate input
        if (!email || !username || !password) {
            throw new Error('Email, username, and password are required');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        // Check if user exists
        const [existingUser] = await query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        return await transaction(async (client) => {
            const userId = uuidv4();

            await client.query(
                `INSERT INTO users (id, email, username, password_hash, first_name, last_name, subscription_tier)
         VALUES ($1, $2, $3, $4, $5, $6, 'free')`,
                [userId, email, username, passwordHash, firstName || null, lastName || null]
            );

            // Create default paper trading portfolio
            const portfolioId = uuidv4();
            await client.query(
                `INSERT INTO portfolios (id, user_id, name, type, initial_balance, current_balance)
         VALUES ($1, $2, 'Paper Trading', 'paper', 100000, 100000)`,
                [portfolioId, userId]
            );

            // Generate tokens
            const tokens = this.generateTokens(userId, email, username);

            // Cache session
            await cache.set(`session:${userId}`, {
                userId,
                email,
                username,
                loginTime: Date.now()
            }, 60 * 60 * 24 * 7); // 7 days

            return {
                user: {
                    id: userId,
                    email,
                    username,
                    firstName,
                    lastName,
                    subscriptionTier: 'free'
                },
                portfolio: {
                    id: portfolioId,
                    name: 'Paper Trading',
                    type: 'paper',
                    balance: 100000
                },
                tokens
            };
        });
    }

    /**
     * Login user
     */
    async login(credentials) {
        const { emailOrUsername, password } = credentials;

        if (!emailOrUsername || !password) {
            throw new Error('Email/username and password are required');
        }

        // Find user
        const [user] = await query(
            'SELECT * FROM users WHERE email = $1 OR username = $1',
            [emailOrUsername]
        );

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.is_active) {
            throw new Error('Account is disabled');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Get user's portfolios
        const portfolios = await query(
            'SELECT id, name, type, current_balance, broker FROM portfolios WHERE user_id = $1 AND is_active = true',
            [user.id]
        );

        // Generate tokens
        const tokens = this.generateTokens(user.id, user.email, user.username);

        // Cache session
        await cache.set(`session:${user.id}`, {
            userId: user.id,
            email: user.email,
            username: user.username,
            loginTime: Date.now()
        }, 60 * 60 * 24 * 7);

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                subscriptionTier: user.subscription_tier,
                lastLogin: user.last_login
            },
            portfolios: portfolios.map(p => ({
                id: p.id,
                name: p.name,
                type: p.type,
                balance: parseFloat(p.current_balance),
                broker: p.broker
            })),
            tokens
        };
    }

    /**
     * Logout user
     */
    async logout(userId) {
        // Remove from cache
        await cache.del(`session:${userId}`);

        // Invalidate all tokens for this user
        await cache.set(`tokens:invalidated:${userId}`, Date.now(), 60 * 60 * 24 * 30);

        return { success: true };
    }

    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);

            // Check if token is invalidated
            const invalidated = await cache.get(`tokens:invalidated:${decoded.userId}`);
            if (invalidated && invalidated > decoded.iat * 1000) {
                throw new Error('Token has been invalidated');
            }

            // Check session cache
            const session = await cache.get(`session:${decoded.userId}`);
            if (!session) {
                // Session expired, but token still valid - refresh session
                await cache.set(`session:${decoded.userId}`, {
                    userId: decoded.userId,
                    email: decoded.email,
                    username: decoded.username
                }, 60 * 60 * 24 * 7);
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, this.jwtSecret);

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }

            // Check if user still exists and is active
            const [user] = await query(
                'SELECT id, email, username, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (!user || !user.is_active) {
                throw new Error('User not found or inactive');
            }

            // Generate new access token
            const tokens = this.generateTokens(user.id, user.email, user.username);

            return tokens;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Generate JWT tokens
     */
    generateTokens(userId, email, username) {
        const accessToken = jwt.sign(
            {
                userId,
                email,
                username,
                type: 'access'
            },
            this.jwtSecret,
            { expiresIn: this.jwtExpiration }
        );

        const refreshToken = jwt.sign(
            {
                userId,
                email,
                username,
                type: 'refresh'
            },
            this.jwtSecret,
            { expiresIn: this.refreshTokenExpiration }
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        };
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters');
        }

        const [user] = await query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newPasswordHash, userId]
        );

        // Invalidate all existing tokens
        await cache.set(`tokens:invalidated:${userId}`, Date.now(), 60 * 60 * 24 * 30);

        return { success: true };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        const allowedFields = ['first_name', 'last_name', 'settings'];
        const fields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(key === 'settings' ? JSON.stringify(value) : value);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        fields.push(`updated_at = NOW()`);
        values.push(userId);

        const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`;
        await query(updateQuery, values);

        // Invalidate user cache
        await cache.del(`user:${userId}`);

        return { success: true };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const cacheKey = `user:${userId}`;
        let user = await cache.get(cacheKey);

        if (user) {
            return user;
        }

        const [dbUser] = await query(
            'SELECT id, email, username, first_name, last_name, subscription_tier, created_at, last_login, settings FROM users WHERE id = $1',
            [userId]
        );

        if (!dbUser) {
            throw new Error('User not found');
        }

        user = {
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            subscriptionTier: dbUser.subscription_tier,
            createdAt: dbUser.created_at,
            lastLogin: dbUser.last_login,
            settings: dbUser.settings
        };

        await cache.set(cacheKey, user, 60 * 30); // 30 minutes
        return user;
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        const [user] = await query(
            'SELECT id, username FROM users WHERE email = $1',
            [email]
        );

        if (!user) {
            // Don't reveal if user exists
            return { success: true };
        }

        // Generate reset token
        const resetToken = uuidv4();
        await cache.set(`reset:${resetToken}`, {
            userId: user.id,
            email,
            timestamp: Date.now()
        }, 60 * 60); // 1 hour

        // In production, send email with reset link
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

        return { success: true, token: resetToken }; // Remove token from response in production
    }

    /**
     * Reset password with token
     */
    async resetPassword(resetToken, newPassword) {
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        const resetData = await cache.get(`reset:${resetToken}`);
        if (!resetData) {
            throw new Error('Invalid or expired reset token');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, resetData.userId]
        );

        // Delete reset token
        await cache.del(`reset:${resetToken}`);

        // Invalidate all existing tokens
        await cache.set(`tokens:invalidated:${resetData.userId}`, Date.now(), 60 * 60 * 24 * 30);

        return { success: true };
    }

    /**
     * Verify email (for future implementation)
     */
    async verifyEmail(verificationToken) {
        const verificationData = await cache.get(`verify:${verificationToken}`);

        if (!verificationData) {
            throw new Error('Invalid or expired verification token');
        }

        await query(
            'UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1',
            [verificationData.userId]
        );

        await cache.del(`verify:${verificationToken}`);

        return { success: true };
    }
}

module.exports = new AuthService();



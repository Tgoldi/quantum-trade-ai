// Authentication Service Tests
const authService = require('../auth/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction, cache } = require('../database/db');

jest.mock('../database/db');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            query.mockResolvedValueOnce([]); // No existing user
            bcrypt.hash.mockResolvedValue('hashed_password');
            jwt.sign.mockReturnValue('mock_token');
            cache.set.mockResolvedValue(true);

            transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn()
                        .mockResolvedValueOnce([]) // Insert user
                        .mockResolvedValueOnce([]) // Create portfolio
                };
                return await callback(mockClient);
            });

            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            const result = await authService.register(userData);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('portfolio');
            expect(result).toHaveProperty('tokens');
            expect(result.user.email).toBe(userData.email);
        });

        it('should reject registration with existing email', async () => {
            query.mockResolvedValueOnce([{ id: 'existing-user' }]);

            const userData = {
                email: 'existing@example.com',
                username: 'testuser',
                password: 'password123'
            };

            await expect(authService.register(userData)).rejects.toThrow(
                'User with this email or username already exists'
            );
        });

        it('should reject registration with short password', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'short'
            };

            await expect(authService.register(userData)).rejects.toThrow(
                'Password must be at least 8 characters'
            );
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                password_hash: 'hashed_password',
                is_active: true,
                first_name: 'Test',
                last_name: 'User',
                subscription_tier: 'free'
            };

            query
                .mockResolvedValueOnce([mockUser]) // Find user
                .mockResolvedValueOnce([]) // Update last login
                .mockResolvedValueOnce([{ id: 'portfolio-123', name: 'Paper Trading' }]); // Get portfolios

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock_token');
            cache.set.mockResolvedValue(true);

            const result = await authService.login({
                emailOrUsername: 'test@example.com',
                password: 'password123'
            });

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('portfolios');
            expect(result).toHaveProperty('tokens');
            expect(result.user.email).toBe(mockUser.email);
        });

        it('should reject login with invalid credentials', async () => {
            query.mockResolvedValueOnce([]);

            await expect(authService.login({
                emailOrUsername: 'wrong@example.com',
                password: 'password123'
            })).rejects.toThrow('Invalid credentials');
        });

        it('should reject login with wrong password', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password_hash: 'hashed_password',
                is_active: true
            };

            query.mockResolvedValueOnce([mockUser]);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.login({
                emailOrUsername: 'test@example.com',
                password: 'wrongpassword'
            })).rejects.toThrow('Invalid credentials');
        });

        it('should reject login for inactive account', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password_hash: 'hashed_password',
                is_active: false
            };

            query.mockResolvedValueOnce([mockUser]);

            await expect(authService.login({
                emailOrUsername: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Account is disabled');
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token', async () => {
            const mockDecoded = {
                userId: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                iat: Date.now() / 1000
            };

            jwt.verify.mockReturnValue(mockDecoded);
            cache.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ userId: 'user-123' });

            const result = await authService.verifyToken('valid_token');

            expect(result).toEqual(mockDecoded);
        });

        it('should reject invalid token', async () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(authService.verifyToken('invalid_token')).rejects.toThrow(
                'Invalid or expired token'
            );
        });

        it('should reject invalidated token', async () => {
            const mockDecoded = {
                userId: 'user-123',
                iat: Date.now() / 1000 - 1000
            };

            jwt.verify.mockReturnValue(mockDecoded);
            cache.get.mockResolvedValue(Date.now());

            await expect(authService.verifyToken('invalidated_token')).rejects.toThrow(
                'Invalid or expired token'
            );
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const mockUser = {
                password_hash: 'old_hashed_password'
            };

            query
                .mockResolvedValueOnce([mockUser])
                .mockResolvedValueOnce([]);

            bcrypt.compare.mockResolvedValue(true);
            bcrypt.hash.mockResolvedValue('new_hashed_password');
            cache.set.mockResolvedValue(true);

            const result = await authService.changePassword(
                'user-123',
                'oldpassword',
                'newpassword123'
            );

            expect(result.success).toBe(true);
        });

        it('should reject password change with wrong current password', async () => {
            const mockUser = {
                password_hash: 'hashed_password'
            };

            query.mockResolvedValueOnce([mockUser]);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.changePassword(
                'user-123',
                'wrongpassword',
                'newpassword123'
            )).rejects.toThrow('Current password is incorrect');
        });
    });
});

module.exports = {};



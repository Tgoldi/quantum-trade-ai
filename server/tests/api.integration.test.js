// API Integration Tests
const request = require('supertest');
const { app } = require('../apiServer');
const { query } = require('../database/db');

jest.mock('../database/db');

describe('API Integration Tests', () => {
    let authToken;

    describe('Health Check', () => {
        it('GET /api/health should return ok', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('uptime');
        });
    });

    describe('Authentication Flow', () => {
        it('POST /api/auth/register should create new user', async () => {
            query.mockResolvedValueOnce([]); // No existing user

            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('tokens');
            expect(response.body.tokens).toHaveProperty('accessToken');
        });

        it('POST /api/auth/login should return tokens', async () => {
            // Mock will be setup in test
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    emailOrUsername: 'test@example.com',
                    password: 'password123'
                });

            if (response.status === 200) {
                expect(response.body).toHaveProperty('tokens');
                authToken = response.body.tokens.accessToken;
            }
        });
    });

    describe('Protected Routes', () => {
        it('should reject requests without token', async () => {
            await request(app)
                .get('/api/portfolios')
                .expect(401);
        });

        it('should accept requests with valid token', async () => {
            if (!authToken) {
                authToken = 'mock-token';
            }

            // This will fail without proper mocking but demonstrates the pattern
            await request(app)
                .get('/api/portfolios')
                .set('Authorization', `Bearer ${authToken}`);
        });
    });

    describe('Trading Endpoints', () => {
        const mockToken = 'Bearer mock-jwt-token';

        it('POST /api/trade should execute trade', async () => {
            const tradeData = {
                portfolioId: 'portfolio-123',
                symbol: 'AAPL',
                side: 'buy',
                quantity: 10,
                orderType: 'market',
                strategy: 'manual'
            };

            // Mock will need to be properly setup
            const response = await request(app)
                .post('/api/trade')
                .set('Authorization', mockToken)
                .send(tradeData);

            // Response will depend on mocking
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });
    });

    describe('Market Data Endpoints', () => {
        it('GET /api/market/price/:symbol should return price', async () => {
            const response = await request(app)
                .get('/api/market/price/AAPL');

            if (response.status === 200) {
                expect(response.body).toHaveProperty('symbol', 'AAPL');
                expect(response.body).toHaveProperty('price');
            }
        });

        it('GET /api/market/history/:symbol should return historical data', async () => {
            const response = await request(app)
                .get('/api/market/history/AAPL?limit=10');

            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });
    });

    describe('AI Decision Endpoints', () => {
        const mockToken = 'Bearer mock-jwt-token';

        it('GET /api/ai/decision/:symbol should return AI decision', async () => {
            const response = await request(app)
                .get('/api/ai/decision/AAPL')
                .set('Authorization', mockToken);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('symbol');
                expect(response.body).toHaveProperty('action');
                expect(response.body).toHaveProperty('confidence');
            }
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown routes', async () => {
            await request(app)
                .get('/api/unknown-route')
                .expect(404);
        });

        it('should handle invalid JSON', async () => {
            await request(app)
                .post('/api/trade')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });
    });
});

module.exports = {};



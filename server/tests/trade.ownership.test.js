// POST /api/trade only trades in a portfolio the signed-in user owns.
// The heavy services and the database are mocked; the route and its auth middleware are the real ones.
process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.PORT = '0'; // apiServer starts listening on require; 0 picks a free port

jest.mock('../database/db', () => ({
    query: jest.fn(),
    cache: { get: jest.fn(), set: jest.fn(), del: jest.fn() }
}));
jest.mock('../services/paperTradingService', () => ({ executePaperTrade: jest.fn() }));
jest.mock('../services/realTimeDataService', () => ({ getCurrentPrice: jest.fn() }));
jest.mock('../services/riskManagementService', () => ({ validateTrade: jest.fn() }));
jest.mock('../services/mlService', () => ({}));
jest.mock('../services/backtestingService', () => ({}));

const request = require('supertest');
const authService = require('../auth/authService');
const { query } = require('../database/db');
const paperTradingService = require('../services/paperTradingService');
const realTimeDataService = require('../services/realTimeDataService');
const riskManagementService = require('../services/riskManagementService');
const { app, server, wss } = require('../apiServer');

const TRADE = { portfolioId: 'portfolio-1', symbol: 'AAPL', side: 'buy', quantity: 10, orderType: 'market', strategy: 'manual' };

describe('POST /api/trade', () => {
    beforeEach(() => {
        jest.spyOn(authService, 'verifyToken').mockResolvedValue({ userId: 'user-1' });
        realTimeDataService.getCurrentPrice.mockResolvedValue(150);
        riskManagementService.validateTrade.mockResolvedValue({ passed: true, adjustedQuantity: 10, warnings: [] });
        paperTradingService.executePaperTrade.mockResolvedValue({ status: 'filled' });
    });

    afterAll(async () => {
        wss.close();
        await new Promise((resolve) => server.close(resolve));
    });

    it('trades in a portfolio the caller owns', async () => {
        query.mockResolvedValueOnce([{ id: 'portfolio-1' }]);

        const res = await request(app).post('/api/trade').set('Authorization', 'Bearer t').send(TRADE);

        expect(res.status).toBe(200);
        expect(query).toHaveBeenCalledWith(expect.stringContaining('user_id = $2'), ['portfolio-1', 'user-1']);
        expect(paperTradingService.executePaperTrade).toHaveBeenCalledWith('portfolio-1', expect.objectContaining({ symbol: 'AAPL' }));
    });

    it("refuses another user's portfolio, and neither validates nor executes anything", async () => {
        query.mockResolvedValueOnce([]);

        const res = await request(app).post('/api/trade').set('Authorization', 'Bearer t').send(TRADE);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Portfolio not found' });
        expect(query).toHaveBeenCalledWith(expect.any(String), ['portfolio-1', 'user-1']);
        expect(riskManagementService.validateTrade).not.toHaveBeenCalled();
        expect(paperTradingService.executePaperTrade).not.toHaveBeenCalled();
    });

    it('refuses a request with no portfolio id', async () => {
        query.mockResolvedValueOnce([]);

        const { portfolioId, ...noPortfolio } = TRADE;
        const res = await request(app).post('/api/trade').set('Authorization', 'Bearer t').send(noPortfolio);

        expect(res.status).toBe(404);
        expect(paperTradingService.executePaperTrade).not.toHaveBeenCalled();
    });

    it('still requires a token', async () => {
        const res = await request(app).post('/api/trade').send(TRADE);

        expect(res.status).toBe(401);
        expect(query).not.toHaveBeenCalled();
    });
});

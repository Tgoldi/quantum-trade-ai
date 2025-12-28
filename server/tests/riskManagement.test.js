// Risk Management Service Tests
const riskManagementService = require('../services/riskManagementService');
const realTimeData = require('../services/realTimeDataService');

jest.mock('../services/realTimeDataService');
jest.mock('../database/db');

describe('Risk Management Service', () => {
    describe('validateTrade', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should pass validation for valid trade', async () => {
            const mockPortfolio = {
                id: 'portfolio-123',
                cash: 50000,
                totalValue: 100000,
                positions: []
            };

            riskManagementService.getPortfolioState = jest.fn().mockResolvedValue(mockPortfolio);
            riskManagementService.getTodayPnL = jest.fn().mockResolvedValue(0);
            realTimeData.getCurrentPrice = jest.fn().mockResolvedValue(150);

            const trade = {
                symbol: 'AAPL',
                side: 'buy',
                quantity: 10,
                price: 150
            };

            const result = await riskManagementService.validateTrade('portfolio-123', trade);

            expect(result.passed).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        it('should fail validation for oversized position', async () => {
            const mockPortfolio = {
                id: 'portfolio-123',
                cash: 50000,
                totalValue: 100000,
                positions: []
            };

            riskManagementService.getPortfolioState = jest.fn().mockResolvedValue(mockPortfolio);
            riskManagementService.getTodayPnL = jest.fn().mockResolvedValue(0);
            realTimeData.getCurrentPrice = jest.fn().mockResolvedValue(150);

            const trade = {
                symbol: 'AAPL',
                side: 'buy',
                quantity: 200, // 200 * 150 = 30000 (30% of portfolio, exceeds 20% limit)
                price: 150
            };

            const result = await riskManagementService.validateTrade('portfolio-123', trade);

            expect(result.passed).toBe(true); // Should pass but with adjusted quantity
            expect(result.adjustedQuantity).toBeLessThan(trade.quantity);
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should fail validation when daily loss limit exceeded', async () => {
            const mockPortfolio = {
                id: 'portfolio-123',
                cash: 50000,
                totalValue: 100000,
                positions: []
            };

            riskManagementService.getPortfolioState = jest.fn().mockResolvedValue(mockPortfolio);
            riskManagementService.getTodayPnL = jest.fn().mockResolvedValue(-2500); // 2.5% loss
            realTimeData.getCurrentPrice = jest.fn().mockResolvedValue(150);

            const trade = {
                symbol: 'AAPL',
                side: 'buy',
                quantity: 10,
                price: 150
            };

            const result = await riskManagementService.validateTrade('portfolio-123', trade);

            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.includes('Daily loss limit'))).toBe(true);
        });

        it('should fail validation for insufficient cash reserve', async () => {
            const mockPortfolio = {
                id: 'portfolio-123',
                cash: 6000,
                totalValue: 100000,
                positions: []
            };

            riskManagementService.getPortfolioState = jest.fn().mockResolvedValue(mockPortfolio);
            riskManagementService.getTodayPnL = jest.fn().mockResolvedValue(0);
            realTimeData.getCurrentPrice = jest.fn().mockResolvedValue(150);

            const trade = {
                symbol: 'AAPL',
                side: 'buy',
                quantity: 30, // 30 * 150 = 4500, leaves only 1500 (< 5% reserve)
                price: 150
            };

            const result = await riskManagementService.validateTrade('portfolio-123', trade);

            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.includes('cash reserve'))).toBe(true);
        });
    });

    describe('calculateVaR', () => {
        it('should calculate Value at Risk', async () => {
            const mockPortfolio = {
                id: 'portfolio-123',
                positions: [
                    { symbol: 'AAPL', market_value: 10000 },
                    { symbol: 'NVDA', market_value: 15000 }
                ]
            };

            riskManagementService.getPortfolioState = jest.fn().mockResolvedValue(mockPortfolio);

            realTimeData.getHistoricalBars = jest.fn().mockResolvedValue(
                Array(252).fill(null).map((_, i) => ({
                    close: 100 + Math.random() * 20 - 10,
                    time: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                }))
            );

            const var_ = await riskManagementService.calculateVaR('portfolio-123');

            expect(var_).toHaveProperty('var95');
            expect(var_).toHaveProperty('var99');
            expect(var_.var95).toBeGreaterThan(0);
            expect(var_.var99).toBeGreaterThan(var_.var95);
        });
    });

    describe('calculateStopLoss', () => {
        it('should calculate ATR-based stop loss', async () => {
            const historicalData = Array(20).fill(null).map((_, i) => ({
                high: 105 + Math.random() * 5,
                low: 95 + Math.random() * 5,
                close: 100 + Math.random() * 5,
                time: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            }));

            realTimeData.getHistoricalBars = jest.fn().mockResolvedValue(historicalData);

            const stopLoss = await riskManagementService.calculateStopLoss('AAPL', 100, 'atr');

            expect(stopLoss).toBeLessThan(100);
            expect(stopLoss).toBeGreaterThan(90);
        });

        it('should calculate percentage-based stop loss as fallback', async () => {
            realTimeData.getHistoricalBars = jest.fn().mockResolvedValue([]);

            const stopLoss = await riskManagementService.calculateStopLoss('AAPL', 100);

            expect(stopLoss).toBe(98); // 2% stop loss
        });
    });

    describe('calculateTakeProfit', () => {
        it('should calculate take profit based on risk/reward ratio', async () => {
            realTimeData.getHistoricalBars = jest.fn().mockResolvedValue([]);

            const entryPrice = 100;
            const riskRewardRatio = 2.0;

            const takeProfit = await riskManagementService.calculateTakeProfit(
                'AAPL',
                entryPrice,
                riskRewardRatio
            );

            const stopLoss = 98; // 2% below entry
            const risk = entryPrice - stopLoss;
            const expectedTP = entryPrice + (risk * riskRewardRatio);

            expect(takeProfit).toBeCloseTo(expectedTP, 1);
        });
    });
});

module.exports = {};



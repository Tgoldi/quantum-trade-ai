// Paper Trading Service Tests
const paperTradingService = require('../services/paperTradingService');
const { query, transaction } = require('../database/db');

// Mock database
jest.mock('../database/db');

describe('Paper Trading Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('executePaperTrade', () => {
        it('should execute a buy order successfully', async () => {
            // Mock portfolio with sufficient balance
            query.mockResolvedValueOnce([{ current_balance: 50000 }]);

            // Mock transaction
            transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn()
                        .mockResolvedValueOnce([{ current_balance: 50000 }]) // Check balance
                        .mockResolvedValueOnce([]) // Update balance
                        .mockResolvedValueOnce([]) // Insert trade
                        .mockResolvedValueOnce([]) // Check existing position
                        .mockResolvedValueOnce([]) // Create position
                };
                return await callback(mockClient);
            });

            const order = {
                symbol: 'AAPL',
                side: 'buy',
                quantity: 10,
                orderType: 'market'
            };

            const result = await paperTradingService.executePaperTrade('portfolio-123', order);

            expect(result.status).toBe('filled');
            expect(result).toHaveProperty('tradeId');
            expect(result).toHaveProperty('executionPrice');
        });

        it('should reject buy order with insufficient funds', async () => {
            transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValueOnce([{ current_balance: 100 }])
                };
                await expect(callback(mockClient)).rejects.toThrow('Insufficient funds');
            });

            const order = {
                symbol: 'AAPL',
                side: 'buy',
                quantity: 100,
                orderType: 'market'
            };

            await expect(
                paperTradingService.executePaperTrade('portfolio-123', order)
            ).rejects.toThrow('Insufficient funds');
        });

        it('should execute a sell order successfully', async () => {
            transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn()
                        .mockResolvedValueOnce([{ quantity: 20 }]) // Check position
                        .mockResolvedValueOnce([]) // Update balance
                        .mockResolvedValueOnce([]) // Insert trade
                        .mockResolvedValueOnce([{ quantity: 20 }]) // Get position again
                        .mockResolvedValueOnce([]) // Update position
                };
                return await callback(mockClient);
            });

            const order = {
                symbol: 'AAPL',
                side: 'sell',
                quantity: 10,
                orderType: 'market'
            };

            const result = await paperTradingService.executePaperTrade('portfolio-123', order);

            expect(result.status).toBe('filled');
        });

        it('should reject sell order with insufficient shares', async () => {
            transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn().mockResolvedValueOnce([{ quantity: 5 }])
                };
                await expect(callback(mockClient)).rejects.toThrow('Insufficient shares');
            });

            const order = {
                symbol: 'AAPL',
                side: 'sell',
                quantity: 10,
                orderType: 'market'
            };

            await expect(
                paperTradingService.executePaperTrade('portfolio-123', order)
            ).rejects.toThrow();
        });
    });

    describe('calculateExecutionPrice', () => {
        it('should apply slippage to market buy orders', () => {
            const marketPrice = 100;
            const executionPrice = paperTradingService.calculateExecutionPrice(
                marketPrice,
                'buy',
                'market'
            );

            expect(executionPrice).toBeGreaterThan(marketPrice);
            expect(executionPrice).toBeLessThan(marketPrice * 1.01);
        });

        it('should apply slippage to market sell orders', () => {
            const marketPrice = 100;
            const executionPrice = paperTradingService.calculateExecutionPrice(
                marketPrice,
                'sell',
                'market'
            );

            expect(executionPrice).toBeLessThan(marketPrice);
            expect(executionPrice).toBeGreaterThan(marketPrice * 0.99);
        });

        it('should reject limit buy if price too low', () => {
            const marketPrice = 100;
            const limitPrice = 95;
            const executionPrice = paperTradingService.calculateExecutionPrice(
                marketPrice,
                'buy',
                'limit',
                limitPrice
            );

            expect(executionPrice).toBeNull();
        });

        it('should execute limit buy if price acceptable', () => {
            const marketPrice = 100;
            const limitPrice = 105;
            const executionPrice = paperTradingService.calculateExecutionPrice(
                marketPrice,
                'buy',
                'limit',
                limitPrice
            );

            expect(executionPrice).toBe(limitPrice);
        });
    });

    describe('calculatePerformance', () => {
        it('should calculate portfolio performance correctly', async () => {
            query
                .mockResolvedValueOnce([{
                    id: 'portfolio-123',
                    current_balance: 50000,
                    initial_balance: 100000
                }])
                .mockResolvedValueOnce([
                    { symbol: 'AAPL', quantity: 10, average_cost: 150, current_price: 180, market_value: 1800 },
                    { symbol: 'NVDA', quantity: 5, average_cost: 800, current_price: 900, market_value: 4500 }
                ]);

            paperTradingService.getCurrentPrice = jest.fn()
                .mockResolvedValueOnce(180)
                .mockResolvedValueOnce(900);

            const performance = await paperTradingService.calculatePerformance('portfolio-123');

            expect(performance).toHaveProperty('totalValue');
            expect(performance).toHaveProperty('totalReturn');
            expect(performance).toHaveProperty('totalReturnPercent');
            expect(performance.cash).toBe(50000);
            expect(performance.positionsValue).toBeGreaterThan(0);
        });
    });
});

module.exports = {};



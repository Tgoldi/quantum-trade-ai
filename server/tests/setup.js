// Jest Setup File
beforeAll(() => {
    // Setup before all tests
    console.log('Setting up test environment...');
});

afterAll(() => {
    // Cleanup after all tests
    console.log('Cleaning up test environment...');
});

beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
    createMockPortfolio: () => ({
        id: 'test-portfolio-123',
        user_id: 'test-user-123',
        name: 'Test Portfolio',
        type: 'paper',
        current_balance: 100000,
        initial_balance: 100000,
        created_at: new Date()
    }),

    createMockTrade: () => ({
        id: 'test-trade-123',
        portfolio_id: 'test-portfolio-123',
        symbol: 'AAPL',
        side: 'buy',
        quantity: 10,
        price: 150,
        total_amount: 1500,
        execution_time: new Date()
    }),

    createMockUser: () => ({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        is_active: true,
        subscription_tier: 'free'
    })
};



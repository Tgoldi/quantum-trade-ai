import { useState, useEffect } from "react";

import PortfolioVitals from "../components/dashboard/PortfolioVitals";
import AIDecisionPanel from "../components/dashboard/AIDecisionPanel";
import DynamicRiskIndicator from "../components/dashboard/DynamicRiskIndicator";
import MarketPulse from "../components/dashboard/MarketPulse";
import backendService from "../api/backendService";

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState({
    total_value: 0,
    day_change: 0,
    day_change_percent: 0,
    total_return_percent: 0,
    sharpe_ratio: 0,
    number_of_positions: 0
  });
  const [recentDecision, setRecentDecision] = useState({
    symbol: "Loading...",
    decision: "hold",
    confidence: 0,
    reason: "Loading data...",
    target_price: 0,
    stop_loss: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleExecuteDecision = async (decision) => {
    try {
      // Create order from AI decision
      const orderData = {
        symbol: decision.symbol,
        side: decision.decision.includes('buy') ? 'buy' : 'sell',
        quantity: 10, // Default quantity
        order_type: 'limit',
        price: decision.target_price,
        stop_price: decision.stop_loss,
        time_in_force: 'day',
        source: 'ai_decision',
        confidence: decision.confidence_score
      };

      // Store in localStorage for OrderManagement to pick up
      const existingOrders = JSON.parse(localStorage.getItem('ai_orders') || '[]');
      const newOrder = {
        ...orderData,
        id: Date.now(),
        order_id: `AI_${Date.now()}`,
        status: 'pending',
        filled_quantity: 0,
        remaining_quantity: orderData.quantity,
        created_date: new Date().toISOString(),
        reasoning: decision.reasoning
      };
      
      existingOrders.unshift(newOrder);
      localStorage.setItem('ai_orders', JSON.stringify(existingOrders));
      
      console.log('✅ AI decision executed and order created:', newOrder);
      alert(`Order placed: ${newOrder.side.toUpperCase()} ${newOrder.quantity} ${newOrder.symbol} @ $${newOrder.price}`);
    } catch (error) {
      console.error('Error executing AI decision:', error);
      alert('Failed to execute decision: ' + error.message);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Get real Alpaca portfolio data
      const alpacaPortfolio = await backendService.getPortfolioSummary();
      
      let portfolioData;
      
      if (alpacaPortfolio) {
        // Use real Alpaca portfolio data
        portfolioData = {
          id: 1,
          total_value: alpacaPortfolio.total_value,
          day_change: alpacaPortfolio.day_change,
          day_change_percent: alpacaPortfolio.day_change_percent,
          total_return: alpacaPortfolio.total_return,
          total_return_percent: alpacaPortfolio.total_return_percent,
          positions_count: alpacaPortfolio.positions_count,
          winning_positions: alpacaPortfolio.winning_positions,
          losing_positions: alpacaPortfolio.losing_positions,
          source: 'alpaca'
        };
      } else {
        // Fallback to calculated portfolio from real market data
        const portfolioSymbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX'];
        const marketData = await backendService.getMarketData(portfolioSymbols);
        
        const marketDataArray = Array.isArray(marketData) ? marketData : [];
        
        if (marketDataArray.length > 0) {
          const totalValue = marketDataArray.reduce((sum, stock) => sum + (stock.price * 10), 0);
          const totalChange = marketDataArray.reduce((sum, stock) => sum + (stock.change * 10), 0);
          const changePercent = totalChange / (totalValue - totalChange) * 100;
          
          portfolioData = {
            id: 1,
            total_value: totalValue,
            day_change: totalChange,
            day_change_percent: changePercent,
            total_return: totalChange * 2.5,
            total_return_percent: changePercent * 2.5,
            positions_count: portfolioSymbols.length,
            winning_positions: marketDataArray.filter(s => s.change > 0).length,
            losing_positions: marketDataArray.filter(s => s.change < 0).length,
            source: 'calculated'
          };
        } else {
          throw new Error('No market data available');
        }
      }

      setPortfolio(portfolioData);
      setLoading(false); // ✅ Show dashboard immediately
      
      // Load AI decision in background (don't wait for it)
      loadAIDecision();
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setPortfolio({
        id: 1,
        total_value: 0,
        day_change: 0,
        day_change_percent: 0,
        total_return: 0,
        total_return_percent: 0,
        positions_count: 0,
        winning_positions: 0,
        losing_positions: 0
      });
      setLoading(false);
    }
  };

  const loadAIDecision = async () => {
    // Get real AI decision from backend (uses your Ollama models)
    // Use AAPL consistently to leverage cache
    const symbol = 'AAPL'; // Consistent symbol to use cache
    
    // Show loading state first
    setRecentDecision({
      symbol: symbol,
      decision: "analyzing",
      confidence_score: 0,
      reasoning: "🤖 AI models analyzing... This may take 30-60 seconds on first run while models warm up.",
      target_price: 0,
      stop_loss: 0
    });

    try {
      // Call backend to get real AI decision from Ollama with timeout
      console.log(`🤖 Requesting AI analysis for ${symbol}... (checking cache first)`);
      
      // Set a 95-second timeout (matches backend timeout)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - AI taking too long')), 95000)
      );
      
      const aiDecisionPromise = backendService.getAIDecision(symbol);
      
      // Race between API call and timeout
      const aiDecision = await Promise.race([aiDecisionPromise, timeoutPromise]);
      
      setRecentDecision(aiDecision);
      console.log('✅ Loaded real AI decision from Ollama:', aiDecision);
    } catch (aiError) {
      console.log('⚠️ AI decision timeout or error:', aiError.message);
      // If AI times out, show actionable fallback
      setRecentDecision({
        symbol: symbol,
        decision: "hold",
        confidence_score: 0,
        reasoning: "AI analysis timed out. Models may be warming up (first run takes 2-3 mins). Click refresh or wait a moment and reload the page.",
        target_price: 0,
        stop_loss: 0
      });
    }
  };
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Responsive Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-2xl font-bold text-slate-100">
          Dashboard
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Your portfolio overview and AI insights
        </p>
      </div>
      
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6">
        {/* AI Decision Panel - Full width on mobile, 5 cols on large screens */}
        <div className="lg:col-span-5">
          <AIDecisionPanel 
            decision={recentDecision} 
            onExecute={handleExecuteDecision}
            onRefresh={loadAIDecision}
          />
        </div>

        {/* Portfolio Stats Column - Full width on mobile, 7 cols on large screens */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5 md:space-y-6">
          <PortfolioVitals portfolio={portfolio} />
          
          {/* Risk and Market - Stack on mobile, side-by-side on tablet+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <DynamicRiskIndicator portfolio={portfolio} />
            <MarketPulse />
          </div>
        </div>
      </div>
    </div>
  );
}
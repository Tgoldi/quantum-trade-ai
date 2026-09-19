import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import PortfolioVitals from "../components/dashboard/PortfolioVitals";
import AIDecisionPanel from "../components/dashboard/AIDecisionPanel";
import DynamicRiskIndicator from "../components/dashboard/DynamicRiskIndicator";
import MarketPulse from "../components/dashboard/MarketPulse";
import backendService from "../api/backendService";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [lastAIRequestTime, setLastAIRequestTime] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleExecuteDecision = async (decision) => {
    try {
      // Validate ownership of the AI decision before executing
      if (!user || !decision || decision.user_id !== user.id) {
        throw new Error('You do not have permission to execute this decision');
      }
      // Validate AI decision parameters
      if (!decision.symbol || typeof decision.symbol !== 'string' || !/^[A-Z]{1,5}$/.test(decision.symbol)) {
        throw new Error('Invalid symbol');
      }
      if (!['buy', 'sell', 'hold'].includes(decision.decision)) {
        throw new Error('Invalid decision type');
      }
      if (typeof decision.target_price !== 'number' || decision.target_price <= 0 || decision.target_price > 1000000) {
        throw new Error('Invalid target price');
      }
      if (typeof decision.stop_loss !== 'number' || decision.stop_loss <= 0 || decision.stop_loss > 1000000) {
        throw new Error('Invalid stop loss');
      }
      if (typeof decision.confidence_score !== 'number' || decision.confidence_score < 0 || decision.confidence_score > 100) {
        throw new Error('Invalid confidence score');
      }

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

      // Send to server for validation and creation
      const response = await backendService.createOrder(orderData);
      
      console.log('✅ AI decision executed and order created on server:', response);
      alert(`Order placed: ${orderData.side.toUpperCase()} ${orderData.quantity} ${orderData.symbol} @ $${orderData.price}`);
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
          const totalValue = marketDataArray.reduce((sum, stock) => sum + ((typeof stock?.price === 'number' ? stock.price : 0) * 10), 0);
          const totalChange = marketDataArray.reduce((sum, stock) => sum + ((typeof stock?.change === 'number' ? stock.change : 0) * 10), 0);
          const changePercent = totalChange / (totalValue - totalChange) * 100;
          
          portfolioData = {
            id: 1,
            total_value: totalValue,
            day_change: totalChange,
            day_change_percent: changePercent,
            total_return: totalChange * 2.5,
            total_return_percent: changePercent * 2.5,
            positions_count: portfolioSymbols.length,
            winning_positions: marketDataArray.filter(s => (typeof s?.change === 'number' ? s.change : 0) > 0).length,
            losing_positions: marketDataArray.filter(s => (typeof s?.change === 'number' ? s.change : 0) < 0).length,
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
    // Implement rate limiting: prevent calls within 30 seconds
    const now = Date.now();
    if (now - lastAIRequestTime < 30000) {
      alert('Please wait 30 seconds before requesting another AI analysis');
      return;
    }
    setLastAIRequestTime(now);

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
      
      // Validate AI decision before displaying
      if (!aiDecision.symbol || !['buy', 'sell', 'hold'].includes(aiDecision.decision)) {
        throw new Error('Invalid AI decision received from server');
      }
      if (typeof aiDecision.confidence_score !== 'number' || aiDecision.confidence_score < 0 || aiDecision.confidence_score > 100) {
        throw new Error('Invalid confidence score from server');
      }
      if (typeof aiDecision.target_price !== 'number' || aiDecision.target_price <= 0) {
        throw new Error('Invalid target price from server');
      }
      if (typeof aiDecision.stop_loss !== 'number' || aiDecision.stop_loss <= 0) {
        throw new Error('Invalid stop loss from server');
      }
      
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
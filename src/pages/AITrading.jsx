import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, Shield } from "lucide-react";

const AIDecisionCard = ({ decision, onExecute }) => {
  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'strong_buy':
      case 'buy':
        return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'strong_sell':
      case 'sell':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      default:
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    }
  };

  const colorClass = getDecisionColor(decision.decision);
  const confidence = (decision.confidence_score * 100).toFixed(0);

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 p-4 rounded-lg hover:border-slate-700/50 transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-200 font-bold text-sm">
            {decision.symbol.substring(0, 3)}
          </div>
          <div>
            <h3 className="text-slate-100 font-semibold">{decision.symbol}</h3>
            <p className="text-slate-500 text-xs">
              {new Date(decision.created_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`capitalize text-xs ${colorClass}`}>
          {decision.decision.replace('_', ' ')}
        </Badge>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
        {decision.reasoning}
      </p>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Confidence</span>
          <span className="text-slate-200 font-medium">{confidence}%</span>
        </div>
        <Progress value={Number(confidence)} className="h-1.5 [&>div]:bg-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="flex items-center gap-1.5">
          <Target className="w-3 h-3 text-green-400" />
          <span className="text-slate-500">Target:</span>
          <span className="text-slate-200 font-medium">${decision.target_price.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-red-400" />
          <span className="text-slate-500">Stop:</span>
          <span className="text-slate-200 font-medium">${decision.stop_loss.toFixed(2)}</span>
        </div>
      </div>

      <Button 
        size="sm"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => onExecute(decision)}
      >
        <Zap className="w-4 h-4 mr-2" />
        Execute
      </Button>
    </div>
  );
};

AIDecisionCard.propTypes = {
  decision: PropTypes.shape({
    id: PropTypes.number,
    symbol: PropTypes.string.isRequired,
    decision: PropTypes.string.isRequired,
    confidence_score: PropTypes.number.isRequired,
    reasoning: PropTypes.string.isRequired,
    target_price: PropTypes.number.isRequired,
    stop_loss: PropTypes.number.isRequired,
    created_date: PropTypes.string.isRequired
  }).isRequired,
  onExecute: PropTypes.func.isRequired
};

export default function AITrading() {
  const [decisions, setDecisions] = useState([]);
  const [isGeneratingDecision, setIsGeneratingDecision] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      console.log("AITrading loadDecisions called - using MOCK data");
      // Simulate loading AI decisions with mock data
      const mockDecisions = [
        {
          id: 1,
          symbol: "NVDA",
          decision: "strong_buy",
          confidence_score: 0.87,
          reasoning: "Strong Q3 earnings beat expectations with 94% revenue growth. AI chip demand remains robust with expanding data center business. Technical indicators show bullish momentum with RSI at healthy 65 level.",
          target_price: 950.00,
          stop_loss: 820.00,
          created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          symbol: "TSLA",
          decision: "hold",
          confidence_score: 0.62,
          reasoning: "Mixed signals from recent delivery numbers. Cybertruck production ramp-up shows promise but margin pressures persist. Waiting for clearer direction after next earnings call.",
          target_price: 250.00,
          stop_loss: 200.00,
          created_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          symbol: "AAPL",
          decision: "buy",
          confidence_score: 0.74,
          reasoning: "iPhone 15 sales showing steady momentum. Services revenue continues strong growth trajectory. Valuation attractive relative to historical P/E ratios.",
          target_price: 210.00,
          stop_loss: 175.00,
          created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          symbol: "AMZN",
          decision: "sell",
          confidence_score: 0.68,
          reasoning: "Cloud growth decelerating while competition intensifies. High valuation multiples not justified by current growth rates. Technical analysis shows bearish divergence.",
          target_price: 120.00,
          stop_loss: 155.00,
          created_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setDecisions(mockDecisions);
    } catch (error) {
      console.error("Error loading AI decisions:", error);
    }
    setLoading(false);
  };

  const generateAIDecision = async (symbol = null) => {
    setIsGeneratingDecision(true);
    try {
      const targetSymbol = symbol || customSymbol || 'NVDA';
      
      // Simulate AI analysis with realistic mock data
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      const decisions = ["buy", "sell", "hold", "strong_buy", "strong_sell"];
      const mockDecision = decisions[Math.floor(Math.random() * decisions.length)];
      const confidence = 0.6 + Math.random() * 0.3; // Between 0.6 and 0.9
      
      const newDecision = {
        id: Date.now(),
        symbol: targetSymbol,
        decision: mockDecision,
        confidence_score: confidence,
        reasoning: `AI analysis of ${targetSymbol} indicates ${mockDecision.replace('_', ' ')} recommendation based on current market conditions, technical indicators, and fundamental analysis.`,
        target_price: 200 + Math.random() * 300,
        stop_loss: 150 + Math.random() * 200,
        created_date: new Date().toISOString(),
        executed: false
      };

      setDecisions(prev => [newDecision, ...prev]);
      setCustomSymbol('');
    } catch (error) {
      console.error("Error generating AI decision:", error);
    }
    setIsGeneratingDecision(false);
  };

  const executeDecision = async (decision) => {
    try {
      // Simulate trade execution
      console.log(`Executing trade for ${decision.symbol}: ${decision.decision}`);
      
      // Update decision as executed in local state
      setDecisions(prev => 
        prev.map(d => 
          d.id === decision.id 
            ? { ...d, executed: true }
            : d
        )
      );
      
      // Show success notification (you could add a toast notification here)
      alert(`Trade executed successfully for ${decision.symbol}!`);
    } catch (error) {
      console.error("Error executing trade:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">Loading AI engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            AI Trading
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            AI-powered trading recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Symbol"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
            className="w-24 sm:w-32 h-9 bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm"
          />
          <Button 
            onClick={() => generateAIDecision()}
            disabled={isGeneratingDecision}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
          >
            {isGeneratingDecision ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span className="ml-2">Generate</span>
          </Button>
        </div>
      </div>

      {/* Responsive AI Decisions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {(decisions.length > 0 ? decisions : [
          {
            id: 1, symbol: "NVDA", decision: "strong_buy", confidence_score: 0.94, reasoning: "Strong earnings, AI market leadership, and favorable technicals suggest upside.", target_price: 950, stop_loss: 820, created_date: new Date()
          },
          {
            id: 2, symbol: "TSLA", decision: "hold", confidence_score: 0.72, reasoning: "Mixed signals from production data and regulatory concerns. Wait for clearer direction.", target_price: 240, stop_loss: 190, created_date: new Date(Date.now() - 3.6e6)
          },
          {
            id: 3, symbol: "AAPL", decision: "sell", confidence_score: 0.81, reasoning: "Slowing iPhone sales growth and increased competition in the high-end market.", target_price: 160, stop_loss: 185, created_date: new Date(Date.now() - 7.2e6)
          }
        ]).map((decision) => (
          <AIDecisionCard 
            key={decision.id} 
            decision={decision} 
            onExecute={executeDecision}
          />
        ))}
      </div>
    </div>
  );
}
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Target, Shield, Zap, RefreshCw } from "lucide-react";
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

const DetailItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2.5">
    <Icon className={`w-4 h-4 ${color || 'text-slate-400'}`} />
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-100">{value}</div>
    </div>
  </div>
);

DetailItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  color: PropTypes.string
};

export default function AIDecisionPanel({ decision, onExecute, onRefresh }) {
  const [executing, setExecuting] = useState(false);
  
  // Use real decision data, no mock fallbacks!
  const data = decision || {
      symbol: "AAPL",
      decision: "analyzing",
      confidence_score: 0,
      reasoning: "Waiting for AI analysis...",
      target_price: 0,
      stop_loss: 0
  };

  const handleExecute = async () => {
    if (!onExecute) return;
    
    setExecuting(true);
    try {
      await onExecute(data);
    } catch (error) {
      console.error('Error executing decision:', error);
    } finally {
      setExecuting(false);
    }
  };

  const getDecisionStyles = (decision) => {
    switch (decision) {
      case 'strong_buy':
      case 'buy':
        return { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", icon: <TrendingUp className="w-5 h-5" /> };
      case 'strong_sell':
      case 'sell':
        return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: <TrendingDown className="w-5 h-5" /> };
      default:
        return { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: <Target className="w-5 h-5" /> };
    }
  };

  const styles = getDecisionStyles(data.decision);

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Brain className="w-4 h-4 text-blue-400" />
            AI Decision
          </CardTitle>
          <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10 text-xs px-2">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg border ${styles.border} ${styles.bg} flex items-center justify-between`}>
          <div className="text-2xl font-bold text-slate-100">{data.symbol}</div>
          <div className={`flex items-center gap-2 ${styles.color} font-bold`}>
            {styles.icon}
            <span className="text-sm">{data.decision.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
          
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
              <span>Confidence</span>
              <span className="text-slate-200 font-medium">{(data.confidence_score * 100).toFixed(0)}%</span>
            </div>
            <Progress value={data.confidence_score * 100} className="h-1.5 [&>div]:bg-blue-500" />
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {data.reasoning}
        </p>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-lg">
          <DetailItem icon={Target} label="Target" value={`$${data.target_price.toFixed(2)}`} color="text-green-400" />
          <DetailItem icon={Shield} label="Stop Loss" value={`$${data.stop_loss.toFixed(2)}`} color="text-red-400" />
        </div>

        <div className="flex gap-2">
          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={executing}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
          
          {onExecute && (
            <Button
              onClick={handleExecute}
              disabled={executing || data.decision === "analyzing"}
              className={`flex-1 ${
                data.decision.includes('buy') 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : data.decision.includes('sell')
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Zap className="w-4 h-4 mr-2" />
              {executing ? 'Executing...' : data.decision === "analyzing" ? 'Analyzing...' : `Execute ${data.decision.replace('_', ' ').toUpperCase()}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

AIDecisionPanel.propTypes = {
  decision: PropTypes.shape({
    symbol: PropTypes.string,
    decision: PropTypes.string,
    confidence_score: PropTypes.number,
    consensus_score: PropTypes.number,
    reasoning: PropTypes.string,
    target_price: PropTypes.number,
    stop_loss: PropTypes.number
  }),
  onExecute: PropTypes.func,
  onRefresh: PropTypes.func
};
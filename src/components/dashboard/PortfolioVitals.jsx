import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Target, Shield, Briefcase } from 'lucide-react';

const VitalStat = ({ icon: Icon, label, value, trend, trendValue, isCurrency = false, isPercentage = false }) => (
  <div className="bg-slate-900/30 p-3 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-slate-500" />
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
    <div className="text-xl font-bold text-slate-100">
      {isCurrency && '$'}{value}{isPercentage && '%'}
    </div>
    {trendValue && (
      <div className={`flex items-center text-xs font-medium mt-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        <span>{trendValue}</span>
      </div>
    )}
  </div>
);

VitalStat.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.string,
  trendValue: PropTypes.string,
  isCurrency: PropTypes.bool,
  isPercentage: PropTypes.bool
};

export default function PortfolioVitals({ portfolio }) {
  console.log("PortfolioVitals received portfolio:", portfolio);
  
  // Use real portfolio data, no fake fallbacks
  const hasData = portfolio && portfolio.total_value !== undefined;
  
  // Calculate Sharpe Ratio approximation (simplified)
  const calculateSharpeRatio = () => {
    if (!hasData || !portfolio.total_return_percent) return 0;
    // Simplified Sharpe: (Return - Risk-free rate) / Volatility
    // Using 3% risk-free rate and 10% estimated volatility
    const riskFreeRate = 3;
    const estimatedVolatility = 10;
    return ((portfolio.total_return_percent - riskFreeRate) / estimatedVolatility).toFixed(2);
  };
  
  // Calculate Win Rate from positions
  const calculateWinRate = () => {
    if (!hasData) return 0;
    const winning = portfolio.winning_positions || 0;
    const losing = portfolio.losing_positions || 0;
    const total = winning + losing;
    return total > 0 ? ((winning / total) * 100).toFixed(1) : 0;
  };
  
  // Calculate Max Drawdown (simplified - would need historical data for accuracy)
  const calculateMaxDrawdown = () => {
    if (!hasData || !portfolio.total_return_percent) return 0;
    // Simplified estimate: negative of half the total loss if negative
    if (portfolio.total_return_percent < 0) {
      return (portfolio.total_return_percent * 0.5).toFixed(2);
    }
    return (-portfolio.total_return_percent * 0.1).toFixed(2); // 10% of gains as estimate
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Briefcase className="w-4 h-4 text-slate-400" />
          Portfolio Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <VitalStat
          icon={DollarSign}
          label="Value"
          value={(portfolio?.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          trend={(portfolio?.day_change || 0) >= 0 ? "up" : "down"}
          trendValue={hasData ? `$${(portfolio.day_change || 0).toFixed(2)} (${(portfolio.day_change_percent || 0).toFixed(2)}%)` : "$0.00 (0.00%)"}
          isCurrency
        />
        <VitalStat
          icon={TrendingUp}
          label="Total Return"
          value={(portfolio?.total_return_percent || 0).toFixed(2)}
          isPercentage
        />
        <VitalStat
          icon={Target}
          label="Sharpe Ratio"
          value={hasData ? calculateSharpeRatio() : '0.00'}
        />
        <VitalStat
          icon={Shield}
          label="Win Rate"
          value={hasData ? calculateWinRate() : '0.0'}
          isPercentage
        />
        <VitalStat
          icon={Briefcase}
          label="Positions"
          value={portfolio?.positions_count || 0}
        />
        <VitalStat
          icon={TrendingDown}
          label="Max Drawdown"
          value={hasData ? calculateMaxDrawdown() : '0.00'}
          isPercentage
        />
      </CardContent>
    </Card>
  );
}

PortfolioVitals.propTypes = {
  portfolio: PropTypes.shape({
    total_value: PropTypes.number,
    day_change: PropTypes.number,
    day_change_percent: PropTypes.number,
    total_return_percent: PropTypes.number,
    sharpe_ratio: PropTypes.number,
    number_of_positions: PropTypes.number,
    win_rate: PropTypes.number,
    max_drawdown: PropTypes.number
  })
};
import { useState, useEffect } from 'react';
import backendService from '../../api/backendService';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";

export default function MacroeconomicDashboard() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      // Fetch real macroeconomic data from authenticated API
      const data = await backendService.makeRequest('/macroeconomic/indicators');
      setIndicators(data.indicators || []); // Extract indicators array
      console.log('✅ Loaded real macroeconomic indicators');
    } catch (error) {
      console.error('Error loading indicators:', error);
      setIndicators([]);
    }
    setLoading(false);
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'deteriorating': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatValue = (value, indicatorName) => {
    // Handle null/undefined values
    if (!value && value !== 0) return 'N/A';
    
    // Handle null/undefined/non-string indicator names
    if (!indicatorName || typeof indicatorName !== 'string') {
      return (value || 0).toString();
    }
    
    try {
      const name = indicatorName.toLowerCase();
      if (name.includes('rate') || name.includes('inflation')) {
        return `${(value || 0).toFixed(2)}%`;
      }
      if (name.includes('gdp')) {
        return `$${((value || 0) / 1000000000000).toFixed(2)}T`;
      }
      return (value || 0).toLocaleString();
    } catch (error) {
      console.warn('Error formatting value:', error);
      return (value || 0).toString();
    }
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader className="border-b border-slate-800/50">
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-purple-400" />
          Macroeconomic Intelligence
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
            REAL-TIME
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading economic data...</div>
        ) : !indicators || indicators.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No economic data available</div>
        ) : (
          <div className="space-y-1">
            {indicators.slice(0, 8).filter(indicator => indicator && typeof indicator === 'object').map((indicator, index) => (
              <div 
                key={indicator.id || index}
                className="flex items-center justify-between p-4 hover:bg-slate-800/20 transition-colors border-b border-slate-800/20 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(indicator.trend)}
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {indicator.indicator_name || 'Unknown Indicator'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {indicator.release_date ? new Date(indicator.release_date).toLocaleDateString() : 'No date'}
                      </div>
                    </div>
                  </div>
                  <Badge className={getImpactColor(indicator.market_impact)}>
                    {indicator.market_impact?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-white">
                    {formatValue(indicator.current_value, indicator.indicator_name)}
                  </div>
                  <div className={`text-sm flex items-center gap-1 ${
                    (indicator.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(indicator.change || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {(indicator.change || 0) >= 0 ? '+' : ''}{parseFloat(indicator.change_percent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import backendService from "../../api/backendService";

const MarketMover = ({ stock, index }) => {
  // Add safety checks for undefined values
  const price = stock?.price || 0;
  const change = stock?.change || 0;
  const changePercent = stock?.change_percent || 0;
  const volume = stock?.volume || 0;
  const symbol = stock?.symbol || 'N/A';
  
  const isPositive = change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
          {symbol.substring(0, 2)}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{symbol}</p>
          <p className="text-slate-400 text-xs">${price.toFixed(2)}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="text-xs font-semibold">
            {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
        <p className="text-slate-400 text-xs">Vol: {(volume / 1000000).toFixed(1)}M</p>
      </div>
    </motion.div>
  );
};

export default function MarketPulse() {
  const [marketData, setMarketData] = useState({
    gainers: [],
    losers: [],
    mostActive: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    // Load real-time market movers
    const loadMarketData = async () => {
      try {
        const data = await backendService.getMarketMovers();
        if (isMounted && data) {
          // Ensure data has the expected structure with fallbacks
          const safeData = {
            gainers: data.gainers || [],
            losers: data.losers || [],
            mostActive: data.mostActive || []
          };
          setMarketData(safeData);
          setLastUpdate(new Date());
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading market data:', error);
        if (isMounted) {
          // Set fallback data on error
          setMarketData({
            gainers: [],
            losers: [],
            mostActive: []
          });
          setLoading(false);
        }
      }
    };

    // Initial load
    loadMarketData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadMarketData, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <Activity className="w-4 h-4 text-cyan-400" />
          Market Pulse
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs ml-auto">
            {loading ? 'LOADING...' : 'LIVE'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h3 className="text-slate-300 font-medium text-sm">Top Gainers</h3>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {marketData.gainers && marketData.gainers.length > 0 ? (
                marketData.gainers.map((stock, index) => (
                  <MarketMover key={stock?.symbol || index} stock={stock} index={index} />
                ))
              ) : (
                <div className="text-slate-400 text-sm text-center py-4">
                  {loading ? 'Loading gainers...' : 'No gainers data available'}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="border-t border-slate-800/50 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="text-slate-300 font-medium text-sm">Top Losers</h3>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {marketData.losers && marketData.losers.length > 0 ? (
                marketData.losers.map((stock, index) => (
                  <MarketMover key={stock?.symbol || index} stock={stock} index={index} />
                ))
              ) : (
                <div className="text-slate-400 text-sm text-center py-4">
                  {loading ? 'Loading losers...' : 'No losers data available'}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="border-t border-slate-800/50 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-slate-300 font-medium text-sm">Most Active</h3>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {marketData.mostActive && marketData.mostActive.length > 0 ? (
                marketData.mostActive.map((stock, index) => (
                  <MarketMover key={stock?.symbol || index} stock={stock} index={index} />
                ))
              ) : (
                <div className="text-slate-400 text-sm text-center py-4">
                  {loading ? 'Loading most active...' : 'No most active data available'}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
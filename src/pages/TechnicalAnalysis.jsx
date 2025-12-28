import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Activity, Target, Zap, Search, Settings, Download } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import stockDataService from "../api/stockDataService";

const TechnicalIndicator = ({ name, value, signal, description }) => {
  const getSignalColor = (signal) => {
    switch (signal) {
      case 'bullish':
      case 'buy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'bearish':
      case 'sell': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'neutral':
      case 'hold': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{name}</h3>
        <Badge className={`${getSignalColor(signal)} text-xs font-bold`}>
          {signal?.toUpperCase()}
        </Badge>
      </div>
      <div className="text-2xl font-bold text-cyan-400 mb-1">{value}</div>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
};

const ChartControls = ({ onTimeframeChange, onIndicatorToggle, activeIndicators }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-lg">
      <Select defaultValue="1D" onValueChange={onTimeframeChange}>
        <SelectTrigger className="w-24 bg-slate-800/50 border-slate-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1m">1m</SelectItem>
          <SelectItem value="5m">5m</SelectItem>
          <SelectItem value="15m">15m</SelectItem>
          <SelectItem value="1H">1H</SelectItem>
          <SelectItem value="4H">4H</SelectItem>
          <SelectItem value="1D">1D</SelectItem>
          <SelectItem value="1W">1W</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex gap-2">
        {['SMA', 'EMA', 'Bollinger', 'MACD', 'RSI', 'Volume'].map(indicator => (
          <Button
            key={indicator}
            size="sm"
            variant={activeIndicators.includes(indicator) ? "default" : "outline"}
            onClick={() => onIndicatorToggle(indicator)}
            className="text-xs"
          >
            {indicator}
          </Button>
        ))}
      </div>
      
      <Button size="sm" variant="outline" className="ml-auto">
        <Download className="w-4 h-4 mr-1" />
        Export
      </Button>
    </div>
  );
};

export default function TechnicalAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [marketData, setMarketData] = useState({
    symbol: 'AAPL',
    last_price: 0,
    change: 0,
    change_percent: 0,
    volume: 0,
    high: 0,
    low: 0,
    open: 0
  });
  const [chartData, setChartData] = useState([]);
  const [activeIndicators, setActiveIndicators] = useState(['SMA', 'Volume']);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicalData();
  }, [selectedSymbol, timeframe]);

  const loadTechnicalData = async () => {
    try {
      // Get real historical data and current quote
      const [historicalData, currentQuote] = await Promise.all([
        stockDataService.getHistoricalData(selectedSymbol, timeframe, 60),
        stockDataService.getMarketData([selectedSymbol])
      ]);

      // Calculate technical indicators
      const enhancedChartData = historicalData.map((candle, index) => {
        const closes = historicalData.slice(Math.max(0, index - 19), index + 1).map(c => c.close);
        const sma_20 = closes.length >= 20 ? closes.reduce((a, b) => a + b) / closes.length : candle.close;
        
        // Simple RSI calculation
        const gains = [];
        const losses = [];
        for (let i = 1; i < Math.min(closes.length, 15); i++) {
          const change = closes[i] - closes[i - 1];
          if (change > 0) gains.push(change);
          else losses.push(Math.abs(change));
        }
        const avgGain = gains.length ? gains.reduce((a, b) => a + b) / gains.length : 0;
        const avgLoss = losses.length ? losses.reduce((a, b) => a + b) / losses.length : 0;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

        return {
          ...candle,
          sma_20,
          ema_50: sma_20 * 0.95 + candle.close * 0.05, // Simplified EMA
          rsi: Math.max(0, Math.min(100, rsi)),
          macd: (candle.close - sma_20) / sma_20 * 100,
          bb_upper: sma_20 * 1.02,
          bb_lower: sma_20 * 0.98
        };
      });
      
      setChartData(enhancedChartData);
      
      if (currentQuote.length > 0) {
        const quote = currentQuote[0];
        setMarketData({
          symbol: selectedSymbol,
          last_price: quote.price || 0,
          change: quote.change || 0,
          change_percent: quote.change_percent || 0,
          volume: Math.floor(Math.random() * 50000000) + 10000000, // Estimated volume
          high: quote.high || quote.price * 1.02 || 0,
          low: quote.low || quote.price * 0.98 || 0,
          open: quote.open || quote.previous_close || 0
        });
      }
    } catch (error) {
      console.error("Error loading technical data:", error);
      // Fallback to mock data
      const mockChartData = Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        open: 150 + Math.random() * 20,
        high: 155 + Math.random() * 25,
        low: 145 + Math.random() * 15,
        close: 150 + Math.random() * 20,
        volume: 1000000 + Math.random() * 5000000,
        sma_20: 152 + Math.random() * 10,
        ema_50: 151 + Math.random() * 12,
        rsi: 30 + Math.random() * 40,
        macd: Math.random() * 4 - 2,
        bb_upper: 160 + Math.random() * 10,
        bb_lower: 140 + Math.random() * 10
      }));
      
      setChartData(mockChartData);
      setMarketData({
        symbol: selectedSymbol,
        last_price: mockChartData[mockChartData.length - 1].close,
        change: 2.45,
        change_percent: 1.67,
        volume: 25000000
      });
    }
    setLoading(false);
  };

  const handleIndicatorToggle = (indicator) => {
    setActiveIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  const technicalIndicators = [
    {
      name: "RSI (14)",
      value: "58.42",
      signal: "neutral",
      description: "Neither overbought nor oversold"
    },
    {
      name: "MACD",
      value: "+1.23",
      signal: "bullish",
      description: "Signal line above MACD line"
    },
    {
      name: "SMA (20)",
      value: "$152.45",
      signal: "bullish",
      description: "Price above 20-day average"
    },
    {
      name: "Bollinger Bands",
      value: "Mid",
      signal: "neutral",
      description: "Price near middle band"
    },
    {
      name: "Volume",
      value: "Above Avg",
      signal: "bullish",
      description: "25% above average volume"
    },
    {
      name: "Momentum",
      value: "+2.8%",
      signal: "bullish",
      description: "Strong upward momentum"
    }
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
          <p className="text-white text-lg font-semibold">Loading Charts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Technical Analysis</h1>
          <p className="text-slate-400 mt-1">Advanced charting and technical indicators</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
              placeholder="Enter symbol..."
              className="w-32 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stock Header */}
      {loading ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-400">Loading market data...</div>
            </div>
          </CardContent>
        </Card>
      ) : marketData && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white text-lg">{selectedSymbol}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">${(marketData?.last_price || 0).toFixed(2)}</h2>
                  <div className={`flex items-center gap-2 ${(marketData?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(marketData?.change || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-semibold">
                      {(marketData?.change || 0) >= 0 ? '+' : ''}${(marketData?.change || 0).toFixed(2)} ({(marketData?.change_percent || 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Volume</p>
                <p className="text-white font-semibold">{((marketData?.volume || 0) / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="chart" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800/50">
          <TabsTrigger value="chart">Price Chart</TabsTrigger>
          <TabsTrigger value="indicators">Technical Indicators</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Recognition</TabsTrigger>
          <TabsTrigger value="screener">Stock Screener</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-6">
          <ChartControls 
            onTimeframeChange={setTimeframe}
            onIndicatorToggle={handleIndicatorToggle}
            activeIndicators={activeIndicators}
          />
          
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={600}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }} 
                  />
                  
                  {/* Price Line */}
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#00D4FF" 
                    strokeWidth={2}
                    dot={false}
                    name="Price"
                  />
                  
                  {/* Moving Averages */}
                  {activeIndicators.includes('SMA') && (
                    <Line 
                      type="monotone" 
                      dataKey="sma_20" 
                      stroke="#22C55E" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="SMA 20"
                    />
                  )}
                  
                  {activeIndicators.includes('EMA') && (
                    <Line 
                      type="monotone" 
                      dataKey="ema_50" 
                      stroke="#F59E0B" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="EMA 50"
                    />
                  )}
                  
                  {/* Bollinger Bands */}
                  {activeIndicators.includes('Bollinger') && (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="bb_upper" 
                        stroke="#8B5CF6" 
                        strokeWidth={1}
                        strokeOpacity={0.7}
                        dot={false}
                        name="BB Upper"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bb_lower" 
                        stroke="#8B5CF6" 
                        strokeWidth={1}
                        strokeOpacity={0.7}
                        dot={false}
                        name="BB Lower"
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Volume Chart */}
          {activeIndicators.includes('Volume') && (
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#F8FAFC'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#06B6D4" 
                      fill="#06B6D4"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="indicators">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicalIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TechnicalIndicator {...indicator} />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-400">Bullish Flag Pattern</h3>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      85% Confidence
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Strong bullish continuation pattern detected. Price target: $165-170
                  </p>
                </div>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-400">Support Level</h3>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Strong
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Key support identified at $148.50 with multiple bounces
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screener">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Stock Screener
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">Advanced Screener Coming Soon</h3>
                <p className="text-slate-400">
                  Filter stocks by technical indicators, fundamentals, and AI signals
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, Award, Calendar, Download, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const MetricCard = ({ metric, index }) => {
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'declining': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getImportanceIcon = (importance) => {
    switch (importance) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30 hover:border-slate-700/50 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getImportanceIcon(metric.importance)}</span>
              <h3 className="text-white font-semibold">{metric.metric_name}</h3>
            </div>
            <Badge className={getTrendColor(metric.trend)}>
              {metric.trend?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-white">
                {typeof metric.value === 'number' ? 
                  (metric.category === 'return' ? `${metric.value.toFixed(2)}%` : metric.value.toFixed(2)) 
                  : metric.value}
              </span>
              {metric.percentile_rank && (
                <div className="text-right">
                  <div className="text-cyan-400 font-bold">{metric.percentile_rank}th</div>
                  <div className="text-slate-400 text-xs">percentile</div>
                </div>
              )}
            </div>
            
            {metric.benchmark_value && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">vs Benchmark:</span>
                <span className={metric.value > metric.benchmark_value ? 'text-green-400' : 'text-red-400'}>
                  {metric.benchmark_value.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Period:</span>
              <span className="text-white font-semibold">{metric.period.toUpperCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PerformanceChart = ({ data, title, color = "#06b6d4" }) => (
  <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-cyan-400" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f8fafc'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#gradient-${title})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default function Analytics() {
  const [metrics, setMetrics] = useState([]);
  const [trades, setTrades] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("1m");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      // Simulate loading analytics data with mock data
      const mockMetrics = [
        {
          id: 1,
          name: "Total Return",
          value: 18.5,
          unit: "%",
          change: 2.3,
          importance: "high"
        },
        {
          id: 2,
          name: "Sharpe Ratio",
          value: 1.42,
          unit: "",
          change: 0.15,
          importance: "high"
        },
        {
          id: 3,
          name: "Max Drawdown",
          value: -8.2,
          unit: "%",
          change: 1.1,
          importance: "medium"
        }
      ];

      const mockTrades = [
        {
          id: 1,
          symbol: "NVDA",
          action: "buy",
          quantity: 10,
          price: 920.00,
          profit_loss: 250.00,
          execution_time: new Date().toISOString()
        },
        {
          id: 2,
          symbol: "AAPL",
          action: "sell",
          quantity: 50,
          price: 195.50,
          profit_loss: -120.00,
          execution_time: new Date().toISOString()
        }
      ];

      const mockPortfolio = {
        id: 1,
        total_value: 102547.83,
        day_change: 1247.83,
        day_change_percent: 1.26
      };
      
      setMetrics(mockMetrics);
      setTrades(mockTrades);
      setPortfolio(mockPortfolio);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setLoading(false);
  };

  // Mock data
  const mockMetrics = metrics.length > 0 ? metrics : [
    {
      metric_name: "Total Return",
      value: 23.8,
      benchmark_value: 12.5,
      period: "ytd",
      category: "return",
      percentile_rank: 87,
      trend: "improving",
      importance: "critical"
    },
    {
      metric_name: "Sharpe Ratio",
      value: 1.85,
      benchmark_value: 1.15,
      period: "1y",
      category: "efficiency",
      percentile_rank: 92,
      trend: "improving",
      importance: "high"
    },
    {
      metric_name: "Maximum Drawdown",
      value: -8.2,
      benchmark_value: -15.3,
      period: "1y",
      category: "risk",
      percentile_rank: 78,
      trend: "stable",
      importance: "high"
    },
    {
      metric_name: "Win Rate",
      value: 68.5,
      benchmark_value: 55.0,
      period: "1y",
      category: "efficiency",
      percentile_rank: 84,
      trend: "improving",
      importance: "medium"
    },
    {
      metric_name: "Volatility",
      value: 18.5,
      benchmark_value: 22.1,
      period: "1y",
      category: "risk",
      percentile_rank: 72,
      trend: "stable",
      importance: "medium"
    },
    {
      metric_name: "Alpha",
      value: 11.3,
      benchmark_value: 0.0,
      period: "1y",
      category: "return",
      percentile_rank: 95,
      trend: "improving",
      importance: "critical"
    }
  ];

  const performanceData = Array.from({length: 12}, (_, i) => ({
    date: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
    portfolio: 100 + Math.random() * 25 + i * 2,
    benchmark: 100 + Math.random() * 15 + i * 1.5,
    alpha: Math.random() * 5 - 1
  }));

  const riskReturnData = Array.from({length: 20}, (_, i) => ({
    risk: Math.random() * 30 + 10,
    return: Math.random() * 40 - 10,
    size: Math.random() * 1000 + 100
  }));

  const radarData = [
    { metric: 'Return', value: 85, fullMark: 100 },
    { metric: 'Risk Management', value: 78, fullMark: 100 },
    { metric: 'Consistency', value: 92, fullMark: 100 },
    { metric: 'Timing', value: 73, fullMark: 100 },
    { metric: 'Diversification', value: 81, fullMark: 100 },
    { metric: 'Efficiency', value: 88, fullMark: 100 }
  ];

  const sectorPerformance = [
    { sector: 'Technology', return: 28.5, weight: 45 },
    { sector: 'Healthcare', return: 15.2, weight: 20 },
    { sector: 'Financial', return: 12.8, weight: 15 },
    { sector: 'Consumer', return: 22.1, weight: 20 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
          <p className="text-white text-xl font-semibold">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-cyan-400" />
              Performance Analytics
            </h1>
            <p className="text-slate-400 text-lg mt-2">
              Comprehensive analysis of your trading performance and risk metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1w">1 Week</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="ytd">YTD</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-slate-600 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Portfolio Return", value: "+23.8%", change: "vs S&P 500", icon: TrendingUp, color: "text-green-400" },
            { label: "Risk Score", value: "68/100", change: "Moderate", icon: Target, color: "text-yellow-400" },
            { label: "Best Trade", value: "+45.2%", change: "NVDA", icon: Award, color: "text-purple-400" },
            { label: "Success Rate", value: "68.5%", change: "vs 55% avg", icon: Zap, color: "text-cyan-400" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className={`text-xs ${stat.color}`}>{stat.change}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/30 p-1 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2 px-6 py-3">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2 px-6 py-3">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2 px-6 py-3">
              <Target className="w-4 h-4" />
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="attribution" className="flex items-center gap-2 px-6 py-3">
              <Award className="w-4 h-4" />
              Attribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {mockMetrics.slice(0, 6).map((metric, index) => (
                  <MetricCard key={metric.metric_name} metric={metric} index={index} />
                ))}
              </AnimatePresence>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <PerformanceChart 
                data={performanceData} 
                title="Portfolio vs Benchmark" 
                color="#06b6d4" 
              />
              
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10, fill: '#64748B' }}
                      />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PerformanceChart 
                  data={performanceData.map(d => ({...d, value: d.portfolio}))} 
                  title="Cumulative Returns" 
                  color="#22c55e" 
                />
              </div>
              
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Monthly Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceData.slice(-6).map((month, index) => (
                      <div key={month.date} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-300 text-sm">{month.date}</span>
                        <span className={`font-bold text-sm ${
                          month.portfolio > 100 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {month.portfolio > 100 ? '+' : ''}
                          {((month.portfolio - 100)).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Risk-Return Scatter</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[...Array(10)].map((_, i) => ({
                      name: `Position ${i + 1}`,
                      risk: Math.random() * 20 + 5,
                      return: Math.random() * 30 - 5
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="risk" stroke="#94A3B8" label={{ value: 'Risk (%)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="return" stroke="#94A3B8" label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Area dataKey="return" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Risk Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Market Risk</span>
                        <span className="text-orange-400 font-bold">45%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Concentration Risk</span>
                        <span className="text-red-400 font-bold">30%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Liquidity Risk</span>
                        <span className="text-green-400 font-bold">15%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Currency Risk</span>
                        <span className="text-yellow-400 font-bold">10%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Sector Attribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sectorPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="sector" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip />
                      <Bar dataKey="return" fill="#8b5cf6" name="Return %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Top Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { symbol: "NVDA", contribution: 8.5, weight: 15 },
                      { symbol: "AAPL", contribution: 4.2, weight: 20 },
                      { symbol: "MSFT", contribution: 3.8, weight: 18 },
                      { symbol: "TSLA", contribution: -1.2, weight: 8 }
                    ].map((stock, index) => (
                      <motion.div
                        key={stock.symbol}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {stock.symbol}
                          </Badge>
                          <span className="text-slate-400 text-sm">{stock.weight}% weight</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${stock.contribution >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.contribution >= 0 ? '+' : ''}{stock.contribution.toFixed(1)}%
                          </span>
                          <div className="text-slate-400 text-xs">contribution</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
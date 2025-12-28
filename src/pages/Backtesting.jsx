import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Target, Play, BarChart3, TrendingUp, TrendingDown, Activity, Zap, Settings, Clock, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const SimulationCard = ({ simulation, onSelect, isSelected }) => {
  const performanceColor = simulation.total_return >= 0 ? 'text-green-400' : 'text-red-400';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onSelect(simulation)}
      className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-slate-800/50 ${
        isSelected ? 'border-blue-500 bg-slate-800/50' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400 font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-100 font-bold text-sm">{simulation.simulation_name}</h3>
            <p className="text-slate-400 text-xs capitalize">
              {simulation.simulation_type?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`${performanceColor} border-current/30 text-xs`}>
          {simulation.total_return >= 0 ? '+' : ''}{simulation.total_return?.toFixed(1)}%
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center bg-slate-800/50 p-2 rounded-md">
          <p className="text-slate-400">Sharpe</p>
          <p className="font-semibold text-slate-200">
            {simulation.sharpe_ratio?.toFixed(2) || 'N/A'}
          </p>
        </div>
        <div className="text-center bg-slate-800/50 p-2 rounded-md">
          <p className="text-slate-400">Max DD</p>
          <p className="font-semibold text-slate-200">
            {simulation.max_drawdown?.toFixed(1) || '0'}%
          </p>
        </div>
        <div className="text-center bg-slate-800/50 p-2 rounded-md">
          <p className="text-slate-400">Win Rate</p>
          <p className="font-semibold text-slate-200">
            {simulation.win_rate?.toFixed(0) || '0'}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function Backtesting() {
  const [simulations, setSimulations] = useState([]);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simulationConfig, setSimulationConfig] = useState({
    name: '',
    strategy: 'ai_momentum',
    start_date: '2023-01-01',
    end_date: '2024-01-01',
    initial_capital: 100000,
    risk_level: 'moderate'
  });

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      // Simulate loading backtesting simulations with mock data
      const mockSimulations = [
        {
          id: 1,
          name: "AI Momentum Strategy",
          strategy: "momentum",
          start_date: "2023-01-01",
          end_date: "2024-01-01",
          initial_capital: 100000,
          final_value: 118500,
          total_return: 18.5,
          sharpe_ratio: 1.42,
          max_drawdown: -8.2,
          win_rate: 0.68,
          created_date: new Date().toISOString()
        },
        {
          id: 2,
          name: "Mean Reversion Test",
          strategy: "mean_reversion",
          start_date: "2023-06-01", 
          end_date: "2024-06-01",
          initial_capital: 50000,
          final_value: 47200,
          total_return: -5.6,
          sharpe_ratio: -0.25,
          max_drawdown: -12.1,
          win_rate: 0.45,
          created_date: new Date().toISOString()
        }
      ];
      
      setSimulations(mockSimulations);
      if (mockSimulations.length > 0) {
        setSelectedSimulation(mockSimulations[0]);
      }
    } catch (error) {
      console.error("Error loading simulations:", error);
    }
    setLoading(false);
  };

  const runBacktest = async () => {
    setIsRunning(true);
    try {
      // Simulate running a backtest with mock results  
      await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate processing time
      
      const mockResults = {
        final_value: simulationConfig.initial_capital * (0.9 + Math.random() * 0.3), // Random between -10% and +20%
        total_return: (Math.random() - 0.4) * 30, // Random between -12% and +18%
        sharpe_ratio: 0.8 + Math.random() * 1.0, // Between 0.8 and 1.8
        max_drawdown: -(Math.random() * 12 + 3), // Between -3% and -15%
        win_rate: 0.45 + Math.random() * 0.25, // Between 45% and 70%
        total_trades: Math.floor(Math.random() * 300 + 100), // Between 100 and 400 trades
        monthly_returns: Array.from({length: 12}, (_, i) => ({
          month: new Date(2023, i, 1).toLocaleDateString('en', {month: 'short', year: 'numeric'}),
          return: (Math.random() - 0.5) * 8, // Monthly returns between -4% and +4%
          cumulative: Math.random() * 20 - 5, // Cumulative between -5% and +15%
          drawdown: -(Math.random() * 8) // Drawdown between 0% and -8%
        })),
        benchmark_comparison: {
          sp500_return: 11.5,
          outperformance: (Math.random() - 0.4) * 15, // Between -6% and +9%
          alpha: (Math.random() - 0.3) * 4, // Between -1.2 and +2.8
          beta: 0.8 + Math.random() * 0.6 // Between 0.8 and 1.4
        },
        risk_metrics: {
          volatility: 12 + Math.random() * 8, // Between 12% and 20%
          var_95: -(Math.random() * 3 + 1), // Between -1% and -4%
          sortino_ratio: 0.6 + Math.random() * 0.8 // Between 0.6 and 1.4
        }
      };

      const newSimulation = {
        id: Date.now(),
        name: simulationConfig.name || `Backtest ${Date.now()}`,
        ...mockResults,
        strategy_parameters: {
          strategy: simulationConfig.strategy,
          risk_level: simulationConfig.risk_level
        },
        created_date: new Date().toISOString()
      };

      setSimulations(prev => [newSimulation, ...prev]);
      setSelectedSimulation(newSimulation);
      
      // Reset form
      setSimulationConfig({
        name: '',
        strategy: 'ai_momentum',
        start_date: '2023-01-01',
        end_date: '2024-01-01',
        initial_capital: 100000,
        risk_level: 'moderate'
      });
    } catch (error) {
      console.error("Error running backtest:", error);
    }
    setIsRunning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Target className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
          <p className="text-white text-xl font-semibold">Loading Simulation Lab...</p>
        </div>
      </div>
    );
  }

  const performanceData = selectedSimulation?.monthly_returns || [
    { month: 'Jan 2023', return: 3.2, cumulative: 103.2, drawdown: 0 },
    { month: 'Feb 2023', return: -1.5, cumulative: 101.7, drawdown: -1.5 },
    { month: 'Mar 2023', return: 4.8, cumulative: 106.5, drawdown: 0 },
    { month: 'Apr 2023', return: 2.1, cumulative: 108.7, drawdown: 0 },
    { month: 'May 2023', return: -2.3, cumulative: 106.2, drawdown: -2.3 },
    { month: 'Jun 2023', return: 5.7, cumulative: 112.3, drawdown: 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        >
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Target className="w-10 h-10 text-cyan-400" />
              Strategy Backtesting Lab
            </h1>
            <p className="text-slate-400 text-lg mt-2">
              Test and optimize trading strategies with historical data
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="simulations" className="space-y-8">
          <TabsList className="bg-slate-900/50 border border-slate-800/30 p-1">
            <TabsTrigger value="simulations" className="flex items-center gap-2 px-6 py-3">
              <BarChart3 className="w-4 h-4" />
              Simulations
              {simulations.length > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-400 ml-2">
                  {simulations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2 px-6 py-3">
              <Play className="w-4 h-4" />
              Strategy Builder
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2 px-6 py-3">
              <Activity className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulations" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Simulations List */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-xl">Recent Simulations</h3>
                  <Button 
                    size="sm" 
                    className="bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => setSelectedSimulation(null)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    New Test
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  <AnimatePresence>
                    {(simulations.length > 0 ? simulations : [
                      {
                        id: 1,
                        simulation_name: "AI Momentum Strategy",
                        simulation_type: "backtesting",
                        total_return: 23.8,
                        final_value: 123800,
                        sharpe_ratio: 1.85,
                        max_drawdown: -8.2,
                        win_rate: 67.5,
                        total_trades: 156,
                        start_date: "2023-01-01",
                        end_date: "2024-01-01",
                        initial_capital: 100000
                      },
                      {
                        id: 2,
                        simulation_name: "Mean Reversion Bot",
                        simulation_type: "backtesting",
                        total_return: 15.6,
                        final_value: 115600,
                        sharpe_ratio: 1.42,
                        max_drawdown: -12.1,
                        win_rate: 58.3,
                        total_trades: 203,
                        start_date: "2023-01-01",
                        end_date: "2024-01-01",
                        initial_capital: 100000
                      },
                      {
                        id: 3,
                        simulation_name: "Sector Rotation AI",
                        simulation_type: "backtesting",
                        total_return: 31.2,
                        final_value: 131200,
                        sharpe_ratio: 2.15,
                        max_drawdown: -6.8,
                        win_rate: 72.1,
                        total_trades: 89,
                        start_date: "2023-01-01",
                        end_date: "2024-01-01",
                        initial_capital: 100000
                      }
                    ]).map((simulation) => (
                      <SimulationCard
                        key={simulation.id}
                        simulation={simulation}
                        onSelect={setSelectedSimulation}
                        isSelected={selectedSimulation?.id === simulation.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Results Display */}
              <div className="lg:col-span-2">
                {selectedSimulation ? (
                  <div className="space-y-6">
                    {/* Performance Chart */}
                    <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          Performance Analysis: {selectedSimulation.simulation_name}
                        </CardTitle>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {selectedSimulation.start_date} - {selectedSimulation.end_date}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400 mb-1">
                              {selectedSimulation.total_return >= 0 ? '+' : ''}
                              {selectedSimulation.total_return?.toFixed(1)}%
                            </div>
                            <div className="text-slate-400 text-sm">Total Return</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400 mb-1">
                              {selectedSimulation.sharpe_ratio?.toFixed(2)}
                            </div>
                            <div className="text-slate-400 text-sm">Sharpe Ratio</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400 mb-1">
                              {selectedSimulation.max_drawdown?.toFixed(1)}%
                            </div>
                            <div className="text-slate-400 text-sm">Max Drawdown</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400 mb-1">
                              {selectedSimulation.win_rate?.toFixed(0)}%
                            </div>
                            <div className="text-slate-400 text-sm">Win Rate</div>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={400}>
                          <AreaChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
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
                              dataKey="cumulative" 
                              stroke="#00D4FF" 
                              fill="url(#colorCumulative)" 
                              strokeWidth={2}
                            />
                            <defs>
                              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Additional Metrics */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                        <CardHeader>
                          <CardTitle className="text-white">Risk Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">Volatility</span>
                            <span className="text-orange-400 font-bold">
                              {selectedSimulation.risk_metrics?.volatility?.toFixed(1) || '18.5'}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">VaR (95%)</span>
                            <span className="text-red-400 font-bold">
                              ${Math.abs(selectedSimulation.risk_metrics?.var_95 || -2150).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">Sortino Ratio</span>
                            <span className="text-green-400 font-bold">
                              {selectedSimulation.risk_metrics?.sortino_ratio?.toFixed(2) || '2.14'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                        <CardHeader>
                          <CardTitle className="text-white">Benchmark Comparison</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">S&P 500 Return</span>
                            <span className="text-blue-400 font-bold">
                              {selectedSimulation.benchmark_comparison?.sp500_return?.toFixed(1) || '12.5'}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">Alpha</span>
                            <span className="text-green-400 font-bold">
                              {selectedSimulation.benchmark_comparison?.alpha?.toFixed(2) || '11.3'}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">Beta</span>
                            <span className="text-purple-400 font-bold">
                              {selectedSimulation.benchmark_comparison?.beta?.toFixed(2) || '1.12'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30 h-full flex items-center justify-center">
                    <CardContent className="text-center py-16">
                      <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-white font-bold text-xl mb-2">No Simulation Selected</h3>
                      <p className="text-slate-400 mb-6">
                        Select a simulation from the list or create a new one to view results
                      </p>
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <Play className="w-4 h-4 mr-2" />
                        Run New Backtest
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="builder" className="space-y-8">
            <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  Strategy Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="sim-name" className="text-slate-300 font-semibold">Strategy Name</Label>
                      <Input
                        id="sim-name"
                        value={simulationConfig.name}
                        onChange={(e) => setSimulationConfig({...simulationConfig, name: e.target.value})}
                        placeholder="My AI Strategy"
                        className="mt-2 bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 font-semibold">Strategy Type</Label>
                      <Select
                        value={simulationConfig.strategy}
                        onValueChange={(value) => setSimulationConfig({...simulationConfig, strategy: value})}
                      >
                        <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai_momentum">AI Momentum</SelectItem>
                          <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                          <SelectItem value="sector_rotation">Sector Rotation</SelectItem>
                          <SelectItem value="sentiment_driven">Sentiment Driven</SelectItem>
                          <SelectItem value="pairs_trading">Pairs Trading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 font-semibold">Risk Level</Label>
                      <Select
                        value={simulationConfig.risk_level}
                        onValueChange={(value) => setSimulationConfig({...simulationConfig, risk_level: value})}
                      >
                        <SelectTrigger className="mt-2 bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="capital" className="text-slate-300 font-semibold">Initial Capital</Label>
                      <Input
                        id="capital"
                        type="number"
                        value={simulationConfig.initial_capital}
                        onChange={(e) => setSimulationConfig({...simulationConfig, initial_capital: Number(e.target.value)})}
                        className="mt-2 bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="start-date" className="text-slate-300 font-semibold">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={simulationConfig.start_date}
                        onChange={(e) => setSimulationConfig({...simulationConfig, start_date: e.target.value})}
                        className="mt-2 bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-date" className="text-slate-300 font-semibold">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={simulationConfig.end_date}
                        onChange={(e) => setSimulationConfig({...simulationConfig, end_date: e.target.value})}
                        className="mt-2 bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-800/30">
                  <Button 
                    onClick={runBacktest}
                    disabled={isRunning}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 h-12 text-lg font-semibold"
                  >
                    {isRunning ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        Running Backtest...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-3" />
                        Run Backtest Simulation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Strategy Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { strategy: 'AI Momentum', return: 23.8, sharpe: 1.85 },
                      { strategy: 'Mean Reversion', return: 15.6, sharpe: 1.42 },
                      { strategy: 'Sector Rotation', return: 31.2, sharpe: 2.15 },
                      { strategy: 'S&P 500', return: 12.5, sharpe: 1.15 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="strategy" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#F8FAFC'
                        }} 
                      />
                      <Bar dataKey="return" fill="#00D4FF" name="Total Return %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Risk-Return Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">89.7%</div>
                      <div className="text-slate-400">Strategies Outperforming S&P 500</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400">Best Sharpe Ratio</span>
                        <span className="text-cyan-400 font-bold">2.15 (Sector Rotation)</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400">Lowest Drawdown</span>
                        <span className="text-green-400 font-bold">-6.8% (Sector Rotation)</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400">Avg Win Rate</span>
                        <span className="text-purple-400 font-bold">65.9%</span>
                      </div>
                    </div>
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
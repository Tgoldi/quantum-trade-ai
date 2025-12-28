import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

export default function TradingSimulator() {
  const [simulations, setSimulations] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [simulationConfig, setSimulationConfig] = useState({
    name: '',
    type: 'strategy_testing',
    start_date: '2023-01-01',
    end_date: '2024-01-01',
    initial_capital: 100000
  });

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      // Simulate loading trading simulations with mock data
      const mockSimulations = [
        {
          id: 1,
          name: "AI Strategy Test",
          strategy_type: "momentum",
          profit_loss: 2450.00,
          win_rate: 0.72,
          created_date: new Date().toISOString()
        },
        {
          id: 2,
          name: "Risk Parity Model",
          strategy_type: "risk_parity",
          profit_loss: -180.50,
          win_rate: 0.48,
          created_date: new Date().toISOString()
        }
      ];
      
      setSimulations(mockSimulations);
    } catch (error) {
      console.error("Error loading simulations:", error);
    }
  };

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      // Simulate running a trading simulation with mock results
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
      
      const mockResults = {
        final_value: simulationConfig.initial_capital * (0.8 + Math.random() * 0.4), // Random return between -20% and +20%
        total_return: (Math.random() - 0.5) * 40, // Random return between -20% and +20%
        sharpe_ratio: 0.5 + Math.random() * 1.5, // Random Sharpe between 0.5 and 2.0
        max_drawdown: -(Math.random() * 15 + 2), // Random drawdown between -2% and -17%
        win_rate: 0.4 + Math.random() * 0.4, // Random win rate between 40% and 80%
        total_trades: Math.floor(Math.random() * 200 + 50), // Random trades between 50 and 250
        performance_data: Array.from({length: 30}, (_, i) => ({
          date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          portfolio_value: simulationConfig.initial_capital * (1 + (Math.random() - 0.5) * 0.3),
          cumulative_return: (Math.random() - 0.5) * 25
        }))
      };

      const newSimulation = {
        id: Date.now(),
        ...simulationConfig,
        simulation_name: simulationConfig.name || `Simulation ${Date.now()}`,
        ...mockResults,
        benchmark_comparison: {
          sp500_return: 12.5,
          outperformance: mockResults.total_return - 12.5
        },
        created_date: new Date().toISOString()
      };
      
      setSimulations(prev => [newSimulation, ...prev]);
      setSelectedSimulation(newSimulation);
    } catch (error) {
      console.error("Error running simulation:", error);
    }
    setIsRunning(false);
  };

  const getSimulationColor = (type) => {
    switch (type) {
      case 'backtesting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'stress_testing': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'strategy_testing': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scenario_analysis': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Configuration */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center gap-2 text-white">
            <Play className="w-5 h-5 text-green-400" />
            Trading Simulation Lab
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="sim-name" className="text-slate-300">Simulation Name</Label>
              <Input
                id="sim-name"
                value={simulationConfig.name}
                onChange={(e) => setSimulationConfig({...simulationConfig, name: e.target.value})}
                placeholder="My Strategy Test"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Simulation Type</Label>
              <Select
                value={simulationConfig.type}
                onValueChange={(value) => setSimulationConfig({...simulationConfig, type: value})}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backtesting">Backtesting</SelectItem>
                  <SelectItem value="stress_testing">Stress Testing</SelectItem>
                  <SelectItem value="strategy_testing">Strategy Testing</SelectItem>
                  <SelectItem value="scenario_analysis">Scenario Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capital" className="text-slate-300">Initial Capital</Label>
              <Input
                id="capital"
                type="number"
                value={simulationConfig.initial_capital}
                onChange={(e) => setSimulationConfig({...simulationConfig, initial_capital: Number(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-slate-300">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={simulationConfig.start_date}
                onChange={(e) => setSimulationConfig({...simulationConfig, start_date: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-slate-300">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={simulationConfig.end_date}
                onChange={(e) => setSimulationConfig({...simulationConfig, end_date: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={runSimulation}
                disabled={isRunning}
                className="w-full bg-green-600/80 hover:bg-green-600"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Simulation History */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
          <CardHeader className="border-b border-slate-800/50">
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Simulation History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {simulations.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No simulations run yet. Start your first simulation above!
              </div>
            ) : (
              <div className="space-y-1">
                {simulations.map((sim, index) => (
                  <motion.div
                    key={sim.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 hover:bg-slate-800/20 transition-colors border-b border-slate-800/20 last:border-0 cursor-pointer ${
                      selectedSimulation?.id === sim.id ? 'bg-slate-800/30' : ''
                    }`}
                    onClick={() => setSelectedSimulation(sim)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {sim.simulation_name}
                          </div>
                          <Badge className={getSimulationColor(sim.simulation_type)}>
                            {sim.simulation_type?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-bold ${sim.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {sim.total_return >= 0 ? '+' : ''}{sim.total_return?.toFixed(2)}%
                        </div>
                        <div className="text-xs text-slate-400">
                          Sharpe: {sim.sharpe_ratio?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                      <div>Max DD: {sim.max_drawdown?.toFixed(2)}%</div>
                      <div>Win Rate: {sim.win_rate?.toFixed(0)}%</div>
                      <div>Trades: {sim.total_trades}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        {selectedSimulation && (
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Performance Chart: {selectedSimulation.simulation_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${selectedSimulation.final_value?.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Final Value</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    selectedSimulation.benchmark_comparison?.outperformance >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedSimulation.benchmark_comparison?.outperformance >= 0 ? '+' : ''}
                    {selectedSimulation.benchmark_comparison?.outperformance?.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-400">vs S&P 500</div>
                </div>
              </div>

              {selectedSimulation.performance_data && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedSimulation.performance_data}>
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
                    <Line 
                      type="monotone" 
                      dataKey="cumulative_return" 
                      stroke="#00FF88" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
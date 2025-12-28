import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, TrendingDown, Target, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import backendService from '@/api/backendService';

export default function AdvancedRiskAnalysis() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    loadRiskScenarios();
  }, []);

  const loadRiskScenarios = async () => {
    try {
      // Use backendService for authenticated API calls (it adds /api prefix)
      const data = await backendService.makeRequest('/risk/scenarios');
      const scenariosArray = data.scenarios || [];
      setScenarios(scenariosArray);
      if (scenariosArray && scenariosArray.length > 0) setSelectedScenario(scenariosArray[0]);
      console.log('✅ Loaded real risk scenarios');
    } catch (error) {
      console.error('Error loading risk scenarios:', error);
      setScenarios([]);
    }
    setLoading(false);
  };

  const getScenarioColor = (scenarioType) => {
    switch (scenarioType) {
      case 'market_crash': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'interest_rate_shock': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'geopolitical_crisis': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'sector_rotation': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRiskLevel = (probability) => {
    if (probability > 0.7) return { level: 'HIGH', color: 'text-red-400' };
    if (probability > 0.4) return { level: 'MEDIUM', color: 'text-yellow-400' };
    return { level: 'LOW', color: 'text-green-400' };
  };

  const varData = scenarios.slice(0, 5).map(scenario => ({
    name: scenario.scenario_name?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown',
    var95: Math.abs(scenario.var_95 || 0),
    var99: Math.abs(scenario.var_99 || 0),
    probability: scenario.probability * 100
  }));


  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Risk Scenarios Overview */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-red-400" />
            Risk Scenario Analysis
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
              STRESS TEST
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-slate-400">Analyzing risk scenarios...</div>
          ) : (
            <div className="space-y-1">
              {scenarios.slice(0, 6).map((scenario, index) => {
                const risk = getRiskLevel(scenario.probability);
                return (
                  <div 
                    key={scenario.id || index}
                    className={`p-4 hover:bg-slate-800/20 transition-colors border-b border-slate-800/20 last:border-0 cursor-pointer ${
                      selectedScenario?.id === scenario.id ? 'bg-slate-800/30' : ''
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {scenario.scenario_name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <Badge className={getScenarioColor(scenario.scenario_type)}>
                            {scenario.scenario_type?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-bold ${risk.color}`}>
                          {(scenario.probability * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">{risk.level} RISK</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Portfolio Impact:</span>
                        <span className="text-red-400 font-semibold">
                          {scenario.portfolio_impact}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.abs(scenario.portfolio_impact)} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VaR Analysis Chart */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="w-5 h-5 text-orange-400" />
            Value at Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={varData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                stroke="#94A3B8" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#F8FAFC'
                }} 
              />
              <Bar dataKey="var95" fill="#FFB800" name="VaR 95%" />
              <Bar dataKey="var99" fill="#FF4757" name="VaR 99%" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Scenario Analysis */}
      {selectedScenario && (
        <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
          <CardHeader className="border-b border-slate-800/50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-blue-400" />
                Scenario Deep Dive: {selectedScenario.scenario_name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <Button 
                size="sm" 
                className="bg-blue-600/80 hover:bg-blue-600"
                onClick={() => {/* TODO: Implement stress test */}}
              >
                Run Stress Test
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-slate-400">Probability</div>
                <div className="text-2xl font-bold text-orange-400">
                  {(selectedScenario.probability * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-slate-400">Portfolio Impact</div>
                <div className="text-2xl font-bold text-red-400">
                  {selectedScenario.portfolio_impact}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-slate-400">VaR 99%</div>
                <div className="text-2xl font-bold text-red-400">
                  ${Math.abs(selectedScenario.var_99 || 0).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-slate-400">Recovery Time</div>
                <div className="text-2xl font-bold text-blue-400 flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  {selectedScenario.recovery_time_days || 'N/A'} days
                </div>
              </div>
            </div>
            
            {selectedScenario.hedging_strategies && selectedScenario.hedging_strategies.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-3">Recommended Hedging Strategies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScenario.hedging_strategies.map((strategy, idx) => (
                    <Badge 
                      key={idx}
                      className="bg-green-500/20 text-green-400 border-green-500/30"
                    >
                      {strategy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
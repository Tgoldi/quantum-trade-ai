import { useState, useEffect, useCallback } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, TrendingDown, Activity, Target, ShieldAlert, BarChart3, Settings, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RiskCard = ({ title, value, level, description, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-slate-900/70 border border-slate-800/50 rounded-lg p-4"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-slate-800`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <Badge variant="outline" className={`px-2 py-0.5 text-xs font-semibold ${
        level === 'LOW' ? 'border-green-500/30 text-green-400' :
        level === 'MEDIUM' ? 'border-yellow-500/30 text-yellow-400' :
        level === 'HIGH' ? 'border-red-500/30 text-red-400' :
        'border-slate-600'
      }`}>
        {level}
      </Badge>
    </div>
    <h3 className="text-slate-300 text-sm font-medium mb-1">{title}</h3>
    <div className="text-xl font-bold text-slate-50 mb-2">{value}</div>
    <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
  </motion.div>
);

const ScenarioCard = ({ scenario, onRunStressTest }) => (
  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/30 rounded-2xl p-6 hover:bg-slate-900/80 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-orange-400" />
        <h3 className="text-white font-bold text-lg">{scenario.scenario_name}</h3>
      </div>
      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1 font-semibold">
        {(scenario.probability * 100).toFixed(0)}% Probability
      </Badge>
    </div>
    
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-slate-400 text-sm">Portfolio Impact</span>
          <div className="text-red-400 font-bold text-lg">{scenario.portfolio_impact}%</div>
        </div>
        <div>
          <span className="text-slate-400 text-sm">VaR 99%</span>
          <div className="text-red-400 font-bold text-lg">${Math.abs(scenario.var_99).toLocaleString()}</div>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-400">Risk Level</span>
          <span className="text-white font-semibold">{Math.abs(scenario.portfolio_impact)}%</span>
        </div>
        <Progress value={Math.abs(scenario.portfolio_impact)} className="h-2 [&>div]:bg-red-400" />
      </div>
    </div>
    
    <Button 
      onClick={() => onRunStressTest(scenario)}
      className="w-full bg-red-600/80 hover:bg-red-600 border border-red-500/30"
    >
      <Target className="w-4 h-4 mr-2" />
      Run Stress Test
    </Button>
  </div>
);

export default function RiskManagement() {
  const [portfolio, setPortfolio] = useState(null);
  const [riskScenarios, setRiskScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadRiskData = useCallback(async () => {
    try {
      // Simulate loading risk data with mock data
      // Mock positions data removed as it's not used

      const mockRiskScenarios = [
        {
          id: 1,
          name: "Market Crash (-20%)",
          probability: 0.15,
          impact: "critical",
          estimated_loss: -20540.00,
          description: "Broad market decline affecting all positions"
        },
        {
          id: 2,
          name: "Tech Sector Rotation",
          probability: 0.35,
          impact: "high", 
          estimated_loss: -8200.00,
          description: "Rotation out of technology stocks"
        }
      ];
      
      setPortfolio(createDefaultPortfolio());
      setRiskScenarios(mockRiskScenarios);
    } catch (error) {
      console.error("Error loading risk data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRiskData();
  }, [loadRiskData]);

  const createDefaultPortfolio = () => ({
    total_value: 102547.83,
    max_drawdown: -3.2,
    var_95: -2150.72,
    var_99: -3420.15,
    beta: 1.15,
    volatility: 18.5,
    sharpe_ratio: 1.84
  });

  const riskMetrics = {
    var_95: portfolio?.var_95 || -2150.72,
    var_99: portfolio?.var_99 || -3420.15,
    max_drawdown: portfolio?.max_drawdown || -3.2,
    beta: portfolio?.beta || 1.15,
    volatility: portfolio?.volatility || 18.5,
    concentration_risk: 22.5,
    correlation_risk: 0.73,
    liquidity_risk: 2.1
  };

  const riskTimelineData = [
    { date: '1W', var95: -1800, var99: -2900 },
    { date: '2W', var95: -2100, var99: -3200 },
    { date: '1M', var95: -2400, var99: -3600 },
    { date: '3M', var95: -2150, var99: -3420 },
    { date: '6M', var95: -1950, var99: -3100 },
    { date: 'Now', var95: -2150, var99: -3420 }
  ];

  const sectorRiskData = [
    { name: 'Technology', risk: 68, color: '#00D4FF' },
    { name: 'Consumer Disc.', risk: 15, color: '#00FF88' },
    { name: 'Communication', risk: 12, color: '#FFB800' },
    { name: 'Cash', risk: 5, color: '#94A3B8' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-orange-400 mx-auto animate-pulse" />
          <p className="text-white text-xl font-semibold">Loading Risk Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-orange-400" />
              Risk Management Center
            </h1>
            <p className="text-slate-400 text-lg mt-1">
              Advanced portfolio risk analysis and scenario testing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-slate-900/70 border-slate-700 hover:bg-slate-800">
              <Bell className="w-4 h-4 mr-2" />
              Risk Alerts
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Settings className="w-4 h-4 mr-2" />
              Configure Limits
            </Button>
          </div>
        </motion.div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RiskCard
            title="Value at Risk (95%)"
            value={`$${Math.abs(riskMetrics.var_95).toLocaleString()}`}
            level="MEDIUM"
            description="Max loss over 1 day"
            icon={TrendingDown}
            color="text-red-400"
          />
          <RiskCard
            title="Portfolio Beta"
            value={riskMetrics.beta.toFixed(2)}
            level="MEDIUM"
            description="Volatility vs. Market"
            icon={Activity}
            color="text-yellow-400"
          />
          <RiskCard
            title="Max Drawdown"
            value={`${riskMetrics.max_drawdown}%`}
            level="LOW"
            description="Largest peak-to-trough"
            icon={ShieldAlert}
            color="text-green-400"
          />
          <RiskCard
            title="Concentration"
            value={`${riskMetrics.concentration_risk}%`}
            level="HIGH"
            description="Largest single position"
            icon={Target}
            color="text-red-400"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/70 border border-slate-800/50 p-1 h-auto">
            <TabsTrigger value="overview">
              <Shield className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="scenarios">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Stress Scenarios
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Activity className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Controls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Risk Timeline */}
              <Card className="bg-slate-900/70 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Risk Timeline Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={riskTimelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                      <XAxis dataKey="date" stroke="var(--slate-400)" fontSize={12} />
                      <YAxis stroke="var(--slate-400)" fontSize={12}/>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          color: '#F8FAFC'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="var95" 
                        stroke="var(--accent-yellow)" 
                        strokeWidth={2}
                        name="VaR 95%"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="var99" 
                        stroke="var(--accent-red)" 
                        strokeWidth={2}
                        name="VaR 99%"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sector Risk Breakdown */}
              <Card className="bg-slate-900/70 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Sector Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={sectorRiskData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="risk"
                          paddingAngle={5}
                        >
                          {sectorRiskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="space-y-2">
                      {sectorRiskData.map((sector) => (
                        <div key={sector.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sector.color }} />
                             <span className="text-slate-300">{sector.name}</span>
                          </div>
                          <span className="font-semibold text-slate-100">{sector.risk}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {(riskScenarios.length > 0 ? riskScenarios : [
                  {
                    scenario_name: "Market Crash (-30%)",
                    probability: 0.08,
                    portfolio_impact: -28.5,
                    var_99: -15420,
                    scenario_type: "market_crash"
                  },
                  {
                    scenario_name: "Interest Rate Shock",
                    probability: 0.25,
                    portfolio_impact: -12.3,
                    var_99: -6850,
                    scenario_type: "interest_rate_shock"
                  },
                  {
                    scenario_name: "Tech Sector Rotation",
                    probability: 0.35,
                    portfolio_impact: -18.7,
                    var_99: -9200,
                    scenario_type: "sector_rotation"
                  },
                  {
                    scenario_name: "Geopolitical Crisis",
                    probability: 0.15,
                    portfolio_impact: -22.1,
                    var_99: -11300,
                    scenario_type: "geopolitical_crisis"
                  },
                  {
                    scenario_name: "Currency Crisis",
                    probability: 0.12,
                    portfolio_impact: -16.4,
                    var_99: -8750,
                    scenario_type: "currency_crisis"
                  },
                  {
                    scenario_name: "Liquidity Crunch",
                    probability: 0.18,
                    portfolio_impact: -25.6,
                    var_99: -13200,
                    scenario_type: "liquidity_crisis"
                  }
                ]).map((scenario, index) => (
                  <motion.div
                    key={`scenario-${scenario.scenario_name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ScenarioCard 
                      scenario={scenario} 
                      onRunStressTest={(scenario) => {
                        console.log("Running stress test for:", scenario.scenario_name);
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-slate-900/70 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Live Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-400 mb-2">68</div>
                      <div className="text-slate-400">Risk Score</div>
                      <div className="text-xs text-orange-400 mt-1">MODERATE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">1.15</div>
                      <div className="text-slate-400">Portfolio Beta</div>
                      <div className="text-xs text-yellow-400 mt-1">VS S&P 500</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-slate-300 font-medium">Correlation Risk</span>
                      <span className="text-orange-400 font-bold">0.73</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-slate-300 font-medium">Liquidity Risk</span>
                      <span className="text-blue-400 font-bold">2.1 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-slate-300 font-medium">Volatility (30d)</span>
                      <span className="text-purple-400 font-bold">{riskMetrics.volatility}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/70 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-red-400" />
                    Active Risk Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">High Concentration Risk</p>
                        <p className="text-red-400 text-sm mt-1">
                          NVDA position exceeds 20% allocation limit
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Triggered: 2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Elevated Market Volatility</p>
                        <p className="text-yellow-400 text-sm mt-1">
                          VIX above 25, consider hedging positions
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Triggered: 15 minutes ago
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <Card className="bg-slate-900/70 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-200">Risk Control Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-3">Maximum Position Size</label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={15} className="h-3" />
                        </div>
                        <span className="text-white font-bold min-w-[3rem]">15%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-slate-300 font-semibold block mb-3">Portfolio VaR Limit</label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={5} className="h-3" />
                        </div>
                        <span className="text-white font-bold min-w-[3rem]">5%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-slate-300 font-semibold block mb-3">Maximum Drawdown</label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={10} className="h-3" />
                        </div>
                        <span className="text-white font-bold min-w-[3rem]">10%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-800/30 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Auto-Hedging</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Enable Auto-Hedging</span>
                          <Button variant="outline" size="sm" className="border-green-600 text-green-400">
                            Enabled
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Hedge Threshold</span>
                          <span className="text-white font-semibold">{'>'} VaR 4%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800/30 rounded-xl">
                      <h4 className="text-white font-semibold mb-3">Circuit Breakers</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Daily Loss Limit</span>
                          <span className="text-red-400 font-semibold">-$5,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Emergency Stop</span>
                          <Button variant="outline" size="sm" className="border-slate-600">
                            Armed
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
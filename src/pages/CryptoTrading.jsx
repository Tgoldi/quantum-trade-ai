import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bitcoin, Coins, TrendingUp, TrendingDown, Zap, DollarSign, Target, Flame, Shield, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Tooltip } from 'recharts';

const CryptoCard = ({ crypto, index, onTrade }) => {
  const isPositive = crypto.change_24h >= 0;
  const fearGreedColor = 
    crypto.fear_greed_index > 75 ? 'text-red-400' :
    crypto.fear_greed_index > 50 ? 'text-orange-400' :
    crypto.fear_greed_index > 25 ? 'text-yellow-400' : 'text-green-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <Card className="relative bg-slate-900/60 backdrop-blur-xl border-slate-800/30 rounded-2xl hover:border-slate-700/50 transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  {crypto.symbol === 'BTC' ? (
                    <Bitcoin className="w-7 h-7 text-white" />
                  ) : (
                    <Coins className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{crypto.symbol}</h3>
                <p className="text-slate-400 text-sm">{crypto.name}</p>
              </div>
            </div>
            <Badge className={`${fearGreedColor} bg-current/10 border-current/30`}>
              #{crypto.market_cap_rank}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                ${crypto.price_usd?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="text-slate-400 text-sm">
                ₿{crypto.price_btc?.toFixed(8)}
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">
                  {isPositive ? '+' : ''}{crypto.change_24h?.toFixed(2)}%
                </span>
              </div>
              <div className="text-slate-400 text-sm">24h</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Market Cap</div>
              <div className="text-white font-semibold text-sm">
                ${(crypto.market_cap / 1e9).toFixed(2)}B
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Volume (24h)</div>
              <div className="text-white font-semibold text-sm">
                ${(crypto.volume_24h / 1e6).toFixed(1)}M
              </div>
            </div>
          </div>
          
          {crypto.staking_apy && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Staking APY</span>
              </div>
              <span className="text-purple-300 font-bold">{crypto.staking_apy}%</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={() => onTrade(crypto, 'buy')}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            >
              Buy
            </Button>
            <Button
              onClick={() => onTrade(crypto, 'sell')}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Sell
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DeFiProtocolCard = ({ protocol }) => (
  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold">{protocol.name}</h3>
          <p className="text-slate-400 text-sm">{protocol.category}</p>
        </div>
      </div>
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        {protocol.apy}% APY
      </Badge>
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">TVL</span>
        <span className="text-white font-semibold">${protocol.tvl}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Your Position</span>
        <span className="text-cyan-400 font-semibold">${protocol.position || '0'}</span>
      </div>
    </div>
  </div>
);

export default function CryptoTrading() {
  const [cryptos, setCryptos] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("markets");

  useEffect(() => {
    loadCryptoData();
  }, []);

  const loadCryptoData = async () => {
    try {
      const [cryptoData, positionData] = await Promise.all([
        CryptoAsset.list("-market_cap", 20),
        CryptoPosition.list("-market_value_usd", 10)
      ]);
      
      setCryptos(cryptoData);
      setPositions(positionData);
    } catch (error) {
      console.error("Error loading crypto data:", error);
    }
    setLoading(false);
  };

  const handleTrade = (crypto, action) => {
    console.log(`${action.toUpperCase()} ${crypto.symbol}`);
    // Integrate with order management
  };

  // Mock data if none exists
  const mockCryptos = cryptos.length > 0 ? cryptos : [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price_usd: 43250.75,
      price_btc: 1.0,
      market_cap: 847000000000,
      volume_24h: 28400000000,
      change_24h: 2.45,
      change_7d: -1.23,
      market_cap_rank: 1,
      fear_greed_index: 68,
      circulating_supply: 19600000,
      max_supply: 21000000
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price_usd: 2650.30,
      price_btc: 0.061,
      market_cap: 318000000000,
      volume_24h: 15200000000,
      change_24h: 3.12,
      change_7d: 0.89,
      market_cap_rank: 2,
      fear_greed_index: 72,
      staking_apy: 4.2,
      defi_protocols: ["Uniswap", "Compound", "Aave"]
    },
    {
      symbol: "SOL",
      name: "Solana",
      price_usd: 98.45,
      price_btc: 0.00228,
      market_cap: 42800000000,
      volume_24h: 2100000000,
      change_24h: 5.67,
      change_7d: 12.34,
      market_cap_rank: 5,
      fear_greed_index: 78,
      staking_apy: 7.1
    }
  ];

  const defiProtocols = [
    { name: "Uniswap V3", category: "DEX", apy: "12.5", tvl: "4.2B", position: "2,500" },
    { name: "Aave", category: "Lending", apy: "8.3", tvl: "11.8B", position: "1,200" },
    { name: "Compound", category: "Lending", apy: "6.7", tvl: "3.1B", position: "800" },
    { name: "Curve", category: "Stablecoins", apy: "15.2", tvl: "2.9B", position: "0" }
  ];

  const portfolioData = [
    { name: 'BTC', value: 45000, percentage: 60, color: '#F7931A' },
    { name: 'ETH', value: 22500, percentage: 30, color: '#627EEA' },
    { name: 'SOL', value: 7500, percentage: 10, color: '#9945FF' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bitcoin className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
          <p className="text-white text-xl font-semibold">Loading Crypto Markets...</p>
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
              <Bitcoin className="w-10 h-10 text-orange-500" />
              Crypto Trading
            </h1>
            <p className="text-slate-400 text-lg mt-2">
              Trade cryptocurrencies, earn yield, and explore DeFi protocols
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Markets Open 24/7
            </Badge>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Crypto Market Cap", value: "$1.67T", change: "+2.4%", icon: DollarSign, color: "text-green-400" },
            { label: "Bitcoin Dominance", value: "50.7%", change: "-0.1%", icon: Bitcoin, color: "text-orange-400" },
            { label: "Total Volume (24h)", value: "$89.2B", change: "+15.6%", icon: BarChart, color: "text-blue-400" },
            { label: "Fear & Greed Index", value: "72", change: "Greed", icon: Flame, color: "text-yellow-400" }
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

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/30 p-1 h-auto">
            <TabsTrigger value="markets" className="flex items-center gap-2 px-6 py-3">
              <Coins className="w-4 h-4" />
              Markets
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2 px-6 py-3">
              <Target className="w-4 h-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex items-center gap-2 px-6 py-3">
              <Zap className="w-4 h-4" />
              DeFi
            </TabsTrigger>
            <TabsTrigger value="staking" className="flex items-center gap-2 px-6 py-3">
              <Shield className="w-4 h-4" />
              Staking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {mockCryptos.map((crypto, index) => (
                  <CryptoCard
                    key={crypto.symbol}
                    crypto={crypto}
                    index={index}
                    onTrade={handleTrade}
                  />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={5}
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2 mt-4">
                    {portfolioData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">{item.percentage}%</span>
                          <div className="text-slate-400 text-xs">${item.value.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={Array.from({length: 30}, (_, i) => ({
                        date: `Day ${i + 1}`,
                        value: 70000 + Math.random() * 10000 + i * 500
                      }))}>
                        <defs>
                          <linearGradient id="cryptoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#f8fafc'
                          }} 
                        />
                        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#cryptoGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="defi" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {defiProtocols.map((protocol, index) => (
                <motion.div
                  key={protocol.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DeFiProtocolCard protocol={protocol} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staking" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCryptos.filter(c => c.staking_apy).map((crypto, index) => (
                <Card key={crypto.symbol} className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        {crypto.symbol === 'ETH' ? <Coins className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{crypto.symbol} Staking</h3>
                        <p className="text-slate-400 text-sm">Earn {crypto.staking_apy}% APY</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Current APY</span>
                        <span className="text-green-400 font-bold">{crypto.staking_apy}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Min. Stake</span>
                        <span className="text-white">32 {crypto.symbol}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Lock Period</span>
                        <span className="text-white">Flexible</span>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Start Staking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
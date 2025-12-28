import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Calculator, Target, Clock, Zap, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GreeksDisplay = ({ greeks }) => (
  <div className="grid grid-cols-5 gap-2 text-xs">
    <div className="text-center">
      <div className="text-slate-400">Δ</div>
      <div className="text-white font-semibold">{greeks.delta?.toFixed(3)}</div>
    </div>
    <div className="text-center">
      <div className="text-slate-400">Γ</div>
      <div className="text-white font-semibold">{greeks.gamma?.toFixed(3)}</div>
    </div>
    <div className="text-center">
      <div className="text-slate-400">Θ</div>
      <div className="text-red-400 font-semibold">{greeks.theta?.toFixed(3)}</div>
    </div>
    <div className="text-center">
      <div className="text-slate-400">ν</div>
      <div className="text-purple-400 font-semibold">{greeks.vega?.toFixed(3)}</div>
    </div>
    <div className="text-center">
      <div className="text-slate-400">ρ</div>
      <div className="text-cyan-400 font-semibold">{greeks.rho?.toFixed(3)}</div>
    </div>
  </div>
);

const OptionRow = ({ option, onTrade }) => {
  const isCall = option.option_type === 'call';
  const isITM = isCall 
    ? option.strike_price < option.underlying_price
    : option.strike_price > option.underlying_price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border rounded-lg transition-colors hover:bg-slate-800/30 ${
        isITM ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-900/30 border-slate-800/50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge className={`${isCall ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-current/30`}>
            {option.option_type.toUpperCase()}
          </Badge>
          <div>
            <div className="text-white font-bold">${option.strike_price}</div>
            <div className="text-slate-400 text-sm">{option.days_to_expiration} days</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">${option.last_price?.toFixed(2)}</div>
          <div className="text-xs text-slate-400">
            ${option.bid_price?.toFixed(2)} × ${option.ask_price?.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
        <div>
          <div className="text-slate-400">Volume</div>
          <div className="text-white">{option.volume?.toLocaleString() || '0'}</div>
        </div>
        <div>
          <div className="text-slate-400">Open Int</div>
          <div className="text-cyan-400">{option.open_interest?.toLocaleString() || '0'}</div>
        </div>
        <div>
          <div className="text-slate-400">IV</div>
          <div className="text-purple-400">{(option.implied_volatility * 100)?.toFixed(1)}%</div>
        </div>
      </div>

      <GreeksDisplay greeks={{
        delta: option.delta,
        gamma: option.gamma,
        theta: option.theta,
        vega: option.vega,
        rho: option.rho
      }} />

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={() => onTrade(option, 'buy')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          Buy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onTrade(option, 'sell')}
          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          Sell
        </Button>
      </div>
    </motion.div>
  );
};

const OptionsCalculator = () => {
  const [calcInputs, setCalcInputs] = useState({
    underlying_price: 150,
    strike_price: 155,
    days_to_expiration: 30,
    implied_volatility: 0.25,
    risk_free_rate: 0.05,
    option_type: 'call'
  });

  // Mock Black-Scholes calculation
  const calculateOptionPrice = () => {
    // Simplified calculation for demo
    const timeValue = calcInputs.implied_volatility * Math.sqrt(calcInputs.days_to_expiration / 365);
    const intrinsicValue = Math.max(
      calcInputs.option_type === 'call' 
        ? calcInputs.underlying_price - calcInputs.strike_price
        : calcInputs.strike_price - calcInputs.underlying_price,
      0
    );
    return intrinsicValue + timeValue * calcInputs.underlying_price * 0.1;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-slate-300 text-sm block mb-1">Underlying Price</label>
          <Input
            type="number"
            value={calcInputs.underlying_price}
            onChange={(e) => setCalcInputs({...calcInputs, underlying_price: parseFloat(e.target.value)})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <div>
          <label className="text-slate-300 text-sm block mb-1">Strike Price</label>
          <Input
            type="number"
            value={calcInputs.strike_price}
            onChange={(e) => setCalcInputs({...calcInputs, strike_price: parseFloat(e.target.value)})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-slate-300 text-sm block mb-1">Days to Expiration</label>
          <Input
            type="number"
            value={calcInputs.days_to_expiration}
            onChange={(e) => setCalcInputs({...calcInputs, days_to_expiration: parseInt(e.target.value)})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <div>
          <label className="text-slate-300 text-sm block mb-1">IV (%)</label>
          <Input
            type="number"
            step="0.01"
            value={calcInputs.implied_volatility * 100}
            onChange={(e) => setCalcInputs({...calcInputs, implied_volatility: parseFloat(e.target.value) / 100})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <div>
          <label className="text-slate-300 text-sm block mb-1">Type</label>
          <Select
            value={calcInputs.option_type}
            onValueChange={(value) => setCalcInputs({...calcInputs, option_type: value})}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="put">Put</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-lg p-4">
        <div className="text-center">
          <div className="text-slate-400 text-sm mb-1">Theoretical Price</div>
          <div className="text-3xl font-bold text-cyan-400">
            ${calculateOptionPrice().toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OptionsTrading() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedExpiration, setSelectedExpiration] = useState('2024-01-19');
  const [optionsChain, setOptionsChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    loadOptionsChain();
  }, [selectedSymbol, selectedExpiration]);

  const loadOptionsChain = async () => {
    try {
      // Mock options data
      const mockOptions = [];
      const underlyingPrice = 150;
      const strikes = [140, 145, 150, 155, 160, 165, 170];
      
      strikes.forEach(strike => {
        ['call', 'put'].forEach(type => {
          const isCall = type === 'call';
          const isITM = isCall ? strike < underlyingPrice : strike > underlyingPrice;
          
          mockOptions.push({
            underlying_symbol: selectedSymbol,
            expiration_date: selectedExpiration,
            strike_price: strike,
            option_type: type,
            last_price: isITM ? Math.max(Math.abs(underlyingPrice - strike) + Math.random() * 5, 0.5) : Math.random() * 3 + 0.1,
            bid_price: Math.random() * 2 + 0.5,
            ask_price: Math.random() * 2 + 1,
            volume: Math.floor(Math.random() * 5000),
            open_interest: Math.floor(Math.random() * 10000),
            implied_volatility: 0.2 + Math.random() * 0.3,
            delta: isCall ? Math.random() * 0.8 + 0.1 : Math.random() * -0.8 - 0.1,
            gamma: Math.random() * 0.05,
            theta: -Math.random() * 0.1,
            vega: Math.random() * 0.3,
            rho: Math.random() * 0.1,
            days_to_expiration: 30,
            underlying_price: underlyingPrice
          });
        });
      });
      
      setOptionsChain(mockOptions);
    } catch (error) {
      console.error("Error loading options chain:", error);
    }
    setLoading(false);
  };

  const handleTrade = (option, action) => {
    console.log(`${action.toUpperCase()} ${option.option_type} ${option.strike_price} exp ${option.expiration_date}`);
    // Here you would integrate with order management
  };

  const calls = optionsChain.filter(o => o.option_type === 'call');
  const puts = optionsChain.filter(o => o.option_type === 'put');

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Target className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
          <p className="text-white text-lg font-semibold">Loading Options Chain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Options Trading</h1>
          <p className="text-slate-400 mt-1">Trade options with advanced analytics and Greeks</p>
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
          <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01-19">Jan 19, 2024</SelectItem>
              <SelectItem value="2024-02-16">Feb 16, 2024</SelectItem>
              <SelectItem value="2024-03-15">Mar 15, 2024</SelectItem>
              <SelectItem value="2024-04-19">Apr 19, 2024</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600 text-slate-300">
                <Calculator className="w-4 h-4 mr-2" />
                Calculator
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Options Calculator</DialogTitle>
              </DialogHeader>
              <OptionsCalculator />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Options Chain Header */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">{selectedSymbol}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">$150.25</h2>
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">+$2.45 (1.66%)</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">IV Rank</div>
                  <div className="text-purple-400 font-bold">45%</div>
                </div>
                <div>
                  <div className="text-slate-400">30d HV</div>
                  <div className="text-cyan-400 font-bold">28.5%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Chain */}
      <Tabs defaultValue="chain">
        <TabsList className="bg-slate-900/50 border border-slate-800/50">
          <TabsTrigger value="chain">Options Chain</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="analysis">Volatility Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chain" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calls */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Calls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {calls.map((option, index) => (
                    <OptionRow
                      key={`${option.strike_price}-${option.option_type}`}
                      option={option}
                      onTrade={handleTrade}
                    />
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Puts */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Puts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {puts.map((option, index) => (
                    <OptionRow
                      key={`${option.strike_price}-${option.option_type}`}
                      option={option}
                      onTrade={handleTrade}
                    />
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategies">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Options Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Covered Call', description: 'Generate income on existing shares', risk: 'Limited', reward: 'Limited' },
                  { name: 'Protective Put', description: 'Hedge downside risk', risk: 'Limited', reward: 'Unlimited' },
                  { name: 'Iron Condor', description: 'Profit from low volatility', risk: 'Limited', reward: 'Limited' },
                  { name: 'Butterfly Spread', description: 'Neutral strategy for minimal movement', risk: 'Limited', reward: 'Limited' },
                  { name: 'Straddle', description: 'Profit from high volatility', risk: 'Limited', reward: 'Unlimited' },
                  { name: 'Collar', description: 'Protective strategy with income', risk: 'Limited', reward: 'Limited' }
                ].map((strategy, index) => (
                  <div key={strategy.name} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-2">{strategy.name}</h3>
                    <p className="text-slate-400 text-sm mb-3">{strategy.description}</p>
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Risk:</span>
                        <span className="text-orange-400 ml-1">{strategy.risk}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Reward:</span>
                        <span className="text-green-400 ml-1">{strategy.reward}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Volatility Surface Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">Advanced Volatility Analysis</h3>
                <p className="text-slate-400">
                  3D volatility surface, skew analysis, and term structure coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
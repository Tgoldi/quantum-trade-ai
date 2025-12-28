import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Star, Shield, Zap, Bell, Eye, TrendingUp, Users, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/30 rounded-2xl hover:border-slate-700/50 transition-all duration-300"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const AppPreview = ({ screen, isActive }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: isActive ? 1 : 0.3, 
      scale: isActive ? 1 : 0.8,
      rotateY: isActive ? 0 : 10 
    }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="relative"
  >
    <div className="w-72 h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
      <div className="w-full h-full bg-slate-950 rounded-[2rem] overflow-hidden relative">
        {/* Status Bar */}
        <div className="h-6 bg-slate-900 flex items-center justify-between px-6 text-xs text-slate-400">
          <span>9:41</span>
          <span>100%</span>
        </div>
        
        {/* Screen Content */}
        <div className="p-4 h-full">
          {screen === 'dashboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">Portfolio</h2>
                <div className="w-8 h-8 bg-blue-600 rounded-lg" />
              </div>
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="text-green-400 text-2xl font-bold">$102,547</div>
                <div className="text-slate-400 text-sm">+2.4% today</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-400 text-xs">AAPL</div>
                  <div className="text-white font-semibold">$180.25</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-400 text-xs">NVDA</div>
                  <div className="text-white font-semibold">$920.15</div>
                </div>
              </div>
            </div>
          )}
          
          {screen === 'trading' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">Quick Trade</h2>
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-3">
                <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" placeholder="Symbol" />
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-green-600 text-white rounded-lg p-3 font-semibold">BUY</button>
                  <button className="bg-red-600 text-white rounded-lg p-3 font-semibold">SELL</button>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">AI Recommendation</div>
                  <div className="text-cyan-400 font-semibold">Strong Buy - NVDA</div>
                </div>
              </div>
            </div>
          )}
          
          {screen === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">Alerts</h2>
                <Bell className="w-6 h-6 text-orange-400" />
              </div>
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-green-400 font-semibold text-sm">Price Alert</div>
                  <div className="text-white">AAPL hit $180</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-blue-400 font-semibold text-sm">AI Signal</div>
                  <div className="text-white">New opportunity detected</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="text-purple-400 font-semibold text-sm">Market News</div>
                  <div className="text-white">Fed announces rate decision</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full" />
      </div>
    </div>
  </motion.div>
);

export default function MobileApp() {
  const [activeScreen, setActiveScreen] = useState('dashboard');

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Trading",
      description: "Execute trades instantly with our optimized mobile interface. One-tap trading with AI assistance.",
      color: "bg-gradient-to-r from-yellow-500 to-orange-500"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Never miss important market moves. Get personalized alerts based on your portfolio and preferences.",
      color: "bg-gradient-to-r from-purple-500 to-pink-500"
    },
    {
      icon: Eye,
      title: "Real-time Monitoring",
      description: "Track your positions, monitor markets, and receive AI insights wherever you are.",
      color: "bg-gradient-to-r from-cyan-500 to-blue-500"
    },
    {
      icon: Shield,
      title: "Bank-level Security",
      description: "Your data and trades are protected with enterprise-grade encryption and biometric authentication.",
      color: "bg-gradient-to-r from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
              QuantumTrade Mobile
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Take the power of AI-driven trading with you. Trade anywhere, anytime with our award-winning mobile app.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-white font-semibold">4.9</span>
              <span className="text-slate-400">• 50K+ reviews</span>
            </div>
          </div>
        </motion.div>

        {/* App Preview Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Professional Trading in Your Pocket
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Experience the full power of our AI trading platform on mobile. From portfolio management to executing complex strategies, everything you need is at your fingertips.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'dashboard', label: 'Portfolio Dashboard', icon: TrendingUp },
                { id: 'trading', label: 'Quick Trading', icon: Zap },
                { id: 'alerts', label: 'Smart Alerts', icon: Bell }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeScreen === tab.id ? "default" : "outline"}
                  onClick={() => setActiveScreen(tab.id)}
                  className={`w-full justify-start gap-3 p-4 ${
                    activeScreen === tab.id 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <AppPreview screen={activeScreen} isActive={true} />
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Trade Smart
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our mobile app brings professional-grade trading tools to your smartphone with an intuitive, powerful interface.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <FeatureCard {...feature} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 rounded-3xl border border-slate-800/50 p-8 text-center"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Download QuantumTrade Mobile
              </h2>
              <p className="text-slate-400 text-lg">
                Join thousands of traders who trust QuantumTrade for their mobile trading needs.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-xl text-lg font-semibold">
                <Download className="w-6 h-6 mr-3" />
                Download for iOS
              </Button>
              <Button className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 rounded-xl text-lg font-semibold">
                <Download className="w-6 h-6 mr-3" />
                Download for Android
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>50K+ Active Traders</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Available Worldwide</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Bank-level Security</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, TrendingDown, Clock, Eye, Zap, Filter, Search, Globe, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip } from 'recharts';

const NewsCard = ({ article, index }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'earnings': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'merger': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'regulatory': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'market': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'economic': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score < -0.3) return 'text-red-400 bg-red-500/20 border-red-500/30';
    return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  };

  const getImpactLevel = (score) => {
    if (score > 0.7) return { label: 'High', color: 'text-red-400' };
    if (score > 0.4) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-green-400' };
  };

  const impact = getImpactLevel(article.impact_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30 hover:border-slate-700/50 transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className={getCategoryColor(article.category)}>
                {article.category.toUpperCase()}
              </Badge>
              <Badge className={getSentimentColor(article.sentiment_score)}>
                {article.sentiment_score > 0 ? 'Bullish' : article.sentiment_score < 0 ? 'Bearish' : 'Neutral'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${impact.color}`}>
                {impact.label} Impact
              </span>
              {article.impact_score > 0.7 && <AlertTriangle className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          
          <h3 className="text-white font-bold text-lg mb-3 leading-tight group-hover:text-cyan-400 transition-colors">
            {article.headline}
          </h3>
          
          <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">
            {article.summary}
          </p>
          
          {article.related_symbols && article.related_symbols.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.related_symbols.slice(0, 4).map(symbol => (
                <Badge key={symbol} variant="outline" className="text-cyan-400 border-cyan-500/30 font-mono">
                  ${symbol}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>{article.source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{article.reading_time}min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className="capitalize">{article.credibility_score > 0.8 ? 'High' : article.credibility_score > 0.6 ? 'Medium' : 'Low'} credibility</span>
              </div>
            </div>
            <span className="text-slate-500">
              {new Date(article.published_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MarketImpactChart = ({ data }) => (
  <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        Market Impact Timeline
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94A3B8" />
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
            dataKey="sentiment" 
            stroke="#06b6d4" 
            fillOpacity={1} 
            fill="url(#impactGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default function NewsCenter() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await NewsArticle.list("-published_at", 50);
      setArticles(data);
    } catch (error) {
      console.error("Error loading news:", error);
    }
    setLoading(false);
  };

  // Mock data
  const mockArticles = articles.length > 0 ? articles : [
    {
      id: 1,
      headline: "Fed Signals More Aggressive Rate Cuts Ahead",
      summary: "Federal Reserve officials hint at accelerated monetary easing as inflation shows signs of sustained decline. Markets rally on dovish comments from Powell.",
      source: "Reuters",
      category: "economic",
      published_at: new Date().toISOString(),
      sentiment_score: 0.7,
      impact_score: 0.9,
      related_symbols: ["SPY", "QQQ", "TLT"],
      credibility_score: 0.95,
      reading_time: 3,
      tags: ["Federal Reserve", "Interest Rates", "Monetary Policy"]
    },
    {
      id: 2,
      headline: "NVIDIA Announces Revolutionary AI Chip Architecture",
      summary: "Next-generation GPU architecture promises 10x performance improvement for AI workloads. Stock soars in after-hours trading on breakthrough announcement.",
      source: "TechCrunch",
      category: "company",
      published_at: new Date(Date.now() - 3600000).toISOString(),
      sentiment_score: 0.9,
      impact_score: 0.8,
      related_symbols: ["NVDA", "AMD", "INTC"],
      credibility_score: 0.88,
      reading_time: 4,
      tags: ["AI", "Semiconductors", "Technology"]
    },
    {
      id: 3,
      headline: "Tesla Faces New Regulatory Challenges in Europe",
      summary: "European Union proposes stricter safety requirements for autonomous vehicles, potentially impacting Tesla's FSD rollout timeline across member states.",
      source: "Financial Times",
      category: "regulatory",
      published_at: new Date(Date.now() - 7200000).toISOString(),
      sentiment_score: -0.6,
      impact_score: 0.7,
      related_symbols: ["TSLA"],
      credibility_score: 0.92,
      reading_time: 5,
      tags: ["Tesla", "Regulation", "Autonomous Vehicles"]
    },
    {
      id: 4,
      headline: "Major Tech Earnings Beat Expectations",
      summary: "Apple, Microsoft, and Google all report stronger-than-expected quarterly results, driven by AI investments and cloud growth. Tech sector momentum continues.",
      source: "Bloomberg",
      category: "earnings",
      published_at: new Date(Date.now() - 10800000).toISOString(),
      sentiment_score: 0.8,
      impact_score: 0.85,
      related_symbols: ["AAPL", "MSFT", "GOOGL"],
      credibility_score: 0.96,
      reading_time: 6,
      tags: ["Earnings", "Technology", "AI"]
    }
  ];

  const sentimentData = [
    { time: '6AM', sentiment: 0.2 },
    { time: '9AM', sentiment: 0.4 },
    { time: '12PM', sentiment: 0.7 },
    { time: '3PM', sentiment: 0.5 },
    { time: '6PM', sentiment: 0.6 },
    { time: 'Now', sentiment: 0.8 }
  ];

  const categoryStats = [
    { category: "Economic", count: 15, sentiment: 0.3 },
    { category: "Earnings", count: 12, sentiment: 0.7 },
    { category: "Regulatory", count: 8, sentiment: -0.2 },
    { category: "Market", count: 20, sentiment: 0.5 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Newspaper className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
          <p className="text-white text-xl font-semibold">Loading News Feed...</p>
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
              <Newspaper className="w-10 h-10 text-cyan-400" />
              News & Market Intelligence
            </h1>
            <p className="text-slate-400 text-lg mt-2">
              AI-powered news analysis and market impact assessment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-4 py-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse" />
              Live Updates
            </Badge>
          </div>
        </motion.div>

        {/* News Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Breaking News", value: "8", change: "Last hour", icon: AlertTriangle, color: "text-red-400" },
            { label: "Market Sentiment", value: "Bullish", change: "+12%", icon: TrendingUp, color: "text-green-400" },
            { label: "AI Analysis", value: "94%", change: "Accuracy", icon: Zap, color: "text-purple-400" },
            { label: "Sources Tracked", value: "247", change: "Active", icon: Globe, color: "text-cyan-400" }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <p className={`text-xs ${metric.color}`}>{metric.change}</p>
                    </div>
                    <metric.icon className={`w-8 h-8 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="headlines" className="space-y-8">
          <TabsList className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/30 p-1 h-auto">
            <TabsTrigger value="headlines" className="flex items-center gap-2 px-6 py-3">
              <Newspaper className="w-4 h-4" />
              Headlines
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2 px-6 py-3">
              <Zap className="w-4 h-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2 px-6 py-3">
              <TrendingUp className="w-4 h-4" />
              Market Impact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headlines" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search news, symbols, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                {["all", "breaking", "earnings", "regulatory", "economic"].map(category => (
                  <Button
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <AnimatePresence>
                {mockArticles.map((article, index) => (
                  <NewsCard key={article.id} article={article} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <MarketImpactChart data={sentimentData} />
              
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">News Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="category" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#f8fafc'
                        }} 
                      />
                      <Bar dataKey="count" fill="#06b6d4" name="Article Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            <div className="grid gap-6">
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">High-Impact News Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockArticles
                      .filter(article => article.impact_score > 0.7)
                      .map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
                        >
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{article.headline}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>{article.source}</span>
                              <span>{new Date(article.published_at).toLocaleString()}</span>
                              <div className="flex gap-1">
                                {article.related_symbols?.slice(0, 3).map(symbol => (
                                  <Badge key={symbol} variant="outline" className="text-xs">
                                    ${symbol}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-red-400 font-bold">
                                {Math.floor(article.impact_score * 100)}%
                              </div>
                              <div className="text-xs text-slate-400">Impact</div>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
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
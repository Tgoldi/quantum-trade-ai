
import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, TrendingDown, Heart, MessageSquare, Share, Twitter, Crown, Zap, Flame, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip } from 'recharts';

const SocialPostCard = ({ post, index }) => {
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score < -0.3) return 'text-red-400 bg-red-500/20 border-red-500/30';
    return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  };

  const getSentimentLabel = (score) => {
    if (score > 0.3) return 'Bullish';
    if (score < -0.3) return 'Bearish';
    return 'Neutral';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30 hover:border-slate-700/50 transition-all duration-300 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-10 h-10 border-2 border-slate-700">
              <AvatarImage src={`https://i.pravatar.cc/100?u=${post.author}`} />
              <AvatarFallback className="bg-slate-800 text-white">
                {post.author.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-semibold">{post.author}</span>
                {post.author_verified && <Crown className="w-4 h-4 text-yellow-500" />}
                {getPlatformIcon(post.platform)}
                <Badge className={getSentimentColor(post.sentiment_score)}>
                  {getSentimentLabel(post.sentiment_score)}
                </Badge>
                {post.influence_score > 0.8 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Flame className="w-3 h-3 mr-1" />
                    Influential
                  </Badge>
                )}
              </div>
              
              <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                {post.content}
              </p>
              
              {post.mentioned_symbols && post.mentioned_symbols.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.mentioned_symbols.map(symbol => (
                    <Badge key={symbol} variant="outline" className="text-cyan-400 border-cyan-500/30">
                      ${symbol}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{Math.floor(post.engagement_score / 3)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share className="w-4 h-4" />
                    <span className="text-sm">{Math.floor(post.engagement_score / 8)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{post.engagement_score}</span>
                  </div>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(post.published_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const InfluencerCard = ({ influencer, index }) => {
  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'twitter': return 'text-blue-400';
      case 'reddit': return 'text-orange-400';
      case 'youtube': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30 hover:border-slate-700/50 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-12 h-12 border-2 border-slate-700">
              <AvatarImage src={`https://i.pravatar.cc/100?u=${influencer.influencer_name}`} />
              <AvatarFallback className="bg-slate-800 text-white">
                {influencer.influencer_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold">{influencer.influencer_name}</span>
                <Badge className={`${getPlatformColor(influencer.platform)} bg-current/10 border-current/30`}>
                  {influencer.platform.toUpperCase()}
                </Badge>
              </div>
              <div className="text-slate-400 text-sm">
                {influencer.follower_count?.toLocaleString()} followers
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400">
                {Math.floor(influencer.influence_score * 100)}
              </div>
              <div className="text-slate-400 text-xs">Influence Score</div>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {Math.floor(influencer.accuracy_rate * 100)}%
              </div>
              <div className="text-slate-400 text-xs">Accuracy</div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Market Impact</span>
              <span className="text-white capitalize">{influencer.market_moving_potential}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Specialization</span>
              <div className="flex flex-wrap gap-1">
                {influencer.specialization?.slice(0, 2).map(spec => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Follow Updates
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function SocialTrading() {
  const [posts, setPosts] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      const [postsData, influencersData] = await Promise.all([
        SocialPost.list("-published_at", 20),
        InfluencerAnalysis.list("-influence_score", 10)
      ]);
      
      setPosts(postsData);
      setInfluencers(influencersData);
    } catch (error) {
      console.error("Error loading social data:", error);
    }
    setLoading(false);
  };

  // Mock data
  const mockPosts = posts.length > 0 ? posts : [
    {
      id: 1,
      platform: "twitter",
      author: "ElonMusk",
      author_verified: true,
      content: "Tesla's AI capabilities are advancing rapidly. The future of autonomous driving is here. $TSLA to the moon! 🚗🚀",
      mentioned_symbols: ["TSLA"],
      sentiment_score: 0.8,
      engagement_score: 15420,
      influence_score: 0.95,
      published_at: new Date().toISOString()
    },
    {
      id: 2,
      platform: "twitter",
      author: "CathieDWood",
      author_verified: true,
      content: "Innovation is accelerating. Companies investing in AI, genomics, and energy storage will lead the next decade. $ARKK",
      mentioned_symbols: ["ARKK", "NVDA"],
      sentiment_score: 0.6,
      engagement_score: 8930,
      influence_score: 0.88,
      published_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 3,
      platform: "reddit",
      author: "WallStreetBets",
      author_verified: false,
      content: "Diamond hands! $GME showing strong momentum. Community is stronger than ever. HODL! 💎🙌",
      mentioned_symbols: ["GME"],
      sentiment_score: 0.9,
      engagement_score: 23450,
      influence_score: 0.75,
      published_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const mockInfluencers = influencers.length > 0 ? influencers : [
    {
      influencer_name: "ElonMusk",
      platform: "twitter",
      follower_count: 165000000,
      influence_score: 0.95,
      accuracy_rate: 0.72,
      market_moving_potential: "very_high",
      specialization: ["TSLA", "Tech", "Crypto"]
    },
    {
      influencer_name: "CathieDWood",
      platform: "twitter",
      follower_count: 1500000,
      influence_score: 0.88,
      accuracy_rate: 0.85,
      market_moving_potential: "high",
      specialization: ["Innovation", "ARK", "Genomics"]
    },
    {
      influencer_name: "jimcramer",
      platform: "twitter",
      follower_count: 2100000,
      influence_score: 0.82,
      accuracy_rate: 0.68,
      market_moving_potential: "high",
      specialization: ["S&P500", "Financial", "CNBC"]
    }
  ];

  const sentimentData = [
    { time: '9AM', bullish: 65, bearish: 35 },
    { time: '12PM', bullish: 70, bearish: 30 },
    { time: '3PM', bullish: 62, bearish: 38 },
    { time: '6PM', bullish: 75, bearish: 25 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
          <p className="text-white text-xl font-semibold">Loading Social Feed...</p>
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
              <Users className="w-10 h-10 text-blue-500" />
              Social Trading Hub
            </h1>
            <p className="text-slate-400 text-lg mt-2">
              Track market sentiment and follow influential traders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-slate-600 text-slate-300">
              <Zap className="w-4 h-4 mr-2" />
              AI Sentiment
            </Button>
          </div>
        </motion.div>

        {/* Social Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Social Volume", value: "1.2M", change: "+15%", icon: MessageSquare, color: "text-blue-400" },
            { label: "Bullish Sentiment", value: "68%", change: "+5%", icon: TrendingUp, color: "text-green-400" },
            { label: "Top Influencers", value: "24", change: "Active", icon: Crown, color: "text-yellow-400" },
            { label: "Viral Posts", value: "156", change: "+28%", icon: Flame, color: "text-red-400" }
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
        <Tabs defaultValue="feed" className="space-y-8">
          <TabsList className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/30 p-1 h-auto">
            <TabsTrigger value="feed" className="flex items-center gap-2 px-6 py-3">
              <MessageSquare className="w-4 h-4" />
              Social Feed
            </TabsTrigger>
            <TabsTrigger value="influencers" className="flex items-center gap-2 px-6 py-3">
              <Crown className="w-4 h-4" />
              Top Influencers
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2 px-6 py-3">
              <TrendingUp className="w-4 h-4" />
              Sentiment Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Input
                placeholder="Search posts, symbols, or influencers..."
                className="max-w-md bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
              <div className="flex gap-2">
                {["all", "bullish", "bearish", "viral"].map(filter => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={selectedFilter === filter ? "default" : "outline"}
                    onClick={() => setSelectedFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid gap-4">
              <AnimatePresence>
                {mockPosts.map((post, index) => (
                  <SocialPostCard key={post.id} post={post} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="influencers" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {mockInfluencers.map((influencer, index) => (
                  <InfluencerCard key={influencer.influencer_name} influencer={influencer} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Real-time Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sentimentData}>
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
                      <Bar dataKey="bullish" fill="#22c55e" name="Bullish" />
                      <Bar dataKey="bearish" fill="#ef4444" name="Bearish" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Trending Symbols</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { symbol: "TSLA", mentions: 1250, sentiment: 0.8, change: "+12%" },
                      { symbol: "NVDA", mentions: 980, sentiment: 0.6, change: "+8%" },
                      { symbol: "AAPL", mentions: 850, sentiment: 0.3, change: "+2%" },
                      { symbol: "GME", mentions: 720, sentiment: 0.9, change: "+15%" }
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
                            ${stock.symbol}
                          </Badge>
                          <span className="text-slate-400 text-sm">{stock.mentions} mentions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${stock.sentiment > 0.5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-current/30`}>
                            {stock.sentiment > 0.5 ? 'Bullish' : 'Bearish'}
                          </Badge>
                          <span className="text-green-400 font-semibold text-sm">{stock.change}</span>
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

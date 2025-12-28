import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, TrendingDown, Star, MessageCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InfluencerMonitor() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfluencers();
  }, []);

  const loadInfluencers = async () => {
    try {
      // Use mock data for now - backend API not yet implemented
      const mockData = [
        {
          name: "Elon Musk",
          platform: "twitter",
          followers: 150000000,
          influence_score: 98,
          sentiment: "bullish",
          recent_posts: 45,
          engagement_rate: 12.5
        },
        {
          name: "Cathie Wood",
          platform: "twitter",
          followers: 2500000,
          influence_score: 95,
          sentiment: "bullish",
          recent_posts: 23,
          engagement_rate: 8.3
        },
        {
          name: "WallStreetBets",
          platform: "reddit",
          followers: 14000000,
          influence_score: 92,
          sentiment: "mixed",
          recent_posts: 156,
          engagement_rate: 15.7
        }
      ];
      setInfluencers(mockData);
    } catch (error) {
      console.error("Error loading influencer data:", error);
    }
    setLoading(false);
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'twitter': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'reddit': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'youtube': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'stocktwits': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'seeking_alpha': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getInfluenceLevel = (score) => {
    if (score > 0.8) return { level: 'MEGA', color: 'text-red-400' };
    if (score > 0.6) return { level: 'HIGH', color: 'text-orange-400' };
    if (score > 0.4) return { level: 'MEDIUM', color: 'text-yellow-400' };
    return { level: 'LOW', color: 'text-green-400' };
  };

  const formatFollowerCount = (count) => {
    if (!count || typeof count !== 'number') return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader className="border-b border-slate-800/50">
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5 text-cyan-400" />
          Financial Influencer Monitor
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
            LIVE TRACKING
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Analyzing influencer impact...</div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {influencers.slice(0, 10).map((influencer, index) => {
                const influence = getInfluenceLevel(influencer.influence_score);
                return (
                  <motion.div
                    key={influencer.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-slate-800/20 transition-colors border-b border-slate-800/20 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold">
                            {influencer.influencer_name?.substring(0, 2).toUpperCase() || 'IN'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">
                            {influencer.influencer_name}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPlatformColor(influencer.platform)}>
                              {influencer.platform?.toUpperCase()}
                            </Badge>
                            <Badge className={`${influence.color.replace('text-', 'bg-').replace('-400', '-500/20')} ${influence.color} border-${influence.color.replace('text-', '').replace('-400', '-500/30')}`}>
                              {influence.level} IMPACT
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {formatFollowerCount(influencer.follower_count)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {(influencer.accuracy_rate * 100).toFixed(0)}% accurate
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {influencer.engagement_rate?.toFixed(1)}% engagement
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-cyan-400">
                            {(influencer.influence_score * 100).toFixed(0)}
                          </span>
                        </div>
                        <div className={`text-sm flex items-center gap-1 ${
                          influencer.sentiment_bias >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {influencer.sentiment_bias >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {influencer.sentiment_bias >= 0 ? 'Bullish' : 'Bearish'} bias
                        </div>
                      </div>
                    </div>
                    
                    {influencer.specialization && influencer.specialization.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {influencer.specialization.slice(0, 4).map((spec, idx) => (
                          <Badge 
                            key={idx}
                            className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs"
                          >
                            {spec}
                          </Badge>
                        ))}
                        {influencer.specialization.length > 4 && (
                          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                            +{influencer.specialization.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
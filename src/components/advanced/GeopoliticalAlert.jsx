import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Globe, TrendingDown, TrendingUp, Clock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import backendService from '@/api/backendService';

export default function GeopoliticalAlert() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      // Use backendService for authenticated API calls (it adds /api prefix automatically)
      const data = await backendService.makeRequest('/geopolitical/events');
      setEvents(data.events || []);
      console.log('✅ Loaded real geopolitical events');
    } catch (error) {
      console.error('Error loading geopolitical events:', error);
      setEvents([]);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'election': return <Globe className="w-4 h-4" />;
      case 'conflict': return <AlertTriangle className="w-4 h-4" />;
      case 'trade_dispute': return <TrendingDown className="w-4 h-4" />;
      case 'central_bank_action': return <Shield className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getImpactDirection = (score) => {
    if (score > 0.1) return { icon: TrendingUp, color: 'text-green-400', label: 'Positive' };
    if (score < -0.1) return { icon: TrendingDown, color: 'text-red-400', label: 'Negative' };
    return { icon: Clock, color: 'text-yellow-400', label: 'Neutral' };
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader className="border-b border-slate-800/50">
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Geopolitical Intelligence
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
            MONITORING
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Scanning global events...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No significant events detected</div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {events.map((event, index) => {
                const impact = getImpactDirection(event.market_impact_score);
                return (
                  <motion.div
                    key={event.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 hover:bg-slate-800/20 transition-colors border-b border-slate-800/20 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">
                            {event.event_title}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(event.severity)}>
                              {(event.severity || 'unknown').toUpperCase()}
                            </Badge>
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                              {(event.event_type || 'general').replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            Status: {event.event_status || 'N/A'} | Duration: {event.duration_estimate?.replace('_', ' ') || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${impact.color}`}>
                          <impact.icon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{impact.label}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Confidence: {(event.confidence_level * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    {event.affected_sectors && event.affected_sectors.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.affected_sectors.slice(0, 3).map((sector, idx) => (
                          <Badge 
                            key={idx}
                            className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                          >
                            {sector}
                          </Badge>
                        ))}
                        {event.affected_sectors.length > 3 && (
                          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                            +{event.affected_sectors.length - 3} more
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
import React from "react";
import MacroeconomicDashboard from "../components/advanced/MacroeconomicDashboard";
import GeopoliticalAlert from "../components/advanced/GeopoliticalAlert";
import AdvancedRiskAnalysis from "../components/advanced/AdvancedRiskAnalysis";
import TradingSimulator from "../components/advanced/TradingSimulator";
import InfluencerMonitor from "../components/advanced/InfluencerMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Globe, Shield, Play, Users } from "lucide-react";

export default function AdvancedAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Advanced Analytics Hub</h1>
        <p className="text-slate-400 text-lg mt-1">Cutting-edge market intelligence and predictive analysis</p>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="macro" className="space-y-6">
        <TabsList className="bg-slate-900/70 border border-slate-800/50 p-1 h-auto">
          <TabsTrigger value="macro">
            <Activity className="w-4 h-4 mr-2" />
            Macro
          </TabsTrigger>
          <TabsTrigger value="geopolitical">
            <Globe className="w-4 h-4 mr-2" />
            Geopolitical
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="w-4 h-4 mr-2" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="simulation">
            <Play className="w-4 h-4 mr-2" />
            Simulation
          </TabsTrigger>
          <TabsTrigger value="influencers">
            <Users className="w-4 h-4 mr-2" />
            Influencers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="macro" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <MacroeconomicDashboard />
            <div className="space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Economic Calendar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <div className="font-medium text-white">Fed Interest Rate Decision</div>
                      <div className="text-xs text-slate-400">Dec 18, 2024 - 2:00 PM EST</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-semibold">HIGH</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <div className="font-medium text-white">CPI Inflation Data</div>
                      <div className="text-xs text-slate-400">Dec 12, 2024 - 8:30 AM EST</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-semibold">MEDIUM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="geopolitical" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GeopoliticalAlert />
            </div>
            <div className="space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Global Risk Heat Map</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">US-China Trade</span>
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Middle East</span>
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-red-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">EU Stability</span>
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-2/5 h-full bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <AdvancedRiskAnalysis />
        </TabsContent>

        <TabsContent value="simulation">
          <TradingSimulator />
        </TabsContent>

        <TabsContent value="influencers">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InfluencerMonitor />
            </div>
            <div className="space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Movers</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div>
                      <div className="font-medium text-white">@ElonMusk</div>
                      <div className="text-xs text-slate-400">Mentioned TSLA, DOGE</div>
                    </div>
                    <div className="text-green-400">+15%</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div>
                      <div className="font-medium text-white">@CathieDWood</div>
                      <div className="text-xs text-slate-400">ARK Investment outlook</div>
                    </div>
                    <div className="text-red-400">-8%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
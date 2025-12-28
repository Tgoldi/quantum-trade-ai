import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskMetric = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-b-0">
    <div className="text-sm font-medium text-slate-400">{label}</div>
    <div className={`text-sm font-bold ${color || 'text-slate-100'}`}>{value}</div>
  </div>
);

export default function DynamicRiskIndicator({ portfolio }) {
  const riskLevel = portfolio?.risk_level || 'moderate';
  const riskScore = portfolio?.risk_score || 68;

  const getRiskStyles = (level) => {
    switch (level) {
      case 'conservative': return { color: "text-green-400", stroke: "#22c55e" };
      case 'moderate': return { color: "text-yellow-400", stroke: "#f59e0b" };
      case 'aggressive': return { color: "text-red-400", stroke: "#ef4444" };
      default: return { color: "text-slate-400", stroke: "#94a3b8" };
    }
  };

  const styles = getRiskStyles(riskLevel);

  return (
    <Card className="bg-slate-900/70 border-slate-800/50 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Dynamic Risk Indicator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="relative w-40 h-40 mx-auto"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <motion.circle
              className="text-slate-800"
              stroke="currentColor"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            />
            <motion.circle
              stroke={styles.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - riskScore / 100)}
              transform="rotate(-90 50 50)"
              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - riskScore / 100) }}
              transition={{ duration: 1.5, ease: "circOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${styles.color}`}>{riskScore}</div>
            <div className={`text-xs font-semibold uppercase tracking-wider ${styles.color}`}>{riskLevel}</div>
          </div>
        </div>
        
        <div className="space-y-1">
          <RiskMetric label="Value at Risk (95%)" value="$2,150" />
          <RiskMetric label="Portfolio Beta" value="1.15" />
          <RiskMetric label="Concentration" value="High (22%)" color="text-orange-400" />
        </div>
      </CardContent>
    </Card>
  );
}
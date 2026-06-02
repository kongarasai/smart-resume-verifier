'use client';
import { useEffect, useState } from 'react';
import { trustScoreAPI } from '@/lib/api';
import { ShieldCheck, ShieldAlert, Shield, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function TrustScoreBadge({ userId, onUpdate }: { userId?: string; onUpdate?: () => void }) {
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchScore = async () => {
    try {
      const res = await trustScoreAPI.get(userId);
      setScore(res);
    } catch {}
  };

  const calculate = async () => {
    setLoading(true);
    try {
      await trustScoreAPI.calculate();
      await fetchScore();
      if (onUpdate) onUpdate();
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchScore();
  }, [userId]);

  if (!score && !loading) {
     return (
       <button onClick={calculate} className="flex items-center gap-2 px-4 py-2 bg-ink-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all">
         <Shield size={14} /> Calculate Trust Index
       </button>
     );
  }

  const riskColor = {
    low: 'text-green-500',
    medium: 'text-amber-500',
    high: 'text-red-500'
  }[score?.fraud_risk_level as 'low' | 'medium' | 'high'] || 'text-ink-400';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-ink-100 shadow-sm">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-ink-50 flex items-center justify-center text-xl font-black text-ink-900">
            {score?.overall_trust_index}%
          </div>
          <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-0.5">
            {score?.overall_trust_index > 70 ? <ShieldCheck size={16} className="text-green-600" /> : <ShieldAlert size={16} className="text-amber-500" />}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-0.5">Trust Index</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink-900">Verified Professional</span>
            <span className={clsx("text-[10px] font-black uppercase tracking-tighter", riskColor)}>
              {score?.fraud_risk_level} Risk
            </span>
          </div>
        </div>
        <button onClick={calculate} disabled={loading} className="p-2 text-ink-400 hover:text-ink-900 transition-colors">
          <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}

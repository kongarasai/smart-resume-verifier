'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { rankingAPI } from '@/lib/api';
import { Trophy, TrendingUp, TrendingDown, Minus, Info, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RankingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = async () => {
    try { const r = await rankingAPI.get(); setData(r.data); }
    catch { setData(null); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const recalculate = async () => {
    setRecalculating(true);
    try {
      await rankingAPI.recalculate();
      await load();
      toast.success('Rankings recalculated!');
    } catch { toast.error('Recalculation failed'); }
    finally { setRecalculating(false); }
  };

  const RankChange = ({ change }: { change: number }) => {
    if (!change) return <span className="flex items-center gap-1 text-xs text-ink-400"><Minus size={10} /> Unchanged</span>;
    if (change > 0) return <span className="flex items-center gap-1 text-xs text-green-600"><TrendingUp size={10} /> +{change} positions</span>;
    return <span className="flex items-center gap-1 text-xs text-red-500"><TrendingDown size={10} /> {change} positions</span>;
  };

  const FORMULA = [
    { label: 'Practice Problems', weight: 30, color: '#1a6fa8' },
    { label: 'Projects', weight: 20, color: '#2d9e5f' },
    { label: 'GitHub Activity', weight: 15, color: '#7c3aed' },
    { label: 'LeetCode', weight: 15, color: '#d97706' },
    { label: 'Skill Verification', weight: 10, color: '#db2777' },
    { label: 'Activity Engagement', weight: 10, color: '#0891b2' },
  ];

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-1">Rankings</h1>
            <p className="text-ink-500 text-sm">Your position across groups and the overall platform</p>
          </div>
          <button onClick={recalculate} disabled={recalculating} className="btn-primary">
            {recalculating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={14} />}
            {recalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {/* Overall */}
            <div className="card p-6">
              <h2 className="section-title mb-5">Overall Platform Ranking</h2>
              {data?.overall ? (
                <div className="flex items-center gap-8">
                  <div className="text-center bg-ink-50 rounded-xl p-5 min-w-24 border border-ink-200">
                    <div className="font-display text-4xl font-bold text-ink-900">#{data.overall.rank_position}</div>
                    <div className="text-xs text-ink-500 mt-1">global rank</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <div className="text-2xl font-bold text-ink-900">{Math.round(data.overall.total_score)}<span className="text-sm text-ink-400">/100</span></div>
                        <div className="text-xs text-ink-500">total score</div>
                      </div>
                      <RankChange change={data.overall.rank_change} />
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${data.overall.total_score}%`, background: '#1a1714' }} />
                    </div>
                    {data.overall.rank_change !== 0 && (
                      <div className="mt-2 text-xs text-ink-500">
                        Previous rank: #{data.overall.previous_rank}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Trophy size={40} className="mx-auto text-ink-300 mb-3" />
                  <p className="text-ink-500 text-sm mb-4">No ranking yet. Solve practice problems and verify your profile to get ranked.</p>
                  <button onClick={recalculate} className="btn-primary mx-auto">Get Ranked Now</button>
                </div>
              )}
            </div>

            {/* Group rankings */}
            {data?.group_rankings?.length > 0 && (
              <div className="card p-6">
                <h2 className="section-title mb-4">Group Rankings</h2>
                <div className="space-y-3">
                  {data.group_rankings.map((r: any) => (
                    <div key={r.group_id} className="p-4 bg-ink-50 rounded-xl border border-ink-100">
                      <div className="flex items-center gap-5">
                        <div className="text-center min-w-12">
                          <div className="font-display text-3xl font-bold text-ink-900">#{r.rank_position}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-ink-900">{r.group_name}</div>
                          <div className="text-xs text-ink-400">{r.workspace_name}</div>
                          <div className="mt-1"><RankChange change={r.rank_change} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {[['Practice', r.practice_score,'#1a6fa8'],['GitHub', r.github_score,'#7c3aed'],['LeetCode', r.leetcode_score,'#d97706']].map(([l,v,c]) => (
                            <div key={l} className="text-center bg-white rounded-lg p-2 border border-ink-100">
                              <div className="font-mono text-sm font-bold" style={{color:c as string}}>{Math.round(v as number)}</div>
                              <div className="text-xs text-ink-400">{l}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-right min-w-16">
                          <div className="font-mono text-xl font-bold text-ink-900">{Math.round(r.total_score)}</div>
                          <div className="text-xs text-ink-400">score</div>
                        </div>
                      </div>
                      {r.rank_change !== 0 && (
                        <div className="mt-3 pt-3 border-t border-ink-200 text-xs text-ink-500">
                          Rank moved: #{r.previous_rank} → #{r.rank_position}
                          {r.rank_change > 0 ? ' ↑ Improved by solving problems or updating profile' : ' ↓ Others progressed faster — keep practicing!'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formula */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={15} className="text-ink-400" />
                <h2 className="section-title">How Your Score Is Calculated</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FORMULA.map(({ label, weight, color }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg border border-ink-100">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>
                      {weight}%
                    </div>
                    <div className="font-medium text-ink-800 text-sm">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

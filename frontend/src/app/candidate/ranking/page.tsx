'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { rankingAPI } from '@/lib/api';
import { Trophy, TrendingUp, TrendingDown, Minus, Info, RefreshCw, Award, Medal, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function RankingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = async () => {
    try {
      const r = await rankingAPI.get();
      setData(r.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    try {
      await rankingAPI.recalculate();
      await load();
      toast.success('Rankings recalculated successfully!');
    } catch {
      toast.error('Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  const RankChange = ({ change }: { change: number }) => {
    if (!change) return <span className="inline-flex items-center gap-1 text-xs text-ink-400 font-medium"><Minus size={10} /> Unchanged</span>;
    if (change > 0) return <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><TrendingUp size={10} /> +{change} pos</span>;
    return <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium"><TrendingDown size={10} /> {change} pos</span>;
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
      <div className="animate-fade-in max-w-6xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-1">Rankings & Leaderboard</h1>
            <p className="text-ink-500 text-sm">Real-time candidate standings across groups and the overall platform</p>
          </div>
          <button onClick={recalculate} disabled={recalculating} className="btn-primary">
            {recalculating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={14} />}
            {recalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-8">
            {/* Overall Card */}
            <div className="card p-6 border-ink-200">
              <h2 className="section-title mb-5 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                My Platform Ranking
              </h2>
              {data?.overall ? (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-8 mb-6">
                    <div className="text-center bg-ink-900 text-white rounded-2xl p-6 min-w-32 shadow-md">
                      <div className="text-xs uppercase tracking-widest text-ink-400 font-bold mb-1">Global</div>
                      <div className="font-display text-5xl font-black text-amber-400">#{data.overall.rank_position}</div>
                      <div className="text-[10px] text-ink-400 mt-1">Platform Standing</div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-display font-bold text-ink-900">
                            {Math.round(data.overall.total_score || 0)}
                            <span className="text-sm font-normal text-ink-400"> /100</span>
                          </div>
                          <div className="text-xs text-ink-500">Overall Weighted Score</div>
                        </div>
                        <RankChange change={data.overall.rank_change} />
                      </div>
                      <div className="w-full h-3 bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-ink-900 rounded-full transition-all duration-500" style={{ width: `${Math.min(Math.round(data.overall.total_score || 0), 100)}%` }} />
                      </div>
                      {data.overall.rank_change !== 0 && data.overall.previous_rank && (
                        <div className="text-xs text-ink-500">
                          Previous rank: #{data.overall.previous_rank}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real Score Sub-components Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-ink-100">
                    {[
                      ['GitHub Evidence', data.overall.github_score || 0, '#7c3aed'],
                      ['LeetCode Evidence', data.overall.leetcode_score || 0, '#d97706'],
                      ['Skill Verification', data.overall.skill_score || 0, '#db2777'],
                      ['Practice Avg', data.overall.practice_score || 0, '#1a6fa8'],
                      ['Projects Verified', data.overall.project_score || 0, '#2d9e5f'],
                      ['Engagement', data.overall.activity_score || 0, '#0891b2'],
                    ].map(([label, val, color]) => (
                      <div key={label as string} className="bg-ink-50 p-3 rounded-xl border border-ink-100 text-center">
                        <div className="font-mono text-lg font-bold" style={{ color: color as string }}>
                          {Math.round(val as number)}
                        </div>
                        <div className="text-[11px] text-ink-600 font-medium truncate mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Trophy size={40} className="mx-auto text-ink-300 mb-3" />
                  <p className="text-ink-500 text-sm mb-4">No ranking recorded yet. Sync your GitHub, LeetCode, or solve practice problems to get ranked.</p>
                  <button onClick={recalculate} className="btn-primary mx-auto"><Sparkles size={14}/> Get Ranked Now</button>
                </div>
              )}
            </div>

            {/* Platform Leaderboard */}
            {data?.leaderboard && data.leaderboard.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="section-title flex items-center gap-2">
                      <Award size={18} className="text-ink-700" />
                      Platform Top Candidates
                    </h2>
                    <p className="text-xs text-ink-500 mt-0.5">Real-time leaderboard ranked by verified portfolio and assessments.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-ink-100 text-ink-700 rounded-lg">
                    {data.leaderboard.length} Candidates
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-100 text-ink-400 text-xs font-medium uppercase tracking-wider">
                        <th className="pb-3 pl-2 w-16">Rank</th>
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3 text-center">GitHub</th>
                        <th className="pb-3 text-center">LeetCode</th>
                        <th className="pb-3 text-center">Skills</th>
                        <th className="pb-3 text-center">Practice</th>
                        <th className="pb-3 text-right pr-4">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {data.leaderboard.map((cand: any) => {
                        const isTop1 = cand.rank_position === 1;
                        const isTop2 = cand.rank_position === 2;
                        const isTop3 = cand.rank_position === 3;

                        return (
                          <tr
                            key={cand.user_id}
                            className={clsx(
                              'transition-colors',
                              cand.is_current_user
                                ? 'bg-amber-50/70 font-medium'
                                : 'hover:bg-ink-25'
                            )}
                          >
                            {/* Rank */}
                            <td className="py-3.5 pl-2">
                              <div className="flex items-center gap-1.5">
                                {isTop1 ? (
                                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-300 shadow-sm">
                                    🥇 1
                                  </span>
                                ) : isTop2 ? (
                                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300 shadow-sm">
                                    🥈 2
                                  </span>
                                ) : isTop3 ? (
                                  <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-200 shadow-sm">
                                    🥉 3
                                  </span>
                                ) : (
                                  <span className="w-7 h-7 rounded-full bg-ink-50 text-ink-600 font-semibold text-xs flex items-center justify-center border border-ink-100">
                                    #{cand.rank_position}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Candidate */}
                            <td className="py-3.5">
                              <div className="flex items-center gap-3">
                                {cand.photo_url ? (
                                  <img src={cand.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-ink-200 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {cand.full_name?.charAt(0)?.toUpperCase() || 'C'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-ink-900 truncate">{cand.full_name}</span>
                                    {cand.is_current_user && (
                                      <span className="text-[10px] bg-ink-900 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  {cand.email && <div className="text-[11px] text-ink-400 truncate">{cand.email}</div>}
                                </div>
                              </div>
                            </td>

                            {/* Sub scores */}
                            <td className="py-3.5 text-center font-mono font-medium text-purple-700">
                              {Math.round(cand.github_score || 0)}
                            </td>
                            <td className="py-3.5 text-center font-mono font-medium text-amber-700">
                              {Math.round(cand.leetcode_score || 0)}
                            </td>
                            <td className="py-3.5 text-center font-mono font-medium text-pink-700">
                              {Math.round(cand.skill_score || 0)}
                            </td>
                            <td className="py-3.5 text-center font-mono font-medium text-blue-700">
                              {Math.round(cand.practice_score || 0)}
                            </td>

                            {/* Total Score */}
                            <td className="py-3.5 text-right pr-4">
                              <div className="font-mono text-base font-bold text-ink-900">
                                {Math.round(cand.total_score || 0)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

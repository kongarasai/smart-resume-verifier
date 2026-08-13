'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { teacherAPI } from '@/lib/api';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function TeacherRankingsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([teacherAPI.getGroups(), teacherAPI.getWorkspaces()])
      .then(([gr, ws]) => {
        setGroups(gr.data || []);
        setWorkspaces(ws.data || []);
        if (gr.data?.[0]) loadRankings(gr.data[0]);
      }).finally(() => setLoading(false));
  }, []);

  const loadRankings = async (g: any) => {
    setSelectedGroup(g);
    const r = await teacherAPI.getGroupRanking(g.id);
    setRankings(r.data || []);
  };

  const loadComparison = async (wsId: string) => {
    const r = await teacherAPI.getWorkspaceComparison(wsId);
    setComparison(r.data || []);
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl text-ink-900 mb-1">Rankings</h1>
        <p className="text-ink-500 text-sm mb-8">Group rankings and workspace comparison</p>
        {loading ? <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <div>
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-2">Your Groups</div>
                <div className="space-y-2">
                  {groups.map(g => (
                    <button key={g.id} onClick={() => loadRankings(g)}
                      className={clsx('w-full text-left card p-3 text-sm hover:border-ink-300 transition-all', selectedGroup?.id===g.id?'border-ink-900 bg-ink-50':'')}>
                      <div className="font-medium text-ink-900">{g.name}</div>
                      <div className="text-xs text-ink-500">{g.workspace_name}</div>
                    </button>
                  ))}
                </div>
              </div>
              {workspaces.length > 0 && (
                <div>
                  <div className="text-xs text-ink-500 uppercase tracking-wide mb-2">Compare Workspace</div>
                  {workspaces.map(w => (
                    <button key={w.id} onClick={() => loadComparison(w.id)}
                      className="w-full text-left card p-3 text-sm hover:border-ink-300 transition-all">
                      <div className="font-medium text-ink-900">{w.name}</div>
                      <div className="text-xs text-ink-500">Compare all groups →</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="col-span-2 space-y-5">
              {comparison.length > 0 && (
                <div className="card p-5">
                  <h2 className="section-title mb-4">Workspace Group Comparison</h2>
                  {comparison.map((g: any, i: number) => (
                    <div key={g.id} className="flex items-center gap-4 p-3 bg-ink-50 rounded-lg border border-ink-100 mb-2">
                      <div className="font-display text-2xl font-bold text-ink-700 w-8">#{i+1}</div>
                      <div className="flex-1">
                        <div className="font-medium text-ink-900 text-sm">{g.name}</div>
                        <div className="text-xs text-ink-500">{g.candidate_count} candidates · {g.weekly_attempts} practice this week</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-center text-xs">
                        <div><div className="font-mono font-bold">{Math.round(g.avg_confidence||0)}</div><div className="text-ink-400">Avg</div></div>
                        <div><div className="font-mono font-bold">{Math.round(g.top_score||0)}</div><div className="text-ink-400">Top</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedGroup && (
                <div className="card p-5">
                  <h2 className="section-title mb-4">Rankings — {selectedGroup.name}</h2>
                  {rankings.length === 0
                    ? <div className="text-center py-8"><Trophy size={32} className="mx-auto text-ink-300 mb-3" /><p className="text-ink-400 text-sm">No rankings yet.</p></div>
                    : rankings.map((r: any, i: number) => (
                      <div key={r.user_id} className={clsx('flex items-center gap-3 p-3 rounded-lg mb-2',
                        i===0?'bg-amber-50 border border-amber-200':i===1?'bg-ink-100':i===2?'bg-orange-50':'bg-white border border-ink-100')}>
                        <div className="w-8 text-center font-bold text-ink-700">#{r.rank_position}</div>
                        <div className="flex-1">
                          <button 
                          onClick={() => {
                            const url = `/candidates/view/?id=${r.user_id}`;
                            console.log('[RANKINGS] Navigating to:', url);
                            window.location.assign(url);
                          }}
                            className="font-medium text-ink-900 text-sm hover:text-blue-600 hover:underline text-left block w-full py-1"
                          >
                            {r.full_name}
                          </button>
                          <div className="flex gap-3 text-xs text-ink-400">
                            <span>Practice:{Math.round(r.practice_score||0)}</span>
                            <span>GitHub:{Math.round(r.github_score||0)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">{Math.round(r.total_score||0)}</div>
                          {r.rank_change!==0 && <div className={clsx('text-xs', r.rank_change>0?'text-green-600':'text-red-500')}>{r.rank_change>0?'↑':'↓'}{Math.abs(r.rank_change)}</div>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

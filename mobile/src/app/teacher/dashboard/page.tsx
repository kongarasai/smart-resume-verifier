'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { teacherAPI } from '@/lib/api';
import { Users, BookOpen, Trophy, Megaphone, ChevronRight, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getGroups()
      .then((r: any) => {
        setGroups(r.data || []);
        if (r.data?.[0]) loadGroup(r.data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadGroup = async (g: any) => {
    setSelectedGroup(g);
    const [m, r] = await Promise.all([
      teacherAPI.getGroupMembers(g.id),
      teacherAPI.getGroupRanking(g.id),
    ]);
    setMembers(m.data || []);
    setRankings(r.data || []);
  };

  // Candidates needing attention: low activity or falling rank
  const needsAttention = members.filter((m: any) => {
    const lastPractice = m.last_practice ? new Date(m.last_practice) : null;
    const daysSince = lastPractice ? (Date.now() - lastPractice.getTime()) / (1000*60*60*24) : 999;
    return (daysSince > 7 || m.rank_change < -2 || !m.confidence_score) && m.group_role === 'candidate';
  });

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl text-ink-900 mb-1">Teacher Dashboard</h1>
        <p className="text-ink-500 text-sm mb-8">Monitor candidates, rankings, and manage group activity</p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : groups.length === 0 ? (
          <div className="card p-14 text-center">
            <Users size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">Not assigned to any group</h3>
            <p className="text-ink-500 text-sm">Ask a mentor to add you as a teacher to their group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Group selector */}
            <div className="col-span-1 space-y-2">
              <div className="text-xs text-ink-500 uppercase tracking-wide mb-3">Your Groups</div>
              {groups.map(g => (
                <button key={g.id} onClick={() => loadGroup(g)}
                  className={clsx('w-full text-left card p-3 hover:border-ink-300 transition-all',
                    selectedGroup?.id === g.id ? 'border-ink-900 bg-ink-50' : '')}>
                  <div className="font-medium text-ink-900 text-sm">{g.name}</div>
                  <div className="text-xs text-ink-500">{g.workspace_name}</div>
                  <div className="text-xs text-ink-400 mt-1 flex items-center justify-between">
                    <span>{g.member_count} members</span>
                    <Link href={`/teacher/analytics?groupId=${g.id}`} className="text-blue-600 hover:underline flex items-center gap-1 font-bold">
                      <TrendingUp size={10} /> Analytics
                    </Link>
                  </div>
                </button>
              ))}
              <div className="pt-3 space-y-1">
                <Link href="/teacher/problems" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink-600 hover:bg-ink-100 transition-colors">
                  <BookOpen size={13} /> Add Questions
                </Link>
                <Link href="/teacher/rankings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink-600 hover:bg-ink-100 transition-colors">
                  <Trophy size={13} /> View Rankings
                </Link>
              </div>
            </div>

            {/* Main content */}
            {selectedGroup && (
              <div className="col-span-3 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['Candidates', members.filter((m:any)=>m.group_role==='candidate').length, '#1a6fa8'],
                    ['Active (7d)', members.filter((m:any)=>{ const d=m.last_practice?new Date(m.last_practice):null; return d&&(Date.now()-d.getTime())<7*24*60*60*1000&&m.group_role==='candidate';}).length, '#2d9e5f'],
                    ['Needs Attention', needsAttention.length, '#d97706'],
                    ['Avg Score', rankings.length ? Math.round(rankings.reduce((s:number,r:any)=>s+(Number(r.total_score)||0),0)/rankings.length) || 0 : 0, '#7c3aed'],
                  ].map(([l, v, c]) => (
                    <div key={l} className="card p-4 text-center">
                      <div className="font-display text-2xl font-bold" style={{color:c as string}}>{v}</div>
                      <div className="text-xs text-ink-500 mt-1">{l}</div>
                    </div>
                  ))}
                </div>

                {/* Needs attention */}
                {needsAttention.length > 0 && (
                  <div className="card p-5 border-amber-200 bg-amber-50">
                    <h3 className="font-medium text-amber-900 text-sm mb-3 flex items-center gap-2">⚠ Candidates Needing Attention ({needsAttention.length})</h3>
                    {needsAttention.map((m: any) => (
                      <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0 text-sm">
                        <div className="flex-1">
                          <button 
                              onClick={() => {
                                const url = `/candidates/view/?id=${m.user_id}`;
                                console.log('[DASHBOARD] Navigating to:', url);
                                window.location.assign(url);
                              }}
                            className="font-medium text-ink-900 hover:text-blue-600 hover:underline"
                          >
                            {m.full_name}
                          </button>
                          <span className="text-xs text-ink-500 ml-2">{m.email}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex gap-2">
                            {!m.last_practice && <span className="badge badge-red">No practice</span>}
                            {m.rank_change < -2 && <span className="badge badge-amber">Rank dropping</span>}
                            {!m.confidence_score && <span className="badge badge-gray">No score</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                toast.loading('Opening profile...', { duration: 1500 });
                                const url = `/candidates/view/?id=${m.user_id}`;
                                router.push(url);
                                setTimeout(() => { window.location.href = url; }, 500);
                              }}
                              className="px-3 py-1.5 bg-white border border-ink-200 text-ink-700 rounded transition flex items-center gap-1 hover:bg-ink-100"
                            >
                               <Eye size={13}/> Profile
                            </button>
                            <a href={`mailto:${m.email}?subject=Checking in on your SentryConnect Progress`} className="bg-amber-600/10 hover:bg-amber-600 text-amber-900 hover:text-white px-3 py-1.5 rounded transition-colors border border-amber-600/20">
                              Reminder
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rankings */}
                <div className="card p-5">
                  <h3 className="section-title mb-4">Group Rankings — {selectedGroup.name}</h3>
                  {rankings.length === 0 ? (
                    <p className="text-ink-400 text-sm text-center py-6">No rankings yet. Candidates need to solve practice problems.</p>
                  ) : (
                    <div className="space-y-2">
                      {rankings.map((r: any, i: number) => (
                        <div key={r.user_id} className={clsx('flex items-center gap-3 p-3 rounded-lg',
                          i===0?'bg-amber-50 border border-amber-200':i===1?'bg-ink-100':i===2?'bg-orange-50 border border-orange-200':'bg-white border border-ink-100')}>
                          <div className="w-8 text-center font-bold text-ink-700">#{r.rank_position}</div>
                          <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-medium text-ink-600 shrink-0">{r.full_name?.[0]?.toUpperCase()}</div>
                          <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => {
                              toast.loading('Opening profile...', { duration: 1500 });
                              const url = `/candidates/view/?id=${r.user_id}`;
                              router.push(url);
                              setTimeout(() => { window.location.href = url; }, 500);
                            }}
                            className="font-medium text-ink-900 text-sm hover:text-blue-600 hover:underline"
                          >
                            {r.full_name}
                          </button>
                            <div className="flex gap-2 text-xs text-ink-400 mt-0.5">
                              <span>Practice: {Math.round(r.practice_score||0)}</span>
                              <span>GitHub: {Math.round(r.github_score||0)}</span>
                              <span>LeetCode: {Math.round(r.leetcode_score||0)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-xl font-bold text-ink-900 w-16 text-right mr-4">{Math.round(r.total_score||0)}</span>
                            <button 
                              onClick={() => {
                                toast.loading('Opening profile...', { duration: 1500 });
                                const url = `/candidates/view/?id=${r.user_id}`;
                                router.push(url);
                                setTimeout(() => { window.location.href = url; }, 500);
                              }}
                              className="px-3 py-1.5 bg-white border border-ink-200 text-ink-700 rounded text-xs font-medium hover:bg-ink-100 transition flex items-center gap-1.5"
                            >
                              <Eye size={13}/> View Profile
                            </button>
                          </div>
                          <div className={clsx('text-xs flex items-center gap-0.5 justify-end',
                            r.rank_change>0?'text-green-600':r.rank_change<0?'text-red-500':'text-ink-400')}>
                            {r.rank_change>0?<TrendingUp size={10}/>:r.rank_change<0?<TrendingDown size={10}/>:<Minus size={10}/>}
                            {r.rank_change!==0?Math.abs(r.rank_change):'-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* All candidates */}
                <div className="card p-5">
                  <h3 className="section-title mb-4">All Candidates</h3>
                  <div className="space-y-2">
                    {members.filter((m:any)=>m.group_role==='candidate').map((m: any) => {
                      const lastPractice = m.last_practice ? new Date(m.last_practice) : null;
                      const daysSince = lastPractice ? Math.floor((Date.now()-lastPractice.getTime())/(1000*60*60*24)) : null;
                      return (
                        <div key={m.user_id} className="flex items-center gap-3 py-2 border-b border-ink-100 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-medium text-ink-600 shrink-0">{m.full_name?.[0]?.toUpperCase()}</div>
                          <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => {
                              const url = `/candidates/view/?id=${m.user_id}`;
                              console.log('[DASHBOARD] Navigating to:', url);
                              window.location.assign(url);
                            }}
                            className="font-medium text-ink-900 text-sm hover:underline"
                          >
                            {m.full_name}
                          </button>
                            <div className="text-xs text-ink-400">{m.email}</div>
                          </div>
                          <div className="flex gap-3 text-xs text-center">
                            <div><div className="font-mono font-bold">{m.confidence_score||0}</div><div className="text-ink-400">Score</div></div>
                            <div><div className="font-mono font-bold">{m.rank_position?`#${m.rank_position}`:'—'}</div><div className="text-ink-400">Rank</div></div>
                            <div>
                              <div className={clsx('font-medium', daysSince===null?'text-ink-400':daysSince<=3?'text-green-600':daysSince<=7?'text-amber-600':'text-red-500')}>
                                {daysSince===null?'Never':`${daysSince}d`}
                              </div>
                              <div className="text-ink-400">Last active</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

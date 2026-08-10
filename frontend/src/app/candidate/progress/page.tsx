'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { practiceAPI, profileAPI, scoringAPI } from '@/lib/api';
import { ProgressTimeline } from '@/components/candidate/ProgressTimeline';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, Star, Trophy, BookOpen, CheckCircle, BarChart2, History, Plus, ArrowRight, Briefcase, Ban, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import clsx from 'clsx';

export default function ProgressPage() {
  const [stats, setStats] = useState<any>(null);
  const [hiringStatus, setHiringStatus] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [score, setScore] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionAttempts, setSessionAttempts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    Promise.all([
      practiceAPI.getProgress(),
      profileAPI.getTimeline(),
      scoringAPI.get().catch(() => ({ data: null })),
      profileAPI.get().catch(() => ({ data: null })),
    ]).then(([prRes, tlRes, scRes, pfRes]) => {
      setStats(prRes.data);
      setTimeline(tlRes.data || []);
      setScore(scRes.data);
      setProfile(pfRes.data?.profile);
      setHiringStatus(pfRes.data?.hiring_status);
    }).catch(() => {}).finally(() => setLoading(false));
    practiceAPI.getHistory().then((r: any) => setSessionHistory(r.data || [])).catch(() => {});
  }, []);

  const toggleSessionExpand = async (sessionId: string) => {
    if (expandedSession === sessionId) { setExpandedSession(null); return; }
    setExpandedSession(sessionId);
    if (!sessionAttempts[sessionId]) {
      try {
        const r = await practiceAPI.getSessionAttempts(sessionId);
        setSessionAttempts(prev => ({ ...prev, [sessionId]: r.data?.attempts || [] }));
      } catch { setSessionAttempts(prev => ({ ...prev, [sessionId]: [] })); }
    }
  };

  const chartData = stats?.by_category?.map((c: any) => ({
    name: c.category, score: Math.round(c.avg_score)
  })) || [];

  const SUGGESTIONS = [
    { done: timeline.some(e=>e.event_type==='resume_uploaded'), action: 'Upload your resume PDF', gain: '+10% completeness', href: '/candidate/profile' },
    { done: timeline.some(e=>e.event_type==='resume_parsed'), action: 'Parse resume to extract skills', gain: 'Auto-detect skills', href: '/candidate/profile' },
    { done: timeline.some(e=>e.event_type==='github_verified'), action: 'Verify your GitHub profile', gain: '+15 skill evidence', href: '/candidate/github' },
    { done: timeline.some(e=>e.event_type==='leetcode_verified'), action: 'Verify your LeetCode profile', gain: '+15 coding evidence', href: '/candidate/leetcode' },
    { done: timeline.some(e=>e.event_type==='practice_completed'), action: 'Complete a practice session', gain: 'Boost practice score', href: '/candidate/practice' },
  ];

  if (loading) return <DashboardLayout requiredRole="candidate"><div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-1">My Progress</h1>
            <p className="text-ink-500 text-sm">Comprehensive view of your scores, activities, and career growth.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => window.location.href='/candidate/practice'} className="btn-primary text-xs"><BookOpen size={12}/> Practice Now</button>
          </div>
        </div>

        {/* Hiring Status Banner */}
        {Array.isArray(hiringStatus) && hiringStatus.length > 0 && (
          <div className={clsx(
            "mb-8 p-4 rounded-xl border flex items-center justify-between animate-slide-up shadow-sm",
            hiringStatus.some((s: any) => s.status === 'shortlisted') ? "bg-purple-50 border-purple-200 text-purple-900" :
            hiringStatus.some((s: any) => s.status === 'rejected') ? "bg-red-50 border-red-200 text-red-900" :
            hiringStatus.some((s: any) => s.status === 'hold') ? "bg-orange-50 border-orange-200 text-orange-900" :
            "bg-blue-50 border-blue-200 text-blue-900"
          )}>
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shadow-inner",
                hiringStatus.some((s: any) => s.status === 'shortlisted') ? "bg-purple-100 text-purple-600" :
                hiringStatus.some((s: any) => s.status === 'rejected') ? "bg-red-100 text-red-600" :
                hiringStatus.some((s: any) => s.status === 'hold') ? "bg-orange-100 text-orange-600" :
                "bg-blue-100 text-blue-600"
              )}>
                {hiringStatus.some((s: any) => s.status === 'shortlisted') ? <Star size={20} fill="currentColor" /> :
                 hiringStatus.some((s: any) => s.status === 'rejected') ? <Ban size={20} /> :
                 hiringStatus.some((s: any) => s.status === 'hold') ? <Clock size={20} /> :
                 <Briefcase size={20} />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-60">Recruitment Status</div>
                <div className="text-lg font-display font-bold capitalize">
                  {hiringStatus.length > 1 ? 
                    Array.from(new Set(hiringStatus.map((s: any) => s.status.charAt(0).toUpperCase() + s.status.slice(1)))).join(', ') : 
                    hiringStatus[0].status}
                </div>
              </div>
            </div>
            {hiringStatus[0].notes && (
              <div className="text-sm italic opacity-80 max-w-md text-right border-l border-ink-200 pl-4">
                "{hiringStatus[0].notes}"
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 text-center">
            <div className="font-display text-3xl text-ink-900">{stats?.overall?.total || 0}</div>
            <div className="text-xs text-ink-500 mt-1">Practice Attempts</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-display text-3xl text-green-700">{stats?.overall?.correct || 0}</div>
            <div className="text-xs text-ink-500 mt-1">Correct Answers</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-display text-3xl text-ink-900">
              {stats?.overall?.total > 0 ? Math.round((stats.overall.correct / stats.overall.total) * 100) : 0}%
            </div>
            <div className="text-xs text-ink-500 mt-1">Practice Accuracy</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-display text-3xl text-amber-600">{score?.overall_score || 0}</div>
            <div className="text-xs text-ink-500 mt-1">Confidence Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            {/* Chart */}
            {chartData.length > 0 && (
              <div className="card p-6">
                <h3 className="section-title mb-6 flex items-center gap-2">
                  <BarChart2 size={16} className="text-ink-400" /> Category Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#1e1b17" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Session History Table */}
            {sessionHistory.length > 0 && (
              <div className="card p-6">
                <h3 className="section-title mb-6 flex items-center gap-2">
                  <History size={16} className="text-ink-400" /> Practice Session History
                </h3>
                <div className="space-y-2">
                  {sessionHistory.map((s: any) => (
                    <div key={s.id}>
                      <button onClick={() => toggleSessionExpand(s.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-ink-100 hover:border-ink-300 hover:bg-ink-50 transition-all text-sm">
                        <div className="flex items-center gap-3">
                          {expandedSession === s.id ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                          <span className="font-medium text-ink-900 capitalize">{s.category?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={clsx('font-bold font-mono text-sm', s.score_percentage >= 70 ? 'text-green-700' : s.score_percentage >= 40 ? 'text-amber-600' : 'text-red-600')}>
                            {s.score_percentage ?? 0}%
                          </span>
                          <span className="text-ink-500 text-xs">{s.correct_answers ?? 0}/{s.total_questions ?? 0}</span>
                          <span className="text-ink-400 text-xs">{s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '-'}</span>
                        </div>
                      </button>
                      {expandedSession === s.id && (
                        <div className="ml-6 mt-1 mb-3 border-l-2 border-ink-200 pl-4 space-y-2 py-2">
                          {!sessionAttempts[s.id] ? (
                            <div className="text-ink-400 text-xs py-3 animate-pulse">Loading attempts...</div>
                          ) : sessionAttempts[s.id].length === 0 ? (
                            <div className="text-ink-400 text-xs py-3">No detailed attempts recorded for this session.</div>
                          ) : (
                            sessionAttempts[s.id].slice(0, 20).map((a: any, i: number) => (
                              <div key={i} className={clsx('p-3 rounded-lg border text-xs', a.is_correct ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100')}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-medium text-ink-800">{a.title || `Question ${i+1}`}</div>
                                  <div className="shrink-0">
                                    {a.is_correct ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-500" />}
                                  </div>
                                </div>
                                <div className="mt-1.5 flex gap-4">
                                  <span className="text-ink-500">Your answer: <span className={clsx('font-mono font-medium', a.is_correct ? 'text-green-700' : 'text-red-600')}>{a.submitted_answer || '-'}</span></span>
                                  {!a.is_correct && a.correct_answer && <span className="text-ink-500">Correct: <span className="font-mono font-medium text-green-700">{a.correct_answer}</span></span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card p-6">
              <h3 className="section-title mb-8 flex items-center gap-2">
                <History size={16} className="text-ink-400" /> Activity Journey
              </h3>
              {timeline.length === 0 ? (
                 <div className="text-center py-12">
                   <Clock size={40} className="mx-auto text-ink-300 mb-4" />
                   <p className="text-ink-500">No activity recorded yet.</p>
                 </div>
              ) : (
                <ProgressTimeline events={timeline} />
              )}
            </div>
          </div>

          <div className="col-span-1 space-y-6">
             {/* Next steps */}
            <div className="card p-5">
              <h2 className="section-title mb-4">Recommended Next Steps</h2>
              <div className="space-y-3">
                {SUGGESTIONS.map(({ action, gain, href, done }) => (
                  <a key={action} href={href} className={clsx('flex items-center gap-3 p-3 border rounded-lg transition-all', 
                    done ? 'bg-green-50/50 border-green-100 opacity-60' : 'bg-amber-50 border-amber-200 hover:bg-amber-100')}>
                    <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center shrink-0', done ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>
                      {done ? <CheckCircle size={12} /> : <Plus size={12} />}
                    </div>
                    <div className="min-w-0">
                      <div className={clsx('text-xs font-medium truncate', done ? 'text-green-800' : 'text-amber-900')}>{action}</div>
                      <div className={clsx('text-[10px]', done ? 'text-green-600' : 'text-amber-600')}>{done ? 'Completed' : gain}</div>
                    </div>
                    {!done && <ArrowRight size={10} className="ml-auto text-amber-400" />}
                  </a>
                ))}
              </div>
            </div>

            {/* Streak/Activity card */}
            <div className="card p-5 bg-ink-900 text-white">
               <h3 className="text-xs font-medium text-ink-400 uppercase tracking-widest mb-4">Activity Insights</h3>
               <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-display">{stats?.active_days_30 || 0}</div>
                  <div className="text-[10px] text-ink-400 text-right">Active days<br/>(Last 30d)</div>
               </div>
               <div className="w-full h-1 bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${(Math.min(stats?.active_days_30 || 0, 30) / 30) * 100}%` }} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

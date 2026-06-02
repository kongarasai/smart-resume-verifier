'use client';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { jobAPI } from '@/lib/api';
import { Briefcase, ExternalLink, RefreshCw, Search, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Tab = 'matched' | 'all';

export default function JobsPage() {
  const [tab, setTab] = useState<Tab>('matched');
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');

  const loadJobs = useCallback(async (t: Tab = tab, p = page, q = search) => {
    setLoading(true);
    try {
      const res = await jobAPI.getAll({ tab: t, page: p, limit: 20, search: q || undefined });
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setMessage(res.data.message || '');
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, [tab, page, search]);

  useEffect(() => { loadJobs(); }, []);

  const switchTab = (t: Tab) => {
    setTab(t); setPage(1); setSearch('');
    loadJobs(t, 1, '');
  };

  const doSearch = () => { setPage(1); loadJobs(tab, 1, search); };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await jobAPI.refresh();
      toast.success(res.data.message || 'Jobs refreshed!');
      loadJobs(tab, 1, search);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Refresh failed'); }
    finally { setRefreshing(false); }
  };

  const analyze = async () => {
    if (!analyzeInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await jobAPI.analyze(analyzeInput.trim());
      setAnalysis(res.data);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const priorityColor = (p: string) => ({
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-ink-100 text-ink-600 border-ink-200',
  }[p] || 'bg-ink-100 text-ink-600 border-ink-200');

  const totalPages = Math.ceil(total / 20);

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-1">Jobs</h1>
            <p className="text-ink-500 text-sm">Real jobs from Remotive, Jobicy &amp; Arbeitnow — refreshed every 6h</p>
          </div>
          <button onClick={refresh} disabled={refreshing} className="btn-secondary">
            {refreshing ? <span className="w-4 h-4 border-2 border-ink-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={14} />}
            {refreshing ? 'Refreshing...' : 'Refresh Jobs'}
          </button>
        </div>

        {/* Analyzer */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-amber-500" />
            <span className="font-medium text-ink-900 text-sm">Job Role Analyzer</span>
            <span className="text-xs text-ink-400">— See how well your skills match any role</span>
          </div>
          <div className="flex gap-3 mb-3">
            <input value={analyzeInput} onChange={e => setAnalyzeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              className="input flex-1" placeholder="e.g. Full Stack Developer, Java Backend Engineer..." />
            <button onClick={analyze} disabled={analyzing} className="btn-primary shrink-0">
              {analyzing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={14} />}
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-ink-100">
              <div>
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-2">✓ Skills You Have</div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matched?.length > 0
                    ? analysis.matched.map((s: string) => <span key={s} className="badge badge-green">{s}</span>)
                    : <span className="text-xs text-ink-400 italic">None matched — add skills to your profile</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-2">✗ Skills You Need</div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing?.length > 0
                    ? analysis.missing.map((m: any) => (
                      <span key={m.skill} className={clsx('badge', priorityColor(m.priority))}>
                        {m.skill} <span className="opacity-60 text-xs">({m.priority})</span>
                      </span>
                    ))
                    : <span className="text-xs text-green-600">You have all required skills! 🎉</span>}
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 score-bar">
                    <div className="score-bar-fill" style={{ width: `${analysis.match_pct}%`, background: analysis.match_pct >= 70 ? '#2d9e5f' : analysis.match_pct >= 40 ? '#d97706' : '#ef4444' }} />
                  </div>
                  <span className="font-mono font-bold text-ink-900 text-sm">{analysis.match_pct}% match</span>
                </div>
                {analysis.nice_to_have?.length > 0 && (
                  <div className="text-xs text-ink-500">Nice to have: {analysis.nice_to_have.join(', ')}</div>
                )}
                {analysis.recommendations?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {analysis.recommendations.map((r: string, i: number) => (
                      <div key={i} className="text-xs text-ink-600 flex items-start gap-1.5">
                        <span className="text-amber-500 shrink-0">→</span> {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Two-tab job view */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 border-b border-ink-200 flex-1">
            <button onClick={() => switchTab('matched')}
              className={clsx('px-5 py-2.5 text-sm -mb-px border-b-2 transition-colors',
                tab === 'matched' ? 'border-ink-900 text-ink-900 font-medium' : 'border-transparent text-ink-500 hover:text-ink-700')}>
              ⚡ Skills Matched
            </button>
            <button onClick={() => switchTab('all')}
              className={clsx('px-5 py-2.5 text-sm -mb-px border-b-2 transition-colors',
                tab === 'all' ? 'border-ink-900 text-ink-900 font-medium' : 'border-transparent text-ink-500 hover:text-ink-700')}>
              📋 All Job Links
            </button>
            <span className="ml-auto text-xs text-ink-400 self-center pb-1">{total} jobs</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-5">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
            className="input flex-1" placeholder="Search jobs by title or company..." />
          <button onClick={doSearch} className="btn-secondary"><Search size={14} /></button>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : message && jobs.length === 0 ? (
          <div className="card p-14 text-center">
            <Briefcase size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">
              {tab === 'matched' ? 'No matched jobs yet' : 'No jobs found'}
            </h3>
            <p className="text-ink-500 text-sm max-w-sm mx-auto">{message}</p>
            {tab === 'matched' && (
              <button onClick={() => switchTab('all')} className="btn-secondary mt-4 mx-auto">Browse All Jobs</button>
            )}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-14 text-center">
            <Briefcase size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">No jobs stored yet</h3>
            <p className="text-ink-500 text-sm mb-4">Click Refresh Jobs to fetch the latest opportunities.</p>
            <button onClick={refresh} className="btn-primary mx-auto">Fetch Jobs Now</button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              {jobs.map((job: any) => (
                <div key={job.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-ink-900 text-sm">{job.title}</h3>
                        {job.match_pct != null && (
                          <span className={clsx('badge', job.match_pct >= 70 ? 'badge-green' : job.match_pct >= 40 ? 'badge-amber' : 'badge-red')}>
                            {job.match_pct}% match
                          </span>
                        )}
                        {job.source_platform && (
                          <span className="badge badge-gray capitalize">{job.source_platform}</span>
                        )}
                      </div>
                      <div className="text-xs text-ink-500 mb-2">
                        {job.company && <span className="font-medium text-ink-700">{job.company}</span>}
                        {job.location && <span> · {job.location}</span>}
                        {job.job_type && <span> · {job.job_type}</span>}
                      </div>
                      {/* Skills */}
                      {job.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {job.required_skills.slice(0, 7).map((s: string) => (
                            <span key={s} className={clsx('skill-chip text-xs',
                              job.matched?.includes(s) ? 'bg-green-50 text-green-700 border-green-200' : '')}>
                              {job.matched?.includes(s) && '✓ '}{s}
                            </span>
                          ))}
                          {job.required_skills.length > 7 && <span className="text-xs text-ink-400">+{job.required_skills.length - 7} more</span>}
                        </div>
                      )}
                      {/* Missing skills */}
                      {tab === 'matched' && job.missing?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-ink-400 self-center">Missing:</span>
                          {job.missing.slice(0, 3).map((m: any) => (
                            <span key={m.skill} className={clsx('badge text-xs', priorityColor(m.priority))}>
                              {m.skill} <span className="opacity-60">({m.priority})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {job.apply_url && (
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0 text-xs">
                        Apply <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); loadJobs(tab, p, search); }}
                  disabled={page === 1} className="btn-secondary text-xs py-1.5">
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-xs text-ink-500">Page {page} of {totalPages}</span>
                <button onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); loadJobs(tab, p, search); }}
                  disabled={page === totalPages} className="btn-secondary text-xs py-1.5">
                  Next <ChevronRight size={13} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

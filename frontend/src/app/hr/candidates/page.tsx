'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { hrAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronRight, Github, Code2, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { getImageUrl } from '@/utils/platform';

const READINESS_BADGE: Record<string, string> = {
  top_performer: 'badge-green', interview_ready: 'badge-green', job_ready: 'badge-blue',
  developing: 'badge-amber', beginner: 'badge-red',
};

export default function HRCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ skills: '', min_confidence: '', min_practice_score: '', has_github: '', sort_by: 'overall_score' });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { sort_by: filters.sort_by };
      if (filters.skills) params.skills = filters.skills;
      if (filters.min_confidence) params.min_confidence = filters.min_confidence;
      if (filters.min_practice_score) params.min_practice_score = filters.min_practice_score;
      if (filters.has_github) params.has_github = filters.has_github;
      const res = await hrAPI.searchCandidates(params);
      setCandidates(res.data || []);
    } catch { setCandidates([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = candidates.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.skills?.some((s: string) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const confidenceColor = (label: string) => ({
    high: 'badge-green', medium: 'badge-amber', limited: 'badge-red',
  }[label] || 'badge-gray');

  return (
    <DashboardLayout requiredRole="hr">
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-1">Candidate Pool</h1>
          <p className="text-ink-500 text-sm">Browse verified candidates with evidence-backed scores</p>
        </div>

        <div className="card p-4 mb-5 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-3 text-ink-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-8" placeholder="Search name or skill..." />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
              <SlidersHorizontal size={14} /> Filters
            </button>
            <button onClick={load} className="btn-primary"><Filter size={14} /> Search</button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-ink-100">
              <div><label className="label">Skills</label><input className="input" placeholder="java, python..." value={filters.skills} onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))} /></div>
              <div><label className="label">Min Confidence</label><input type="number" className="input" placeholder="0–100" value={filters.min_confidence} onChange={e => setFilters(f => ({ ...f, min_confidence: e.target.value }))} /></div>
              <div><label className="label">Min Practice Score</label><input type="number" className="input" placeholder="0–100" value={filters.min_practice_score} onChange={e => setFilters(f => ({ ...f, min_practice_score: e.target.value }))} /></div>
              <div>
                <label className="label">GitHub</label>
                <select className="input" value={filters.has_github} onChange={e => setFilters(f => ({ ...f, has_github: e.target.value }))}>
                  <option value="">Any</option>
                  <option value="true">Has GitHub</option>
                </select>
              </div>
              <div>
                <label className="label">Sort By</label>
                <select className="input" value={filters.sort_by} onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value }))}>
                  <option value="overall_score">Confidence Score</option>
                  <option value="practice_score">Practice Score</option>
                  <option value="years_experience">Experience</option>
                  <option value="total_solved">LeetCode Solved</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[['Total', filtered.length], ['High Confidence', filtered.filter(c => c.confidence_label === 'high').length], ['GitHub Verified', filtered.filter(c => c.total_repos > 0).length], ['LeetCode Active', filtered.filter(c => c.total_solved > 0).length]].map(([l, v]) => (
            <div key={l} className="card p-4 text-center">
              <div className="font-display text-2xl text-ink-900">{v}</div>
              <div className="text-xs text-ink-500 mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center"><p className="text-ink-400 text-sm">No candidates found. Adjust filters.</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <button 
                key={c.id} 
                onClick={() => router.push(`/candidates/view/?id=${c.id}`)}
                className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-ink-300 transition-all block w-full text-left"
              >
                <div className="w-10 h-10 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 font-medium text-sm shrink-0 overflow-hidden relative">
                  {c.photo_url ? (
                    <img 
                      src={getImageUrl(c.photo_url)} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : null}
                  <span className="absolute">{c.full_name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-ink-900">{c.full_name}</h3>
                    {c.confidence_label && <span className={clsx('badge', confidenceColor(c.confidence_label))}>{c.confidence_label === 'high' ? 'High' : c.confidence_label === 'medium' ? 'Medium' : 'Limited'}</span>}
                    {c.career_readiness && <span className={clsx('badge', READINESS_BADGE[c.career_readiness] || 'badge-gray')}>{c.career_readiness.replace('_', ' ')}</span>}
                  </div>
                  <p className="text-xs text-ink-500">{c.headline || c.location}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {c.skills?.filter(Boolean).slice(0, 5).map((s: string) => <span key={s} className="skill-chip">{s}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center"><div className="font-mono text-lg font-bold text-ink-900">{c.overall_score ?? '—'}</div><div className="text-xs text-ink-400">Score</div></div>
                  {c.total_repos != null && <div className="text-center hidden sm:block"><div className="flex items-center gap-1 text-sm font-medium"><Github size={11} /> {c.total_repos}</div><div className="text-xs text-ink-400">Repos</div></div>}
                  {c.total_solved != null && <div className="text-center hidden sm:block"><div className="flex items-center gap-1 text-sm font-medium"><Code2 size={11} /> {c.total_solved}</div><div className="text-xs text-ink-400">LC</div></div>}
                  <ChevronRight size={15} className="text-ink-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

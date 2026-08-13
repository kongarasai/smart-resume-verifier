'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { hrAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, CheckCircle, XCircle, Target } from 'lucide-react';

export default function SearchPage() {
  const [form, setForm] = useState({ required_skills: '', technologies: '', min_experience: '' });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const search = async () => {
    setLoading(true);
    try {
      const payload: any = {
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        technologies: form.technologies.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (form.min_experience) payload.min_experience = parseInt(form.min_experience);
      const res = await hrAPI.matchRequirements(payload);
      setResults(res.data.matches || []);
      setSearched(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const matchColor = (pct: number) => pct >= 80 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-red-600';
  const matchBg = (pct: number) => pct >= 80 ? 'bg-green-50' : pct >= 50 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <DashboardLayout requiredRole="hr">
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-1">Requirement Matching</h1>
          <p className="text-ink-500 text-sm">Enter your job requirements and we'll rank candidates by match percentage.</p>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="section-title mb-4">Job Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="label">Required Skills *</label>
              <input
                className="input"
                placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                value={form.required_skills}
                onChange={e => setForm(f => ({ ...f, required_skills: e.target.value }))}
              />
              <p className="text-xs text-ink-400 mt-1">Comma separated</p>
            </div>
            <div>
              <label className="label">Technologies</label>
              <input
                className="input"
                placeholder="e.g. AWS, Kubernetes, Redis"
                value={form.technologies}
                onChange={e => setForm(f => ({ ...f, technologies: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Min. Experience (years)</label>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="0"
                value={form.min_experience}
                onChange={e => setForm(f => ({ ...f, min_experience: e.target.value }))}
              />
            </div>
          </div>
          <button onClick={search} disabled={loading || !form.required_skills} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={14} />}
            {loading ? 'Matching...' : 'Find Matches'}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Results</h2>
              <span className="text-sm text-ink-500">{results.length} candidates ranked</span>
            </div>

            {results.length === 0 ? (
              <div className="card p-12 text-center">
                <Target size={32} className="mx-auto text-ink-300 mb-3" />
                <p className="text-ink-400">No matching candidates found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((c, i) => (
                  <button 
                    key={c.id} 
                    onClick={() => router.push(`/candidates/view/?id=${c.id}`)}
                    className="card p-5 flex items-center gap-5 hover:shadow-md hover:border-ink-300 transition-all block w-full text-left"
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 ${matchBg(c.overall_match)} ${matchColor(c.overall_match)}`}>
                      #{i + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-ink-900 mb-1">{c.full_name}</h3>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {c.matched_skills.map((s: string) => (
                          <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs">
                            <CheckCircle size={9} /> {s}
                          </span>
                        ))}
                        {c.missing_skills.map((s: string) => (
                          <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs">
                            <XCircle size={9} /> {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Match scores */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-center">
                        <div className={`font-mono text-2xl font-bold ${matchColor(c.overall_match)}`}>{c.overall_match}%</div>
                        <div className="text-xs text-ink-400">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-lg font-medium text-ink-700">{c.skill_match}%</div>
                        <div className="text-xs text-ink-400">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-lg font-medium text-ink-700">{c.confidence_score ?? '—'}</div>
                        <div className="text-xs text-ink-400">Score</div>
                      </div>
                      <ChevronRight size={16} className="text-ink-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

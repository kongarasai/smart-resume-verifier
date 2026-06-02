'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { githubAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Github, RefreshCw, GitBranch, Star, GitCommit, Globe, Users } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

export default function GitHubPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    githubAPI.getData().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const verify = async () => {
    setVerifying(true);
    try {
      const res = await githubAPI.verify();
      setData(res.data);
      toast.success('GitHub data verified and stored!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed. Add GitHub URL to profile first.');
    } finally {
      setVerifying(false);
    }
  };

  const langData = data?.languages
    ? Object.entries(data.languages).slice(0, 6).map(([lang, count]) => ({ subject: lang, value: count as number }))
    : [];

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-1">GitHub Verification</h1>
            <p className="text-ink-500 text-sm">We fetch real data from GitHub's API to verify your coding activity.</p>
          </div>
          <button onClick={verify} disabled={verifying} className="btn-primary">
            {verifying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={14} />}
            {verifying ? 'Verifying...' : data ? 'Re-verify' : 'Verify GitHub'}
          </button>
        </div>

        {loading && <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>}

        {!loading && !data && (
          <div className="card p-12 text-center">
            <Github size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">Not verified yet</h3>
            <p className="text-ink-500 text-sm mb-6">Make sure your GitHub URL is set in your profile, then click Verify GitHub.</p>
            <button onClick={verify} disabled={verifying} className="btn-primary mx-auto">
              <Github size={14} /> Verify Now
            </button>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            {/* Skill score card */}
            <div className="card p-6">
              <div className="text-xs text-ink-500 uppercase tracking-wide mb-1">GitHub Skill Score</div>
              <div className="font-display text-5xl font-bold text-ink-900 mb-1">{data.skill_match_score}</div>
              <div className="text-xs text-ink-400 font-mono mb-4">/100</div>
              <div className="score-bar">
                <div className="score-bar-fill bg-signal-blue" style={{ width: `${data.skill_match_score}%` }} />
              </div>
              <div className="mt-5 text-xs text-ink-500">
                Last verified: {new Date(data.fetched_at).toLocaleDateString()}
              </div>
            </div>

            {/* Stats */}
            <div className="card p-6">
              <div className="text-xs text-ink-500 uppercase tracking-wide mb-4">Activity Stats</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: GitBranch, label: 'Repositories', value: data.total_repos },
                  { icon: Star, label: 'Total Stars', value: data.total_stars },
                  { icon: GitCommit, label: 'Recent Commits', value: data.total_commits },
                  { icon: Users, label: 'Followers', value: data.followers },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-ink-50 rounded-lg p-3">
                    <Icon size={14} className="text-ink-400 mb-1.5" />
                    <div className="font-mono text-xl font-bold text-ink-900">{value || 0}</div>
                    <div className="text-xs text-ink-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language radar */}
            {langData.length > 0 && (
              <div className="card p-6">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-4">Language Activity</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={langData}>
                    <PolarGrid stroke="#e8e6df" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#787062' }} />
                    <Radar dataKey="value" stroke="#1a6fa8" fill="#1a6fa8" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top repos */}
            {data.top_repos?.length > 0 && (
              <div className="card p-6">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-4">Top Repositories</div>
                <div className="space-y-3">
                  {data.top_repos.map((repo: any) => (
                    <div key={repo.name} className="flex items-start justify-between gap-2 py-2 border-b border-ink-100 last:border-0">
                      <div>
                        <a href={repo.url} target="_blank" className="text-sm font-medium text-ink-900 hover:text-signal-blue">{repo.name}</a>
                        {repo.description && <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{repo.description}</p>}
                        {repo.language && <span className="text-xs text-ink-400">{repo.language}</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-ink-400 shrink-0">
                        <Star size={11} /> {repo.stars}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

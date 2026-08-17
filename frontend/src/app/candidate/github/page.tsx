'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { githubAPI, profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Github, RefreshCw, GitBranch, Star, GitCommit, Users, CheckCircle, ExternalLink } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

export default function GitHubPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ghRes, profileRes] = await Promise.all([
          githubAPI.getData().catch(() => ({ data: null })),
          profileAPI.get().catch(() => ({ data: null })),
        ]);
        setData(ghRes.data);
        const url = ghRes.data?.github_url || profileRes.data?.profile?.github_url || '';
        setProfileUrl(url);
        setGithubUrl(url);
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const verify = async () => {
    const urlToUse = githubUrl.trim() || profileUrl.trim();
    if (!urlToUse) {
      toast.error('Enter your GitHub profile URL or username first');
      return;
    }
    setVerifying(true);
    try {
      const res = await githubAPI.verify({ github_url: urlToUse });
      setData(res.data);
      setProfileUrl(urlToUse);
      toast.success('GitHub data verified and stored!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed. Please check the GitHub URL/username.');
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
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-1">GitHub Verification</h1>
          <p className="text-ink-500 text-sm">
            Enter your GitHub profile URL or username to fetch real activity and coding metrics directly from GitHub's API.
          </p>
        </div>

        {/* URL Input & Verify Box */}
        <div className="card p-6 mb-6">
          <label className="label">GitHub Profile URL or Username</label>
          <div className="flex gap-3">
            <input
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              className="input flex-1"
              placeholder="https://github.com/your-username or username"
              disabled={verifying}
            />
            <button
              onClick={verify}
              disabled={verifying}
              className="btn-primary shrink-0 min-w-36 justify-center"
            >
              {verifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> {data ? 'Re-verify' : 'Verify GitHub'}
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-ink-400 mt-2">
            Accepted formats: <code className="bg-ink-100 px-1 rounded">https://github.com/username</code> or simply <code className="bg-ink-100 px-1 rounded">username</code>
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !data && (
          <div className="card p-12 text-center">
            <Github size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">Not verified yet</h3>
            <p className="text-ink-500 text-sm mb-6">Enter your GitHub profile URL above and click Verify GitHub.</p>
          </div>
        )}

        {data && (
          <div className="space-y-6 animate-slide-up">
            {/* Verified Banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle size={18} className="text-green-600 shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-green-800">
                  Verified: @{data.github_username || data.username}
                </span>
                <span className="text-xs text-green-600 ml-2">
                  Last updated {data.fetched_at && !isNaN(new Date(data.fetched_at).getTime()) ? new Date(data.fetched_at).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              {(data.github_username || data.username) && (
                <a
                  href={`https://github.com/${data.github_username || data.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-700 hover:underline shrink-0"
                >
                  View Profile <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skill score card */}
              <div className="card p-6">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-1">GitHub Skill Score</div>
                <div className="font-display text-5xl font-bold text-ink-900 mb-1">{data.skill_match_score || 0}</div>
                <div className="text-xs text-ink-400 font-mono mb-4">/100</div>
                <div className="score-bar">
                  <div className="score-bar-fill bg-signal-blue" style={{ width: `${data.skill_match_score || 0}%` }} />
                </div>
                <div className="mt-5 text-xs text-ink-500">
                  Calculated from original repos, commits, stars, languages & followers.
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
                        <div className="flex-1">
                          <a href={repo.url} target="_blank" className="text-sm font-medium text-ink-900 hover:text-signal-blue block">{repo.name}</a>
                          {repo.description && <p className="text-xs text-ink-500 mt-1 line-clamp-1">{repo.description}</p>}
                          {repo.language && <span className="inline-flex mt-1.5 px-2 py-0.5 bg-ink-50 text-ink-500 text-[10px] rounded font-medium border border-ink-100">{repo.language}</span>}
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

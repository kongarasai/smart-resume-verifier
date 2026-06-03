'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { leetcodeAPI, profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Code2, RefreshCw, CheckCircle, ExternalLink, Trophy, Target, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function LeetCodePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [lcRes, profileRes] = await Promise.all([
          leetcodeAPI.getData().catch(() => ({ data: null })),
          profileAPI.get(),
        ]);
        setData(lcRes.data);
        const url = profileRes.data?.profile?.leetcode_url || '';
        setProfileUrl(url);
        setLeetcodeUrl(url);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const verify = async () => {
    const urlToUse = leetcodeUrl.trim() || profileUrl.trim();
    if (!urlToUse) {
      toast.error('Enter your LeetCode profile URL first');
      return;
    }
    setVerifying(true);
    try {
      const res = await leetcodeAPI.verify(urlToUse !== profileUrl ? { leetcode_url: urlToUse } : {});
      setData(res.data);
      setProfileUrl(urlToUse);
      toast.success(`Verified! @${res.data.username} — ${res.data.total_solved} problems solved`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-green-700' : s >= 40 ? 'text-amber-700' : 'text-red-600';

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-1">LeetCode Verification</h1>
          <p className="text-ink-500 text-sm">
            Enter your LeetCode profile URL. We fetch your real stats directly from LeetCode.
          </p>
        </div>

        {/* URL input + verify */}
        <div className="card p-6 mb-6">
          <label className="label">LeetCode Profile URL</label>
          <div className="flex gap-3">
            <input
              value={leetcodeUrl}
              onChange={e => setLeetcodeUrl(e.target.value)}
              className="input flex-1"
              placeholder="https://leetcode.com/u/your-username"
              disabled={verifying}
            />
            <button
              onClick={verify}
              disabled={verifying}
              className="btn-primary shrink-0 min-w-36 justify-center"
            >
              {verifying
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                : <><RefreshCw size={14} /> {data ? 'Re-verify' : 'Verify Profile'}</>
              }
            </button>
          </div>
          <p className="text-xs text-ink-400 mt-2">
            Accepted formats: <code className="bg-ink-100 px-1 rounded">leetcode.com/username</code> or <code className="bg-ink-100 px-1 rounded">leetcode.com/u/username</code>
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !data && (
          <div className="card p-16 text-center">
            <Code2 size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">Not verified yet</h3>
            <p className="text-ink-500 text-sm">Enter your LeetCode URL above and click Verify Profile.</p>
          </div>
        )}

        {data && (
          <div className="space-y-5 animate-slide-up">
            {/* Verified banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle size={18} className="text-green-600 shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-green-800">
                  Verified: @{data.username || data.ocr_raw_text}
                </span>
                <span className="text-xs text-green-600 ml-2">
                  Last updated {new Date(data.extracted_at).toLocaleDateString()}
                </span>
              </div>
              {data.username && (
                <a
                  href={`https://leetcode.com/u/${data.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-700 hover:underline shrink-0"
                >
                  View Profile <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Coding evidence score */}
              <div className="card p-6 text-center">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-2">Evidence Score</div>
                <div className={clsx('font-display text-5xl font-bold mb-1', scoreColor(data.coding_evidence_score))}>
                  {data.coding_evidence_score}
                </div>
                <div className="text-xs text-ink-400 font-mono">/100</div>
                <div className="score-bar mt-4">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${data.coding_evidence_score}%`,
                      background: data.coding_evidence_score >= 70 ? '#2d9e5f' : data.coding_evidence_score >= 40 ? '#d4820a' : '#c0392b',
                    }}
                  />
                </div>
              </div>

              {/* Problems solved breakdown */}
              <div className="card p-6">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Target size={11} /> Problems Solved
                </div>
                <div className="text-center mb-4">
                  <span className="font-display text-4xl font-bold text-ink-900">{data.total_solved}</span>
                  <span className="text-ink-400 text-sm ml-1">total</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { label: 'Easy', value: data.easy_solved, color: 'bg-green-50 text-green-700 border-green-200' },
                    { label: 'Medium', value: data.medium_solved, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Hard', value: data.hard_solved, color: 'bg-red-50 text-red-700 border-red-200' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={clsx('rounded-lg p-2.5 text-center border', color)}>
                      <div className="font-mono text-xl font-bold">{value || 0}</div>
                      <div className="text-xs mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contest & ranking */}
              <div className="card p-6">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Trophy size={11} /> Contest Stats
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Contest Rating', value: data.contest_rating ? Math.round(data.contest_rating) : '—' },
                    { label: 'Global Ranking', value: data.ranking ? `#${data.ranking.toLocaleString()}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-ink-100 last:border-0">
                      <span className="text-xs text-ink-500">{label}</span>
                      <span className="font-mono font-medium text-ink-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Languages */}
            {data.languages_used?.length > 0 && (
              <div className="card p-5">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Zap size={11} /> Languages Used
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.languages_used.map((lang: string) => (
                    <span key={lang} className="px-3 py-1 rounded-full bg-ink-100 text-ink-700 border border-ink-200 text-sm font-medium">
                      {lang}
                    </span>
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

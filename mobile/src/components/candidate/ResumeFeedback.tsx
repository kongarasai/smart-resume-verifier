'use client';
import { useEffect, useState } from 'react';
import { profileAPI } from '@/lib/api';
import { Sparkles, CheckCircle, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function ResumeFeedback() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await profileAPI.getResumeFeedback();
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  if (loading) return (
    <div className="card p-8 flex flex-col items-center justify-center animate-pulse">
      <div className="w-10 h-10 bg-ink-100 rounded-full mb-4" />
      <div className="h-4 w-32 bg-ink-100 rounded mb-2" />
      <div className="h-3 w-48 bg-ink-50 rounded" />
    </div>
  );

  if (!data) return (
    <div className="card p-6 bg-gradient-to-br from-ink-900 to-slate-800 text-white overflow-hidden relative group">
      <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/5 group-hover:text-white/10 transition-colors" />
      <h3 className="font-display text-lg mb-2">AI Resume Optimization</h3>
      <p className="text-sm text-ink-300 mb-6">Get professional feedback on your profile and increase your matching score with HR requirements.</p>
      <button 
        onClick={fetchFeedback}
        className="bg-white text-ink-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-ink-100 transition-colors"
      >
        Analyze My Profile <ChevronRight size={14} />
      </button>
    </div>
  );

  return (
    <div className="card overflow-hidden">
      <div className="p-6 bg-ink-900 text-white flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" />
            Resume Score
          </h3>
          <p className="text-xs text-ink-400">Based on verified skills & experience</p>
        </div>
        <div className="text-3xl font-bold text-white">{data.score}%</div>
      </div>
      <div className="p-6 space-y-4">
        <h4 className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Actionable Suggestions</h4>
        <div className="space-y-3">
          {(data.feedback || []).map((s: string, i: number) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle size={12} />
              </div>
              <p className="text-sm text-ink-700 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
        <button 
          onClick={fetchFeedback}
          className="w-full text-center text-[10px] font-bold text-ink-400 hover:text-ink-900 transition-colors uppercase tracking-widest mt-4"
        >
          Re-analyze Profile
        </button>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { teacherAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Users, BookOpen, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsClient() {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) loadAnalytics();
    else setLoading(false);
  }, [groupId]);

  const loadAnalytics = async () => {
    try {
      const res = await teacherAPI.getGroupAnalytics(groupId!);
      setData(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  if (!groupId) return (
    <div className="card p-12 text-center">
      <Users size={48} className="mx-auto text-ink-300 mb-4" />
      <h2 className="text-xl font-bold text-ink-900">Select a group first</h2>
      <p className="text-ink-500 mt-2">Go to dashboard and click analytics on a specific group.</p>
      <Link href="/teacher/dashboard" className="btn-primary mt-6 inline-flex items-center gap-2">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-2">Assignment Analytics</h1>
          <p className="text-ink-500 text-sm">Tracking candidate performance and completion rates.</p>
        </div>
        <Link href="/teacher/dashboard" className="text-sm font-bold text-ink-500 hover:text-ink-900 flex items-center gap-1">
          <ChevronLeft size={14} /> Back
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={18} className="text-blue-600" />
            <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">Total Assignments</span>
          </div>
          <h2 className="text-3xl font-bold text-ink-900">{data.length}</h2>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={18} className="text-green-600" />
            <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">Avg. Completion</span>
          </div>
          <h2 className="text-3xl font-bold text-ink-900">
            {data.length ? Math.round(data.reduce((a, b) => a + (parseInt(b.completion_count) || 0), 0) / data.length) : 0} Candidates
          </h2>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} className="text-purple-600" />
            <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">Avg. Score</span>
          </div>
          <h2 className="text-3xl font-bold text-ink-900">
            {data.length ? Math.round(data.reduce((a, b) => a + (parseFloat(b.avg_score) || 0), 0) / data.length) : 0}%
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="card p-8">
          <h3 className="font-bold text-ink-900 mb-6 flex items-center gap-2">
            <Target size={20} className="text-ink-900" />
            Performance by Assignment
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avg_score" name="Average Score %" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="completion_count" name="Completions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

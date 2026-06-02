'use client';
import { useEffect, useState, Suspense } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { hrAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Target, ShieldCheck } from 'lucide-react';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await hrAPI.getAnalytics();
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout requiredRole="hr">
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>}>
        <AnalyticsContent data={data} loading={loading} />
      </Suspense>
    </DashboardLayout>
  );
}

function AnalyticsContent({ data, loading }: any) {
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-2">Talent Analytics</h1>
        <p className="text-ink-500 text-sm">Real-time insights into your candidate pool and recruitment pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ink-900 text-white flex items-center justify-center shadow-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-500 font-medium uppercase tracking-wider">Avg. Confidence</p>
            <h2 className="text-2xl font-bold text-ink-900">{data?.avg_confidence}%</h2>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-500 font-medium uppercase tracking-wider">Top Skill</p>
            <h2 className="text-2xl font-bold text-ink-900 capitalize">{data?.skills?.[0]?.skill || 'N/A'}</h2>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ink-100 text-ink-900 flex items-center justify-center shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-500 font-medium uppercase tracking-wider">Hiring Funnel</p>
            <h2 className="text-2xl font-bold text-ink-900">{data?.funnel?.reduce((a: any, b: any) => a + parseInt(b.count), 0) || 0} Evaluated</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-ink-900 flex items-center gap-2">
              <Target size={18} />
              Skill Distribution
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.skills}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="skill" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-ink-900 flex items-center gap-2">
              <Users size={18} />
              Recruitment Funnel
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.funnel}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {data?.funnel?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

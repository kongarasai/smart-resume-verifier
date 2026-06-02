'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { groupAPI, rankingAPI } from '@/lib/api';
import { Users, AlertCircle, TrendingDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function MentorDashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupAPI.getGroups().then(r => setGroups(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalMembers = groups.reduce((s, g) => s + (parseInt(g.member_count) || 0), 0);

  return (
    <DashboardLayout requiredRole="mentor">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl text-ink-900 mb-1">Mentor Dashboard</h1>
        <p className="text-ink-500 text-sm mb-8">Manage your groups, track candidate progress</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[['Active Groups', groups.length, '#1a6fa8'], ['Total Candidates', totalMembers, '#2d9e5f'], ['Workspaces', '—', '#7c3aed']].map(([l, v, c]) => (
            <div key={l} className="card p-5">
              <div className="text-2xl font-bold" style={{ color: c as string }}>{v}</div>
              <div className="text-xs text-ink-500 mt-1">{l}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : groups.length === 0 ? (
          <div className="card p-12 text-center">
            <Users size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">No groups yet</h3>
            <p className="text-ink-500 text-sm mb-4">Create a workspace and add groups to start managing candidates.</p>
            <Link href="/mentor/groups" className="btn-primary inline-flex">Create Group</Link>
          </div>
        ) : (
          <div>
            <h2 className="section-title mb-4">Your Groups</h2>
            <div className="space-y-3">
              {groups.map(g => (
                <Link key={g.id} href={`/mentor/groups?id=${g.id}`} className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-ink-300 transition-all block">
                  <div className="flex-1">
                    <div className="font-medium text-ink-900">{g.name}</div>
                    <div className="text-xs text-ink-500">{g.workspace_name} · {g.member_count} members</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="font-mono text-lg font-bold text-ink-900">{g.member_count}</div>
                      <div className="text-xs text-ink-400">members</div>
                    </div>
                    <ChevronRight size={16} className="text-ink-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

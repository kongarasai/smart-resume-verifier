'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { hrAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Star, Trash2, Ban, ChevronRight } from 'lucide-react';
import { evaluationAPI } from '@/lib/api';

export default function HRShortlistPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hrAPI.getShortlist();
      setRows(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {
      toast.error('Failed to load shortlist');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (candidateId: string) => {
    setBusyId(candidateId);
    try {
      await hrAPI.removeShortlist(candidateId);
      setRows((prev) => prev.filter((r) => r.candidate_id !== candidateId));
      toast.success('Removed from shortlist');
    } catch {
      toast.error('Failed to remove candidate');
    } finally {
      setBusyId(null);
    }
  };

  const block = async (candidateId: string) => {
    setBusyId(candidateId);
    try {
      await evaluationAPI.saveHR(candidateId, { status: 'Reject', notes: 'Blocked by HR from shortlist' });
      await hrAPI.removeShortlist(candidateId).catch(() => {});
      setRows((prev) => prev.filter((r) => r.candidate_id !== candidateId));
      toast.success('Candidate blocked');
    } catch {
      toast.error('Failed to block candidate');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout requiredRole="hr">
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-1 flex items-center gap-2"><Star size={24} /> Shortlisted Candidates</h1>
          <p className="text-ink-500 text-sm">Candidates you marked for follow-up.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="card p-14 text-center text-ink-400 text-sm">No shortlisted candidates yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <div key={c.candidate_id} className="card p-4 flex items-center gap-3">
                <Link href={`/hr/candidates/${c.candidate_id}`} className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ink-200 flex items-center justify-center text-ink-700 font-medium text-sm overflow-hidden">
                    {c.photo_url ? <img src={c.photo_url} className="w-full h-full object-cover" alt="" /> : c.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900">{c.full_name}</div>
                    <div className="text-xs text-ink-500 truncate">{c.headline || c.email}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{c.location || '—'} · Score: {c.overall_score ?? '—'}</div>
                  </div>
                  <ChevronRight size={14} className="text-ink-300" />
                </Link>
                <button
                  onClick={() => remove(c.candidate_id)}
                  disabled={busyId === c.candidate_id}
                  className="btn-secondary"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

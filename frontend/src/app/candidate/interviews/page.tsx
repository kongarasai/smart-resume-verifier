'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { interviewAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { RiskBadge } from '@/components/shared/ConfidenceMeter';
import toast from 'react-hot-toast';
import { Calendar, Clock, Video, Phone, Users, Monitor, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const MODE_ICONS: Record<string, any> = {
  video: Video, phone: Phone, in_person: Users, technical: Monitor,
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function InterviewsPage() {
  const { user } = useAuthStore();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await interviewAPI.getMy();
      setInterviews(res.data || []);
    } catch (err: any) {
      // Only show error for real server errors, not empty results
      if (err.response?.status >= 500) toast.error('Failed to load interviews');
      setInterviews([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await interviewAPI.update(id, { status });
      toast.success(`Interview marked as ${status}`);
      load();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const upcoming = interviews.filter(i => i.status === 'scheduled');
  const past = interviews.filter(i => i.status !== 'scheduled');

  return (
    <DashboardLayout requiredRole={user?.role === 'hr' ? 'hr' : 'candidate'}>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-1">Interviews</h1>
          <p className="text-ink-500 text-sm">
            {user?.role === 'hr' ? 'Manage scheduled interviews with candidates.' : 'Your upcoming and past interviews.'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="card p-16 text-center">
            <Calendar size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">No interviews yet</h3>
            <p className="text-ink-500 text-sm">
              {user?.role === 'hr' ? 'Schedule interviews from a candidate\'s profile page.' : 'You\'ll be notified when an interview is scheduled.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="section-title mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map(i => <InterviewCard key={i.id} interview={i} userRole={user?.role} onUpdate={updateStatus} updating={updating} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="section-title mb-4 text-ink-500">Past Interviews</h2>
                <div className="space-y-3">
                  {past.map(i => <InterviewCard key={i.id} interview={i} userRole={user?.role} onUpdate={updateStatus} updating={updating} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InterviewCard({ interview: i, userRole, onUpdate, updating }: any) {
  const ModeIcon = MODE_ICONS[i.mode] || Calendar;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
            <ModeIcon size={18} className="text-ink-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-ink-900">
                {userRole === 'hr' ? i.candidate_name : i.hr_name}
              </h3>
              <span className={clsx('badge', STATUS_STYLES[i.status])}>{i.status}</span>
              {i.risk_level && <RiskBadge risk={i.risk_level} />}
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-500">
              <span className="flex items-center gap-1"><Calendar size={12} /> {i.scheduled_date}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {i.scheduled_time}</span>
              <span className="capitalize">{i.mode.replace('_', ' ')}</span>
            </div>
            {i.notes && <p className="text-xs text-ink-500 mt-2">{i.notes}</p>}
            {i.meeting_link && (
              <a href={i.meeting_link} target="_blank" className="text-xs text-signal-blue hover:underline mt-1 block">
                Join meeting →
              </a>
            )}
          </div>
        </div>

        {userRole === 'hr' && i.status === 'scheduled' && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onUpdate(i.id, 'completed')}
              disabled={updating === i.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
            >
              <CheckCircle size={12} /> Complete
            </button>
            <button
              onClick={() => onUpdate(i.id, 'cancelled')}
              disabled={updating === i.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <XCircle size={12} /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

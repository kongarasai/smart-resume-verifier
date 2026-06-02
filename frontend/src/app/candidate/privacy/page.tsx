'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function PrivacyPage() {
  const [settings, setSettings] = useState({
    allow_hr_view: true, allow_mentor_view: true, public_profile: false,
    show_skills_public: true, show_github: true, show_leetcode: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileAPI.get().then(r => {
      if (r.data.privacy) setSettings(s => ({ ...s, ...r.data.privacy }));
    }).catch(() => {
      // Profile may not exist yet - that's fine, use defaults
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await profileAPI.updatePrivacy(settings);
      toast.success('Privacy settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const Toggle = ({ label, desc, field }: { label: string; desc: string; field: keyof typeof settings }) => (
    <div className="flex items-center justify-between py-4 border-b border-ink-100 last:border-0">
      <div>
        <div className="font-medium text-ink-900 text-sm">{label}</div>
        <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => setSettings(s => ({ ...s, [field]: !s[field] }))}
        className={`relative w-10 h-6 rounded-full transition-colors ${settings[field] ? 'bg-ink-900' : 'bg-ink-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings[field] ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Lock size={22} className="text-ink-400" />
          <div>
            <h1 className="font-display text-3xl text-ink-900">Privacy Settings</h1>
            <p className="text-ink-500 text-sm">Control who can see your profile and data</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-xs text-ink-500 uppercase tracking-wide mb-1">Profile Visibility</h2>
              <Toggle label="Allow HR to view profile" desc="HR recruiters can see your full profile, skills, and scores" field="allow_hr_view" />
              <Toggle label="Allow Mentor to view skills" desc="Your mentors can see your skill evidence and progress" field="allow_mentor_view" />
              <Toggle label="Public profile" desc="Anyone with your profile link can view basic info" field="public_profile" />
            </div>
            <div className="card p-5">
              <h2 className="text-xs text-ink-500 uppercase tracking-wide mb-1">Data Visibility</h2>
              <Toggle label="Show skills publicly" desc="Skills and verification levels visible to viewers" field="show_skills_public" />
              <Toggle label="Show GitHub data" desc="GitHub repos, commits, and language stats visible" field="show_github" />
              <Toggle label="Show LeetCode data" desc="Problem counts and contest rating visible" field="show_leetcode" />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
              {saving ? 'Saving...' : 'Save Privacy Settings'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

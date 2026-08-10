'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { groupAPI } from '@/lib/api';
import { Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnnouncementsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [form, setForm] = useState({ group_id: '', title: '', content: '', attachment_url: '' });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    groupAPI.getGroups().then((r: any) => setGroups(r.data || [])).catch(() => {});
  }, []);

  const loadAnnouncements = async (gid: string) => {
    if (!gid) return;
    const r = await groupAPI.getAnnouncements(gid);
    setAnnouncements(r.data || []);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await groupAPI.uploadAttachment(file);
      setForm(f => ({ ...f, attachment_url: res.data.url }));
      toast.success('File attached successfully');
    } catch {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const post = async () => {
    if (!form.group_id || !form.title || !form.content) return toast.error('All fields required');
    setPosting(true);
    try {
      await groupAPI.createAnnouncement(form);
      toast.success('Announcement posted! All group members notified.');
      setForm(f => ({ ...f, title: '', content: '', attachment_url: '' }));
      loadAnnouncements(form.group_id);
    } catch { toast.error('Failed to post'); }
    finally { setPosting(false); }
  };

  return (
    <DashboardLayout requiredRole="mentor">
      <div className="animate-fade-in max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Megaphone size={22} className="text-ink-400" />
          <div>
            <h1 className="font-display text-3xl text-ink-900">Announcements</h1>
            <p className="text-ink-500 text-sm">Post announcements to your groups</p>
          </div>
        </div>
        <div className="card p-6 space-y-4 mb-6">
          <div>
            <label className="label">Group</label>
            <select className="input" value={form.group_id} onChange={e => { setForm(s => ({...s, group_id: e.target.value})); loadAnnouncements(e.target.value); }}>
              <option value="">Select group</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(s => ({...s, title: e.target.value}))} placeholder="Announcement title" /></div>
          <div><label className="label">Content *</label><textarea className="input h-32 resize-none" value={form.content} onChange={e => setForm(s => ({...s, content: e.target.value}))} placeholder="Write your announcement..." /></div>
          
          <div>
            <label className="label">Attachment (PDF, Image)</label>
            <input type="file" onChange={handleFileChange} className="hidden" id="announcement-file" accept=".pdf,.png,.jpg,.jpeg" />
            <div className="flex items-center gap-3">
              <label htmlFor="announcement-file" className="btn-secondary py-1.5 px-4 text-xs cursor-pointer">
                {uploading ? 'Uploading...' : 'Choose File'}
              </label>
              {form.attachment_url && <span className="text-xs text-ink-500 truncate max-w-[200px]">Attached: {form.attachment_url.split('/').pop()}</span>}
            </div>
          </div>

          <button onClick={post} disabled={posting || uploading} className="btn-primary">{posting ? 'Posting...' : 'Post Announcement'}</button>
        </div>
        {announcements.length > 0 && (
          <div className="card p-5">
            <h2 className="section-title mb-4">Recent Announcements</h2>
            {announcements.map((a: any) => (
              <div key={a.id} className="py-3 border-b border-ink-100 last:border-0">
                <div className="font-medium text-ink-900 text-sm">{a.title}</div>
                <div className="text-xs text-ink-500 mt-1">{a.content}</div>
                {a.attachment_url && (
                  <div className="mt-2">
                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${a.attachment_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                      View Attachment
                    </a>
                  </div>
                )}
                <div className="text-xs text-ink-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

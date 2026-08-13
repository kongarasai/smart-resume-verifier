'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { practiceAPI } from '@/lib/api';
import { Plus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HRProblemsPage() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'technical_mcq', difficulty: 'medium',
    question_type: 'mcq', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
    correct_answer: '', points: '20', tags: '', time_limit_seconds: '300', group_id: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description required');
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const optionsJson = form.question_type === 'mcq' ? form.options : undefined;
      await practiceAPI.createQuestion({
        ...form,
        options: optionsJson,
        points: parseInt(form.points),
        time_limit_seconds: parseInt(form.time_limit_seconds),
        tags,
        group_id: null, // HR creates public/platform questions typically
      });
      toast.success('Question created!');
      setForm(f => ({ ...f, title: '', description: '', tags: '', correct_answer: '' }));
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout requiredRole="hr">
      <div className="animate-fade-in max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen size={22} className="text-ink-400" />
          <div>
            <h1 className="font-display text-3xl text-ink-900">Create Problem</h1>
            <p className="text-ink-500 text-sm">Add questions to platform bank for candidates to practice</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                {['coding', 'aptitude', 'technical_mcq', 'hr', 'general'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => setForm(s => ({ ...s, difficulty: e.target.value }))}>
                {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.question_type} onChange={e => setForm(s => ({ ...s, question_type: e.target.value }))}>
                {['mcq', 'code', 'text'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} placeholder="Question title" /></div>
          <div><label className="label">Description *</label><textarea className="input h-28 resize-none" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} placeholder="Full question text..." /></div>

          {form.question_type === 'mcq' && (
            <div>
              <label className="label">Options</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-500 w-5">{opt.id.toUpperCase()}.</span>
                    <input className="input flex-1" value={opt.text} onChange={e => {
                      const opts = [...form.options]; opts[i] = { ...opts[i], text: e.target.value };
                      setForm(s => ({ ...s, options: opts }));
                    }} placeholder={`Option ${opt.id.toUpperCase()}`} />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="label">Correct Answer</label>
                <select className="input w-32" value={form.correct_answer} onChange={e => setForm(s => ({ ...s, correct_answer: e.target.value }))}>
                  <option value="">Select</option>
                  {form.options.map(o => <option key={o.id} value={o.id}>{o.id.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">Points</label><input type="number" className="input" value={form.points} onChange={e => setForm(s => ({ ...s, points: e.target.value }))} /></div>
            <div><label className="label">Time Limit (sec)</label><input type="number" className="input" value={form.time_limit_seconds} onChange={e => setForm(s => ({ ...s, time_limit_seconds: e.target.value }))} /></div>
          </div>

          <div><label className="label">Tags (comma separated)</label><input className="input" value={form.tags} onChange={e => setForm(s => ({ ...s, tags: e.target.value }))} placeholder="java, spring, database" /></div>

          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Creating...' : <><Plus size={14} /> Create Question</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

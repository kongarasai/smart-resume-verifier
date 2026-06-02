'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { teacherAPI, groupAPI, practiceAPI } from '@/lib/api';
import { Plus, BookOpen, CheckCircle, Info, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function TeacherProblemsPage() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'technical_mcq', difficulty: 'medium',
    question_type: 'mcq', correct_answer: '', points: '20', tags: '',
    time_limit_seconds: '300', group_id: '',
    options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
    attachment_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupQuestions, setGroupQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [recentlyCreated, setRecentlyCreated] = useState<any[]>([]);
  const [bulkForm, setBulkForm] = useState({ name: '', expires_at: '' });

  // AI Generator states
  const [genForm, setGenForm] = useState({ topic: '', count: 10, heading: '', difficulty: 'medium', expires_at: '' });
  const [generating, setGenerating] = useState(false);
  const [genQuestions, setGenQuestions] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'ai'>('single');
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // ---------------- CLICK SELECT (Ctrl/Shift) ----------------
  const handleClick = (e: React.MouseEvent, id: string) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    let next = new Set(selectedIds);

    if (isShift && lastSelected) {
      const ids = groupQuestions.map(q => q.id);
      const start = ids.indexOf(lastSelected);
      const end = ids.indexOf(id);

      const [min, max] = [Math.min(start, end), Math.max(start, end)];
      for (let i = min; i <= max; i++) next.add(ids[i]);
    } 
    else if (isCtrl) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    } 
    else {
      next = new Set([id]);
    }

    setSelectedIds(next);
    setLastSelected(id);
  };

  // ---------------- DRAG SELECT ----------------
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start box selection if clicking on the background container
    if (e.target !== containerRef.current) {
      setIsMouseDown(true);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setSelectionBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionBox((prev: any) => ({
      ...prev,
      endX: x,
      endY: y,
    }));
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionBox) {
      const box = normalizeSelection(selectionBox);
      const selected = new Set<string>();

      groupQuestions.forEach(q => {
        const el = document.getElementById(`q-${q.id}`);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        
        // Convert el rect to container-relative
        const relRect = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          right: rect.right - containerRect.left,
          bottom: rect.bottom - containerRect.top
        };

        if (intersect(box, relRect)) {
          selected.add(q.id);
        }
      });

      setSelectedIds(selected);
    }

    setIsSelecting(false);
    setSelectionBox(null);
    setIsMouseDown(false);
  };

  // ---------------- HELPERS ----------------
  const normalizeSelection = (b: any) => ({
    left: Math.min(b.startX, b.endX),
    top: Math.min(b.startY, b.endY),
    right: Math.max(b.startX, b.endX),
    bottom: Math.max(b.startY, b.endY),
  });

  const intersect = (box: any, rect: any) => {
    return !(
      rect.right < box.left ||
      rect.left > box.right ||
      rect.bottom < box.top ||
      rect.top > box.bottom
    );
  };



  const toggleSelectAll = () => {
    if (selectedIds.size === groupQuestions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(groupQuestions.map(q => q.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected questions?`)) return;
    setSaving(true);
    try {
      await practiceAPI.bulkDeleteQuestions(Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} questions`);
      setSelectedIds(new Set());
      if (form.group_id) {
        teacherAPI.getGroupQuestions(form.group_id).then(r => setGroupQuestions(r.data || []));
      }
    } catch {
      toast.error('Bulk deletion failed');
    } finally {
      setSaving(false);
    }
  };


  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('questionId', id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(true);
  };

  const onDragLeave = () => {
    setIsOverTrash(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(false);
    const id = e.dataTransfer.getData('questionId');
    if (id) {
      handleDelete(id);
    }
  };




  useEffect(() => {
    teacherAPI.getGroups().then(r => {
      const data = r.data || [];
      setGroups(data);
      if (data.length > 0 && !form.group_id) {
        setForm(f => ({ ...f, group_id: data[0].id }));
      }
    }).catch(() => {});
  }, []);

  // Load existing questions when group changes
  useEffect(() => {
    if (form.group_id) {
      setLoadingQuestions(true);
      teacherAPI.getGroupQuestions(form.group_id)
        .then(r => setGroupQuestions(r.data || []))
        .catch(() => setGroupQuestions([]))
        .finally(() => setLoadingQuestions(false));
    }
  }, [form.group_id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await groupAPI.uploadAttachment(file);
      setForm(f => ({ ...f, attachment_url: res.data.url }));
      toast.success('Reference file attached');
    } catch {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePdfParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingPdf(true);
    try {
      const res = await practiceAPI.parsePdfMcqs(file);
      setBulkQuestions(res.data.questions || []);
      toast.success(`Extracted ${res.data.questions?.length || 0} questions from PDF`);
    } catch {
      toast.error('Failed to parse PDF');
    } finally {
      setParsingPdf(false);
    }
  };

  const handleGenerate = async () => {
    if (!genForm.topic || !genForm.count) return toast.error('Topic and count required');
    setGenerating(true);
    try {
      const res = await practiceAPI.generateQuestions({ topic: genForm.topic, count: genForm.count, difficulty: genForm.difficulty });
      setGenQuestions(res.data.questions);
      toast.success(`Generated ${res.data.questions.length} questions for review`);
    } catch {
      toast.error('AI Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveBulk = async (type: 'pdf' | 'ai') => {
    if (!form.group_id) return toast.error('Select a group first');
    const questionsToSave = type === 'pdf' ? bulkQuestions : genQuestions;
    const finalHeading = type === 'pdf' ? bulkForm.name : genForm.heading;
    const expiry = type === 'pdf' ? bulkForm.expires_at : genForm.expires_at;

    if (!questionsToSave || questionsToSave.length === 0) return toast.error('No questions to save');
    setSaving(true);
    try {
      await practiceAPI.bulkCreateQuestions({ 
        group_id: form.group_id, 
        questions: questionsToSave,
        assignment_name: finalHeading,
        expires_at: expiry || null
      });
      toast.success('Questions saved successfully!');
      if (type === 'pdf') {
        setBulkQuestions([]);
        setBulkForm({ name: '', expires_at: '' });
      } else {
        setGenQuestions([]);
        setGenForm({ topic: '', count: 10, heading: '', difficulty: 'medium', expires_at: '' });
      }
      teacherAPI.getGroupQuestions(form.group_id).then(r => setGroupQuestions(r.data || []));
    } catch {
      toast.error('Saving failed');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description required');
    if (!form.group_id) return toast.error('Select a group to assign this question');
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const opts = form.question_type === 'mcq' ? form.options.filter(o => o.text.trim()) : undefined;
      const res = await teacherAPI.createQuestion({
        ...form, options: opts, points: parseInt(form.points),
        time_limit_seconds: parseInt(form.time_limit_seconds), tags,
        group_id: form.group_id || null,
      });
      toast.success('Question created and assigned to group!');
      setRecentlyCreated(prev => [res.data, ...prev].slice(0, 5));
      setForm(f => ({ ...f, title: '', description: '', tags: '', correct_answer: '', attachment_url: '' }));
      if (form.group_id) {
        teacherAPI.getGroupQuestions(form.group_id).then(r => setGroupQuestions(r.data || []));
      }
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await practiceAPI.deleteQuestion(id);
      toast.success('Question deleted');
      if (form.group_id) {
        teacherAPI.getGroupQuestions(form.group_id).then(r => setGroupQuestions(r.data || []));
      }
      setRecentlyCreated(prev => prev.filter(q => q.id !== id));
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const selectedGroupName = groups.find(g => g.id === form.group_id)?.name || '';

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="animate-fade-in max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={22} className="text-ink-400" />
          <div>
            <h1 className="font-display text-3xl text-ink-900">Manage Problems</h1>
            <p className="text-ink-500 text-sm">Assign practice problems to your group candidates</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-ink-100 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('single')}
            className={clsx('pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors', activeTab === 'single' ? 'text-ink-900 border-b-2 border-ink-900' : 'text-ink-400 hover:text-ink-600')}
          >
            Single Question
          </button>
          <button 
            onClick={() => setActiveTab('bulk')}
            className={clsx('pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors', activeTab === 'bulk' ? 'text-ink-900 border-b-2 border-ink-900' : 'text-ink-400 hover:text-ink-600')}
          >
            Bulk Upload / PDF
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={clsx('pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5', activeTab === 'ai' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-ink-400 hover:text-purple-400')}
          >
            <Plus size={14} /> AI Assignment Generator
          </button>
        </div>


        {groups.length === 0 ? (
          <div className="card p-10 text-center">
            <Info size={32} className="mx-auto text-ink-300 mb-3" />
            <h3 className="font-display text-xl text-ink-800 mb-2">No groups assigned</h3>
            <p className="text-ink-500 text-sm mb-4">You need to be assigned to a group by a mentor first.</p>
          </div>
        ) : (
          <>
            {activeTab === 'single' ? (
              <div className="card p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Assign to Group *</label>
                    <select className="input" value={form.group_id} onChange={e => setForm(s => ({ ...s, group_id: e.target.value }))}>
                      <option value="">Select a group</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.workspace_name})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <select className="input" value={form.difficulty} onChange={e => setForm(s => ({ ...s, difficulty: e.target.value }))}>
                      {['easy','medium','hard'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                      {['technical_mcq','coding','aptitude','hr','general'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select className="input" value={form.question_type} onChange={e => setForm(s => ({ ...s, question_type: e.target.value }))}>
                      {['mcq','code','text'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} placeholder="Question title" /></div>
                <div><label className="label">Description *</label><textarea className="input h-28 resize-none" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} placeholder="Full question text..." /></div>

                {form.question_type === 'mcq' && (
                  <div>
                    <label className="label">Options</label>
                    <div className="space-y-2 mb-3">
                      {form.options.map((opt, i) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ink-500 w-5">{opt.id.toUpperCase()}.</span>
                          <input className="input flex-1" value={opt.text} placeholder={`Option ${opt.id.toUpperCase()}`}
                            onChange={e => { const opts=[...form.options]; opts[i]={...opts[i],text:e.target.value}; setForm(s=>({...s,options:opts})); }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="label">Correct Answer</label>
                      <select className="input w-32" value={form.correct_answer} onChange={e => setForm(s => ({ ...s, correct_answer: e.target.value }))}>
                        <option value="">Select</option>
                        {form.options.map(o => <option key={o.id} value={o.id}>{o.id.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div><label className="label">Points</label><input type="number" className="input" value={form.points} onChange={e => setForm(s => ({ ...s, points: e.target.value }))} /></div>
                  <div><label className="label">Time Limit (sec)</label><input type="number" className="input" value={form.time_limit_seconds} onChange={e => setForm(s => ({ ...s, time_limit_seconds: e.target.value }))} /></div>
                  <div><label className="label">Tags</label><input className="input" value={form.tags} onChange={e => setForm(s => ({ ...s, tags: e.target.value }))} placeholder="java, spring" /></div>
                </div>

                <button onClick={save} disabled={saving || uploading} className="btn-primary w-full justify-center">
                  {saving ? 'Creating...' : <><Plus size={14} /> Create Question for "{selectedGroupName}"</>}
                </button>
              </div>
            ) : (
              /* Bulk Upload UI */
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="font-display text-lg text-ink-900 mb-4">Bulk Import from PDF</h3>
                  
                  {/* Pre-upload Group Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-ink-50 rounded-xl border border-ink-100">
                      <label className="label text-ink-700 font-medium mb-2 block">1. Target Group *</label>
                      <select className="input bg-white h-10 py-0" value={form.group_id} onChange={e => setForm(s => ({ ...s, group_id: e.target.value }))}>
                        <option value="">— Select Group —</option>
                        {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="p-4 bg-ink-50 rounded-xl border border-ink-100">
                      <label className="label text-ink-700 font-medium mb-2 block">2. Assignment Heading (Optional)</label>
                      <input 
                        className="input bg-white h-10" 
                        placeholder="e.g. Weekly Quiz 1, Python Basics" 
                        value={bulkForm.name}
                        onChange={e => setBulkForm(b => ({ ...b, name: e.target.value }))}
                      />
                    </div>
                    <div className="p-4 bg-ink-50 rounded-xl border border-ink-100">
                      <label className="label text-ink-700 font-medium mb-2 block">3. Expiry Date & Time</label>
                      <input 
                        type="datetime-local"
                        className="input bg-white h-10 py-1" 
                        value={bulkForm.expires_at}
                        onChange={e => setBulkForm(b => ({ ...b, expires_at: e.target.value }))}
                      />
                    </div>
                  </div>

                  <label className="label text-ink-700 font-medium mb-2 block">4. Upload MCQ PDF</label>

                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-ink-200 rounded-xl p-8 bg-ink-25/50">
                    <input type="file" id="bulk-pdf" className="hidden" accept=".pdf" onChange={handlePdfParse} />
                    <label htmlFor="bulk-pdf" className="btn-secondary py-3 px-6 cursor-pointer flex flex-col items-center gap-2">
                      {parsingPdf ? (
                        <>
                          <div className="w-5 h-5 border-2 border-ink-400 border-t-transparent rounded-full animate-spin" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen size={24} className="text-ink-400" />
                          <span>Upload PDF</span>
                        </>
                      )}
                    </label>
                  </div>

                  {(bulkQuestions?.length || 0) > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div>
                          <h4 className="font-medium text-green-900">Extracted ({bulkQuestions.length}) Questions</h4>
                          <p className="text-[10px] text-green-700">Group: <span className="font-bold">{selectedGroupName}</span> | Heading: <span className="font-bold">{bulkForm.name || 'None'}</span> | Expires: <span className="font-bold">{bulkForm.expires_at || 'Never'}</span></p>
                        </div>
                        <button onClick={() => saveBulk('pdf')} disabled={saving || !form.group_id} className="btn-primary py-2 px-6">
                          {saving ? 'Saving...' : 'Confirm & Save All'}
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto border border-ink-100 rounded-lg">
                        {bulkQuestions.map((q, i) => (
                          <div key={i} className="p-3 border-b border-ink-100 last:border-0 bg-white text-xs">
                            <div className="font-medium text-ink-800 mb-1">{i+1}. {q.title}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-ink-500">
                              {q.options.map((o: any) => <div key={o.id} className={clsx(q.correct_answer === o.id && 'text-green-600 font-bold')}>{o.id}) {o.text}</div>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              /* AI Generator UI */
              <div className="space-y-6">
                <div className="card p-6 border-purple-100 bg-purple-25/30">
                  <h3 className="font-display text-lg text-purple-900 mb-1">AI Assignment Generator</h3>
                  <p className="text-xs text-purple-600 mb-6">Describe your topic and we will generate professional MCQs for you.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label">Target Group *</label>
                      <select className="input" value={form.group_id} onChange={e => setForm(s => ({ ...s, group_id: e.target.value }))}>
                        <option value="">— Select Group —</option>
                        {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Assignment Heading</label>
                      <input className="input" placeholder="e.g. Python Quiz 1" value={genForm.heading} onChange={e => setGenForm(s => ({ ...s, heading: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Expiry Date & Time</label>
                      <input type="datetime-local" className="input" value={genForm.expires_at} onChange={e => setGenForm(s => ({ ...s, expires_at: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="label">Topic / Skill</label>
                      <input className="input" placeholder="e.g. Python, SQL, React" value={genForm.topic} onChange={e => setGenForm(s => ({ ...s, topic: e.target.value }))} />
                    </div>
                    <div className="col-span-3">
                      <label className="label">Difficulty</label>
                      <select className="input" value={genForm.difficulty} onChange={e => setGenForm(s => ({ ...s, difficulty: e.target.value }))}>
                        {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Count</label>
                      <input type="number" className="input" value={genForm.count} onChange={e => setGenForm(s => ({ ...s, count: parseInt(e.target.value) }))} />
                    </div>
                    <div className="col-span-2">
                      <button onClick={handleGenerate} disabled={generating || !genForm.topic} className="btn-primary w-full h-10 justify-center bg-purple-600 hover:bg-purple-700">
                        {generating ? '...' : 'Generate'}
                      </button>
                    </div>
                  </div>

                  {(genQuestions?.length || 0) > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div>
                          <h4 className="font-medium text-purple-900">Generated ({genQuestions.length}) Questions</h4>
                          <p className="text-[10px] text-purple-700">Expires: <span className="font-bold">{genForm.expires_at || 'Never'}</span> | Review below before adding to <span className="font-bold">{selectedGroupName}</span></p>
                        </div>
                        <button onClick={() => saveBulk('ai')} disabled={saving || !form.group_id} className="btn-primary py-2 px-6 bg-purple-600">
                          {saving ? 'Saving...' : 'Add to Assignment'}
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto border border-ink-100 rounded-lg bg-white">
                        {genQuestions.map((q, i) => (
                          <div key={i} className="p-3 border-b border-ink-100 last:border-0 text-xs">
                            <div className="font-medium text-ink-800 mb-1">{i+1}. {q.title}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-ink-500">
                              {q.options.map((o: any) => <div key={o.id} className={clsx(q.correct_answer === o.id && 'text-green-600 font-bold')}>{o.id}) {o.text}</div>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Recently created */}
            {recentlyCreated && recentlyCreated.length > 0 && (
              <div className="mt-5 card p-5">
                <h3 className="section-title mb-3">Recently Created</h3>
                <div className="space-y-2">
                  {recentlyCreated.map((q: any) => (
                    <div key={q.id} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle size={14} className="text-green-600 shrink-0" />
                      <span className="font-medium text-ink-900">{q.title}</span>
                      <span className={clsx('badge text-xs', q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-red')}>{q.difficulty}</span>
                      <button onClick={() => handleDelete(q.id)} className="ml-auto text-ink-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing questions */}
            {form.group_id && (
              <div className="mt-5 card p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title">Existing Questions in "{selectedGroupName}" ({groupQuestions.length})</h3>
                  {selectedIds.size > 0 && (
                    <button onClick={handleBulkDelete} className="btn-secondary py-1 px-3 text-xs bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1">
                      <Trash2 size={12} /> Delete Selected ({selectedIds.size})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2 px-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-ink-200 text-ink-900 focus:ring-ink-500 h-3.5 w-3.5" 
                    checked={groupQuestions.length > 0 && selectedIds.size === groupQuestions.length}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink-400">Select All</span>
                </div>

                {loadingQuestions ? (
                  <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" /></div>
                ) : groupQuestions.length === 0 ? (
                  <p className="text-sm text-ink-400 text-center py-4">No questions yet. Create one above!</p>
                ) : (
                  <div 
                    ref={containerRef}
                    className="space-y-6 max-h-[500px] overflow-y-auto select-none pr-2 relative"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Active Questions */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                        <h4 className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Active Assignments ({groupQuestions.filter(q => !q.is_expired).length})</h4>
                      </div>
                      <div className="space-y-1">
                        {groupQuestions.filter(q => !q.is_expired).map((q: any) => (
                          <TeacherQuestionRow 
                            key={q.id} 
                            q={q} 
                            selectedIds={selectedIds} 
                            onDragStart={onDragStart} 
                            handleClick={handleClick} 
                            handleDelete={handleDelete} 
                          />
                        ))}
                        {groupQuestions.filter(q => !q.is_expired).length === 0 && <p className="text-[10px] text-ink-300 italic ml-4">No active assignments</p>}
                      </div>
                    </div>

                    {/* Previous Questions */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-ink-300"></div>
                        <h4 className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Previous Assignments / Expired ({groupQuestions.filter(q => q.is_expired).length})</h4>
                      </div>
                      <div className="space-y-1 opacity-70">
                        {groupQuestions.filter(q => q.is_expired).map((q: any) => (
                          <TeacherQuestionRow 
                            key={q.id} 
                            q={q} 
                            selectedIds={selectedIds} 
                            onDragStart={onDragStart} 
                            handleClick={handleClick} 
                            handleDelete={handleDelete} 
                            isExpired
                          />
                        ))}
                        {groupQuestions.filter(q => q.is_expired).length === 0 && <p className="text-[10px] text-ink-300 italic ml-4">No expired assignments</p>}
                      </div>
                    </div>

                    {/* SELECTION BOX OVERLAY */}
                    {isSelecting && selectionBox && (
                      <div
                        className="absolute bg-blue-400/20 border border-blue-600 pointer-events-none z-10"
                        style={{
                          left: Math.min(selectionBox.startX, selectionBox.endX),
                          top: Math.min(selectionBox.startY, selectionBox.endY),
                          width: Math.abs(selectionBox.endX - selectionBox.startX),
                          height: Math.abs(selectionBox.endY - selectionBox.startY),
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Drag to Delete Trash Zone */}
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={clsx(
            "fixed bottom-8 right-8 w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 border-dashed z-50",
            isOverTrash 
              ? "bg-red-50 border-red-500 scale-110 text-red-600 shadow-xl shadow-red-100" 
              : "bg-white/80 backdrop-blur-sm border-ink-200 text-ink-300 opacity-40 hover:opacity-100"
          )}
        >
          <Trash2 size={isOverTrash ? 40 : 32} className={clsx("transition-transform", isOverTrash && "animate-bounce")} />
          <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">Trash</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

function TeacherQuestionRow({ q, selectedIds, onDragStart, handleClick, handleDelete, isExpired }: any) {
  return (
    <div 
      key={q.id} 
      id={`q-${q.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, q.id)}
      onClick={(e) => handleClick(e, q.id)}
      className={clsx(
        "flex items-center gap-3 py-2 px-2 text-sm border-b border-ink-100 last:border-0 hover:bg-ink-25 transition-colors group cursor-pointer",
        selectedIds.has(q.id) && "bg-blue-50/50 border-blue-200"
      )}
    >
      <input 
        type="checkbox" 
        className="rounded border-ink-200 text-ink-900 focus:ring-ink-500 h-3.5 w-3.5 cursor-pointer"
        checked={selectedIds.has(q.id)}
        readOnly
      />
      <span className={clsx("text-ink-900 flex-1 truncate", isExpired && "text-ink-400")}>{q.title}</span>
      <span className={clsx('badge text-xs', q.difficulty === 'easy' ? 'bg-green-50 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>{q.difficulty}</span>
      <button 
        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} 
        className="opacity-0 group-hover:opacity-100 p-1 text-ink-400 hover:text-red-500 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { profileAPI, resumeAPI, scoringAPI, verificationAPI, availabilityAPI } from '@/lib/api';
import { ConfidenceMeter } from '@/components/shared/ConfidenceMeter';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Upload, Plus, Trash2, FileText, RefreshCw, CheckCircle, Shield, X, Eye, ExternalLink, Clock, Ban, Star, Briefcase, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { ProgressTimeline } from '@/components/candidate/ProgressTimeline';
import ResumeFeedback from '@/components/candidate/ResumeFeedback';
import TrustScoreBadge from '@/components/candidate/TrustScoreBadge';
import { getImageUrl } from '@/utils/platform';

type Tab = 'overview' | 'skills' | 'projects' | 'education' | 'experience' | 'certificates';

const VERIFICATION_LEVELS: Record<string, { label: string; color: string; bg: string }> = {
  claimed:        { label: 'Claimed',         color: '#78716c', bg: '#f5f4f0' },
  evidence:       { label: 'Evidence',        color: '#1e40af', bg: '#eff6ff' },
  verified:       { label: 'Verified',        color: '#166534', bg: '#f0faf5' },
  strong_verified:{ label: 'Strong Verified', color: '#92400e', bg: '#fdf8f0' },
};

function SkillEvidenceModal({ skill, userId, onClose }: { skill: string; userId: string; onClose: () => void }) {
  const [evidence, setEvidence] = useState<any>(null);
  useEffect(() => {
    verificationAPI.getSkillEvidence(skill).then((r: any) => setEvidence(r)).catch(() => {});
  }, [skill]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50" onClick={onClose}>
      <div className="card p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-ink-900 capitalize">{skill} — Evidence</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X size={16} /></button>
        </div>
        {!evidence ? <div className="text-center py-8"><div className="w-5 h-5 border-2 border-ink-300 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <div className="space-y-4">
            {evidence.verification && (
              <div className="flex flex-wrap gap-2 text-xs">
                {[['Resume', evidence.verification.has_resume],['GitHub', evidence.verification.has_github],['LeetCode', evidence.verification.has_leetcode],['Practice', evidence.verification.has_practice],['Projects', evidence.verification.has_project]].map(([src, has]) => (
                  <span key={src} className={clsx('badge', has ? 'badge-green' : 'bg-ink-100 text-ink-400 border-ink-200')}>
                    {has ? '✓' : '✗'} {src}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-3 text-sm">
              {evidence.evidence?.github?.repo_count > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900 text-xs mb-1">GitHub</div>
                  <div className="text-blue-700 text-xs">{evidence.evidence.github.repo_count} repos use this language</div>
                </div>
              )}
              {evidence.evidence?.practice?.correct_answers > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900 text-xs mb-1">Practice</div>
                  <div className="text-green-700 text-xs">{evidence.evidence.practice.correct_answers} correct answers on related problems</div>
                </div>
              )}
              {evidence.evidence?.projects?.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="font-medium text-amber-900 text-xs mb-1">Projects</div>
                  {evidence.evidence.projects.map((p: any) => (
                    <div key={p.title} className="text-amber-700 text-xs">{p.title}</div>
                  ))}
                </div>
              )}
              {(!evidence.evidence?.github?.repo_count && !evidence.evidence?.practice?.correct_answers && !evidence.evidence?.projects?.length) && (
                <p className="text-ink-400 text-xs text-center py-3">No cross-source evidence yet. Verify GitHub and solve practice problems.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [showHV, setShowHV] = useState(false);
  const [data, setData] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [parsing, setParsing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const { register, handleSubmit, reset } = useForm();

  const loadData = async () => {
    try {
      const [profileRes, scoreRes, verifRes, timelineRes] = await Promise.all([
        profileAPI.get().catch(() => null),
        scoringAPI.get().catch(() => null),
        verificationAPI.getSummary().catch(() => null),
        profileAPI.getTimeline().catch(() => []),
      ]);
      if (profileRes) {
        setData(profileRes);
        setIsAvailable(profileRes?.profile?.is_available !== false);
        reset(profileRes?.profile);
      }
      setScore(scoreRes);
      setVerification(verifRes);
      setTimeline(Array.isArray(timelineRes) ? timelineRes : []);
    } catch (err) {
      console.warn('Profile background fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onSaveProfile = async (values: any) => {
    try { 
      await profileAPI.update(values); 
      toast.success('Profile updated'); 
      loadData(); 
    } catch (err: any) { 
      const msg = err.response?.data?.error || (err.message === 'Network Error' ? 'Backend is waking up, please retry in a moment' : err.message || 'Update failed');
      toast.error(msg); 
    }
  };

  const onResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Uploading resume...', { id: 'upload-resume' });
      await profileAPI.uploadResume(file);
      toast.dismiss('upload-resume');
      toast.success('Resume uploaded');
      loadData();
    } catch (err: any) { 
      toast.dismiss('upload-resume');
      const msg = err.response?.data?.error || (err.message === 'Network Error' ? 'Backend is waking up, please retry in a moment' : err.message || 'Upload failed');
      toast.error(msg); 
    }
  };

  const onPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Uploading photo...', { id: 'upload-photo' });
      await profileAPI.uploadPhoto(file);
      toast.dismiss('upload-photo');
      toast.success('Photo updated');
      loadData();
    } catch (err: any) { 
      toast.dismiss('upload-photo');
      const msg = err.response?.data?.error || (err.message === 'Network Error' ? 'Backend is waking up, please retry in a moment' : err.message || 'Photo upload failed');
      toast.error(msg); 
    }
  };

  const parseResume = async () => {
    setParsing(true);
    setParseResult(null);
    try {
      const res = await resumeAPI.parse();
      const d = res;
      setParseResult(d);
      const autoFilled = Object.keys(d.auto_filled || {});
      let msg = `Parsed! Found ${d.skills?.length || 0} skills`;
      if (autoFilled.length > 0) msg += ` · Auto-filled: ${autoFilled.map((k:string) => k.replace('_url','').replace('_',' ')).join(', ')}`;
      toast.success(msg);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Parse failed'); }
    finally { setParsing(false); }
  };

  const runVerification = async () => {
    setVerifying(true);
    try {
      await verificationAPI.run();
      toast.success('Skill verification complete!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Verification failed');
    } finally { setVerifying(false); }
  };

  const calcScore = async () => {
    setCalculating(true);
    try {
      const res = await scoringAPI.calculate();
      setScore(res);
      toast.success('Score recalculated based on verified skills!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Calculation failed');
    } finally { setCalculating(false); }
  };

  const toggleAvailability = async () => {
    const next = !isAvailable;
    try {
      await availabilityAPI.update(next);
      setIsAvailable(next);
      toast.success(`Status: ${next ? 'Available for opportunities' : 'Not available'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update');
    }
  };

  const addSkill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('name') as string)?.trim();
    if (!name) return;
    try {
      await profileAPI.addSkill({ name, source: 'manual', proficiency_level: fd.get('level') });
      toast.success('Skill added');
      form.reset();
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const addProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const tech = (fd.get('technologies') as string).split(',').map(s => s.trim()).filter(Boolean);
    try {
      await profileAPI.addProject({ title: fd.get('title'), description: fd.get('description'), project_url: fd.get('project_url'), github_url: fd.get('github_url'), technologies: tech });
      toast.success('Project added');
      form.reset();
      loadData();
    } catch { toast.error('Failed'); }
  };

  const deleteSkill = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await profileAPI.deleteSkill(id); loadData(); toast.success('Skill deleted'); } catch { toast.error('Failed to delete skill'); }
  };

  if (loading) return <DashboardLayout requiredRole="candidate"><div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  const profile = data?.profile;
  const mergedSkills = data?.skills || [];
  const tabs: Tab[] = ['overview', 'skills', 'projects', 'education', 'experience', 'certificates'];

  const vCounts = verification?.counts || {};
  const completionTips = [
    { done: !!profile?.github_url, label: 'GitHub URL', gain: '+15 pts when verified' },
    { done: !!profile?.leetcode_url, label: 'LeetCode URL', gain: '+15 pts when verified' },
    { done: !!profile?.resume_url, label: 'Resume uploaded', gain: 'Enables parsing' },
    { done: mergedSkills.length > 0, label: 'Skills added', gain: `${mergedSkills.length} skills` },
    { done: data?.projects?.length > 0, label: 'Projects added', gain: `${data?.projects?.length || 0} projects` },
    { done: data?.education?.length > 0, label: 'Education added', gain: 'Profile completeness' },
    { done: (vCounts.verified || 0) + (vCounts.strong_verified || 0) > 0, label: 'Skills verified', gain: `${(vCounts.verified || 0) + (vCounts.strong_verified || 0)} verified` },
  ];

  return (
    <DashboardLayout requiredRole="candidate">
      {selectedSkill && (
        <SkillEvidenceModal 
          skill={selectedSkill} 
          userId={profile?.user_id} 
          onClose={() => setSelectedSkill(null)} 
        />
      )}
      <div className="animate-fade-in">
        <div className="flex items-center justify-end mb-4">
          <TrustScoreBadge />
        </div>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <label className="relative cursor-pointer group">
              <div className="w-14 h-14 rounded-full bg-ink-200 overflow-hidden flex items-center justify-center text-ink-600 text-xl font-semibold relative">
                {profile?.photo_url ? (
                  <img 
                    src={getImageUrl(profile.photo_url)} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : null}
                <span className="absolute">{profile?.full_name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-black/30 hidden group-hover:flex items-center justify-center">
                <Upload size={16} className="text-white" />
              </div>
              <input type="file" accept="image/*,.avif,.webp,.png,.jpg,.jpeg" onChange={onPhotoUpload} className="sr-only" />
            </label>
            <div>
              <h1 className="font-display text-2xl text-ink-900">{profile?.full_name}</h1>
              <p className="text-ink-500 text-sm">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={toggleAvailability}
                  className={clsx('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-ink-100 text-ink-500 border-ink-200')}>
                  <div className={clsx('w-1.5 h-1.5 rounded-full', isAvailable ? 'bg-green-500' : 'bg-ink-400')} />
                  {isAvailable ? 'Available for opportunities' : 'Not available'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
             <button 
               onClick={() => setShowHV(!showHV)}
               className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm', {
                 'bg-purple-600 text-white hover:bg-purple-700': Array.isArray(data?.hiring_status) && data.hiring_status.some((s: any) => s.status === 'shortlisted'),
                 'bg-orange-600 text-white hover:bg-orange-700': Array.isArray(data?.hiring_status) && !data.hiring_status.some((s: any) => s.status === 'shortlisted') && data.hiring_status.some((s: any) => s.status === 'hold'),
                 'bg-red-600 text-white hover:bg-red-700': Array.isArray(data?.hiring_status) && !data.hiring_status.some((s: any) => s.status === 'shortlisted') && !data.hiring_status.some((s: any) => s.status === 'hold') && data.hiring_status.some((s: any) => s.status === 'rejected'),
                 'bg-blue-600 text-white hover:bg-blue-700': Array.isArray(data?.hiring_status) && data.hiring_status.length > 0 && !['shortlisted','hold','rejected'].some(st => data.hiring_status.some((s: any) => s.status === st)),
                 'bg-ink-100 text-ink-500 border border-ink-200 hover:bg-ink-200': !Array.isArray(data?.hiring_status) || data.hiring_status.length === 0
               })}
             >
               <Star size={14} fill={(Array.isArray(data?.hiring_status) && data.hiring_status.some((s: any) => s.status === 'shortlisted')) ? 'currentColor' : 'none'} />
               HV: {Array.isArray(data?.hiring_status) && data.hiring_status.length > 0 ? (data.hiring_status.length > 1 ? Array.from(new Set(data.hiring_status.map((s: any) => s.status.toUpperCase()))).join(', ') : data.hiring_status[0].status.toUpperCase()) : 'PENDING'}
             </button>
            <button onClick={runVerification} disabled={verifying} className="btn-secondary text-xs">
              {verifying ? <span className="w-3 h-3 border border-ink-400 border-t-transparent rounded-full animate-spin" /> : <Shield size={12} />}
              {verifying ? 'Verifying...' : 'Verify Skills'}
            </button>
            <button onClick={calcScore} disabled={calculating} className="btn-primary text-xs">
              {calculating ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={12} />}
              {calculating ? 'Calculating...' : 'Recalculate Score'}
            </button>
          </div>
        </div>

        {showHV && (
          <div className="mb-8 p-6 rounded-2xl border-2 bg-white border-ink-200 flex flex-col gap-6 animate-slide-up shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
               <button onClick={() => setShowHV(false)} className="p-2 text-ink-400 hover:text-ink-900 transition-colors"><X size={20}/></button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-ink-900 text-white flex items-center justify-center shadow-lg">
                <Briefcase size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-tighter opacity-60">Hiring Verdict History (HV)</h3>
                <div className="text-2xl font-display font-black tracking-tight">Recruiter Assessments</div>
              </div>
            </div>
            {Array.isArray(data?.hiring_status) && data.hiring_status.length > 0 ? (
              <div className="space-y-4">
                {data.hiring_status.map((verdict: any, idx: number) => (
                  <div key={idx} className={clsx("p-4 rounded-xl border flex flex-col gap-3 transition-all hover:shadow-md", verdict.status === 'shortlisted' ? "bg-purple-50 border-purple-200" : verdict.status === 'rejected' ? "bg-red-50 border-red-200" : verdict.status === 'hold' ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-ink-200 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                           {verdict.hr_photo ? <img src={verdict.hr_photo} className="w-full h-full object-cover" /> : verdict.hr_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ink-900">{verdict.hr_name || 'Anonymous Recruiter'}</div>
                          <div className="text-[10px] opacity-60">{new Date(verdict.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className={clsx("px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm", verdict.status === 'shortlisted' ? "bg-purple-600 text-white border-purple-500" : verdict.status === 'rejected' ? "bg-red-600 text-white border-red-500" : verdict.status === 'hold' ? "bg-orange-600 text-white border-orange-500" : "bg-blue-600 text-white border-blue-500")}>
                        {verdict.status || 'pending'}
                      </div>
                    </div>
                    {verdict.notes && <div className="bg-white/60 p-3 rounded-lg text-sm italic border border-white/40">"{verdict.notes.trim()}"</div>}
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-ink-400 py-10">No verdicts yet.</p>}
          </div>
        )}

        <div className="card p-5 mb-6">
          <h2 className="section-title mb-4">Skill Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { key: 'strong_verified', label: 'Strong Verified', color: '#92400e', bg: '#fdf8f0' },
              { key: 'verified', label: 'Verified', color: '#166534', bg: '#f0faf5' },
              { key: 'evidence', label: 'Evidence', color: '#1e40af', bg: '#eff6ff' },
              { key: 'claimed', label: 'Claimed', color: '#78716c', bg: '#f5f4f0' },
            ].map(({ key, label, color, bg }) => (
              <div key={key} className="rounded-lg p-3 text-center" style={{ background: bg }}>
                <div className="font-display text-2xl font-bold" style={{ color }}>{vCounts[key] || 0}</div>
                <div className="text-xs mt-1" style={{ color }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-ink-100 flex gap-2 flex-wrap items-center">
            <label className="btn-secondary text-xs cursor-pointer">
              <Upload size={12} /> Upload Resume (PDF)
              <input type="file" accept=".pdf,.doc,.docx" onChange={onResumeUpload} className="sr-only" />
            </label>
            {profile?.resume_url && <button onClick={parseResume} disabled={parsing} className="btn-primary text-xs"><FileText size={12} /> {parsing ? 'Extracting...' : 'Parse & Auto-fill Profile'}</button>}
          </div>
        </div>

        <div className="flex gap-0 mb-5 border-b border-ink-200 overflow-x-auto scrollbar-hide whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={clsx('px-4 py-2.5 text-sm capitalize transition-colors -mb-px border-b-2 shrink-0', tab === t ? 'border-ink-900 text-ink-900 font-medium' : 'border-transparent text-ink-500 hover:text-ink-700')}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="col-span-2 card p-6">
              <h2 className="section-title mb-5">Basic Information</h2>
              <form onSubmit={handleSubmit(onSaveProfile)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Headline</label><input {...register('headline')} className="input" placeholder="e.g. Full Stack Developer" /></div>
                <div><label className="label">Phone</label><input {...register('phone')} className="input" /></div>
                <div><label className="label">Location</label><input {...register('location')} className="input" /></div>
                <div><label className="label">Years of Experience</label><input {...register('years_experience')} type="number" className="input" /></div>
                <div><label className="label">GitHub URL</label><input {...register('github_url')} className="input" /></div>
                <div><label className="label">LeetCode URL</label><input {...register('leetcode_url')} className="input" /></div>
                <div className="col-span-2"><label className="label">Bio</label><textarea {...register('bio')} className="input h-20" /></div>
                <div className="col-span-2 flex justify-end"><button type="submit" className="btn-primary">Save Changes</button></div>
              </form>
            </div>
            <div className="col-span-1 space-y-6">
              <ConfidenceMeter score={score} />
              <ResumeFeedback />
              <div className="card p-5">
                <h3 className="section-title mb-4">Latest Activity</h3>
                <ProgressTimeline events={timeline.slice(0, 3)} />
              </div>
            </div>
          </div>
        )}

        {tab === 'skills' && (
          <div className="card p-5 animate-slide-up">
             <div className="flex flex-wrap gap-2">
                {mergedSkills.map((s: any) => (
                  <div key={s.name} onClick={() => setSelectedSkill(s.name)} className="px-3 py-1.5 rounded-lg border border-ink-200 bg-white hover:border-ink-400 cursor-pointer flex items-center gap-2 group relative">
                    <span className="text-sm">{s.name}</span>
                    {s.verification_level !== 'claimed' && <Shield size={12} className="text-green-600" />}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSkill(s.id, e); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
             </div>
             <form onSubmit={addSkill} className="mt-6 pt-6 border-t border-ink-100 flex gap-3">
               <input name="name" className="input text-sm py-1.5" placeholder="Add new skill..." required />
               <select name="level" className="input text-sm py-1.5 w-32">
                 <option value="beginner">Beginner</option>
                 <option value="intermediate">Intermediate</option>
                 <option value="expert">Expert</option>
               </select>
               <button type="submit" className="btn-primary text-xs py-1.5">Add Skill</button>
             </form>
          </div>
        )}

        {tab === 'projects' && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.projects || []).map((p: any) => (
                <div key={p.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-lg text-ink-900">{p.title}</h3>
                    <button onClick={(e) => { profileAPI.deleteProject(p.id).then(loadData); }} className="text-ink-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <p className="text-sm text-ink-600 line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.technologies || []).map((t: string) => <span key={t} className="badge badge-gray text-[10px]">{t}</span>)}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {p.github_url && <a href={p.github_url} target="_blank" className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-1"><ExternalLink size={12} /> GitHub</a>}
                    {p.project_url && <a href={p.project_url} target="_blank" className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-1"><Eye size={12} /> Demo</a>}
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="section-title mb-4">Add Project</h3>
              <form onSubmit={addProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Title</label><input name="title" className="input" required /></div>
                <div className="col-span-2"><label className="label">Description</label><textarea name="description" className="input h-20" required /></div>
                <div><label className="label">GitHub URL</label><input name="github_url" className="input" /></div>
                <div><label className="label">Project URL (Demo)</label><input name="project_url" className="input" /></div>
                <div className="col-span-2"><label className="label">Technologies (comma separated)</label><input name="technologies" className="input" placeholder="React, Node.js, PostgreSQL" /></div>
                <div className="col-span-2 flex justify-end"><button type="submit" className="btn-primary">Add Project</button></div>
              </form>
            </div>
          </div>
        )}

        {tab === 'experience' && (
          <div className="space-y-4 animate-slide-up">
            {(data?.experience || []).map((e: any) => (
              <div key={e.id} className="card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500"><Briefcase size={20} /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-ink-900">{e.role}</h3>
                    <span className="text-xs text-ink-400">
                      {e.start_date && !isNaN(new Date(e.start_date).getTime()) ? new Date(e.start_date).getFullYear() : '—'} - {e.end_date && !isNaN(new Date(e.end_date).getTime()) ? new Date(e.end_date).getFullYear() : 'Present'}
                    </span>
                  </div>
                  <div className="text-sm text-ink-700">{e.company} · {e.location}</div>
                  <p className="text-xs text-ink-500 mt-2 leading-relaxed">{e.description}</p>
                </div>
                <button onClick={() => profileAPI.deleteExperience(e.id).then(loadData)} className="text-ink-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="card p-5">
              <h3 className="section-title mb-4">Add Experience</h3>
              <form onSubmit={async (ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.currentTarget);
                try {
                  await profileAPI.addExperience(Object.fromEntries(fd));
                  toast.success('Experience added');
                  loadData();
                  (ev.target as HTMLFormElement).reset();
                } catch { toast.error('Failed to add'); }
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Role</label><input name="role" className="input" required /></div>
                <div><label className="label">Company</label><input name="company" className="input" required /></div>
                <div><label className="label">Start Date</label><input name="start_date" type="date" className="input" required /></div>
                <div><label className="label">End Date (leave blank if current)</label><input name="end_date" type="date" className="input" /></div>
                <div className="col-span-2"><label className="label">Description</label><textarea name="description" className="input h-20" /></div>
                <div className="col-span-2 flex justify-end"><button type="submit" className="btn-primary">Add Experience</button></div>
              </form>
            </div>
          </div>
        )}

        {tab === 'education' && (
          <div className="space-y-4 animate-slide-up">
            {(data?.education || []).map((e: any) => (
              <div key={e.id} className="card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500"><BookOpen size={20} /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-ink-900">{e.degree}</h3>
                    <span className="text-xs text-ink-400">{e.start_year} - {e.end_year}</span>
                  </div>
                  <div className="text-sm text-ink-700">{e.institution}</div>
                  {e.grade && <div className="text-xs text-ink-500 mt-1">Grade: {e.grade}</div>}
                </div>
                <button onClick={() => profileAPI.deleteEducation(e.id).then(loadData)} className="text-ink-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="card p-5">
              <h3 className="section-title mb-4">Add Education</h3>
              <form onSubmit={async (ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.currentTarget);
                try {
                  await profileAPI.addEducation(Object.fromEntries(fd));
                  toast.success('Education added');
                  loadData();
                  (ev.target as HTMLFormElement).reset();
                } catch { toast.error('Failed to add'); }
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Institution</label><input name="institution" className="input" required /></div>
                <div><label className="label">Degree</label><input name="degree" className="input" required /></div>
                <div><label className="label">Field of Study</label><input name="field_of_study" className="input" /></div>
                <div><label className="label">Start Year</label><input name="start_year" type="number" className="input" required /></div>
                <div><label className="label">End Year</label><input name="end_year" type="number" className="input" required /></div>
                <div className="col-span-2 flex justify-end"><button type="submit" className="btn-primary">Add Education</button></div>
              </form>
            </div>
          </div>
        )}

        {tab === 'certificates' && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.certificates || []).map((c: any) => (
                <div key={c.id} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500"><CheckCircle size={20} /></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-ink-900">{c.name}</h3>
                    <div className="text-sm text-ink-700">{c.issuer}</div>
                    <div className="text-[10px] text-ink-400 uppercase tracking-wider mt-1">
                      Issued: {c.issue_date && !isNaN(new Date(c.issue_date).getTime()) ? new Date(c.issue_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <button onClick={() => profileAPI.deleteCertificate(c.id).then(loadData)} className="text-ink-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="section-title mb-4">Add Certificate</h3>
              <form onSubmit={async (ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.currentTarget);
                try {
                  await profileAPI.addCertificate(Object.fromEntries(fd));
                  toast.success('Certificate added');
                  loadData();
                  (ev.target as HTMLFormElement).reset();
                } catch { toast.error('Failed to add'); }
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Certificate Name</label><input name="name" className="input" required /></div>
                <div><label className="label">Issuing Organization</label><input name="issuer" className="input" required /></div>
                <div><label className="label">Issue Date</label><input name="issue_date" type="date" className="input" required /></div>
                <div className="col-span-2"><label className="label">Credential URL</label><input name="credential_url" className="input" /></div>
                <div className="col-span-2 flex justify-end"><button type="submit" className="btn-primary">Add Certificate</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

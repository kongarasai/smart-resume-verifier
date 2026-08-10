'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { profileAPI, scoringAPI, verificationAPI, hrAPI, evaluationAPI, interviewAPI } from '@/lib/api';
import { ConfidenceMeter } from '@/components/shared/ConfidenceMeter';
import { Shield, Github, Code2, ExternalLink, Briefcase, BookOpen, CheckCircle, Clock, Calendar, Star, Trash2, Ban, Send, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { sendDebugLog } from '@/lib/debug';

export default function CandidateClient() {
  const { user } = useAuthStore();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Robust ID resolution: prioritizes ?id= query param (Static/Capacitor) then route :id param
  const id = (searchParams.get('id') || params.id) as string;
  
  console.log('[CandidateClient] Loading ID:', id, 'from params:', params, 'search:', searchParams.toString());
  const [data, setData] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [hrEval, setHrEval] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [guideData, setGuideData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({ scheduled_date: '', scheduled_time: '', mode: 'Technical' });
  const [evalForm, setEvalForm] = useState({ status: 'Shortlist', notes: '' });
  const [error, setError] = useState<string | null>(null);

  const generateGuide = async () => {
    setBusy(true);
    try {
      const res = await scoringAPI.getSuggestions(id);
      setGuideData(res.suggestions);
      toast.success('Interview questions generated!');
    } catch { 
      toast.error('AI suggestions not available yet. Please wait for verification.'); 
    } finally {
      setBusy(false);
    }
  };

  const loadData = async () => {
    sendDebugLog(`CandidateClient loadData: id=${id}`);
    if (!id) {
      sendDebugLog('CandidateClient: No ID provided', 'warn');
      return;
    }
    setLoading(true);
    try {
      sendDebugLog(`CandidateClient: Fetching profile data for ${id}...`);
      const [profileRes, scoreRes, verifRes] = await Promise.all([
        profileAPI.get(id),
        scoringAPI.get(id).catch((e: any) => { 
          sendDebugLog(`Score fetch failed: ${e.message}`, 'warn');
          return null; 
        }),
        verificationAPI.getSummary(id).catch((e: any) => { 
          sendDebugLog(`Verif fetch failed: ${e.message}`, 'warn');
          return null; 
        }),
      ]);
      sendDebugLog(`CandidateClient: Data loaded successfully for ${id}`);
      setData(profileRes);
      setScore(scoreRes);
      setVerification(verifRes);
      setHrEval(profileRes.hiring_status || []);
    } catch (err: any) {
      sendDebugLog(`CandidateClient Load Error: ${err.message}`, 'error', { error: err });
      toast.error('Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    sendDebugLog(`CandidateClient Mounted: id=${id}`);
    loadData(); 
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast.error('Loading timed out. Please check your internet or try refreshing.');
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="bg-blue-600 text-white p-1 text-[8px] font-bold uppercase rounded">Client Loading...</div>
      <div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="card p-16 text-center">
      <p className="text-ink-400">Candidate not found.</p>
    </div>
  );

  const profile = data.profile;
  const skills = data.skills || [];
  const projects = data.projects || [];
  const experience = data.experience || [];
  const education = data.education || [];
  const vCounts = verification?.counts || {};

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-ink-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 text-2xl font-bold overflow-hidden">
            {profile?.photo_url ? (
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}${profile.photo_url}`} className="w-full h-full object-cover" alt="" />
            ) : (
              profile?.full_name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink-900">{profile?.full_name}</h1>
            <p className="text-ink-500 text-sm">{profile?.headline || 'Professional Candidate'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', 
                profile?.is_available ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-400')}>
                {profile?.is_available ? 'Available' : 'Unavailable'}
              </span>
              <span className="text-ink-400 text-xs">• {profile?.location || 'Remote'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {user?.role === 'hr' && (
            <div className="flex gap-2">
              <button onClick={() => setShowSchedule(true)} className="btn-primary py-2 px-4 text-xs">
                <Calendar size={14} /> Schedule
              </button>
              <button onClick={generateGuide} className="btn-secondary py-2 px-4 text-xs border-indigo-200 text-indigo-700 bg-indigo-50">
                <Send size={14} /> Generate Questions
              </button>
            </div>
          )}
          {profile?.github_url && (
            <a href={profile.github_url} target="_blank" className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors">
              <Github size={18} className="text-ink-600" />
            </a>
          )}
          {profile?.leetcode_url && (
            <a href={profile.leetcode_url} target="_blank" className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors">
              <Code2 size={18} className="text-ink-600" />
            </a>
          )}
        </div>
      </div>

      {/* HR Scheduling Modal */}
      {showSchedule && (
        <div className="card p-6 border-ink-900 animate-slide-up bg-ink-900 text-white">
          <h3 className="font-display text-lg mb-4 flex items-center gap-2"><Calendar size={20}/> Schedule Interview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[10px] uppercase text-ink-400 font-bold mb-1 block">Date</label>
              <input type="date" className="input bg-ink-800 border-ink-700 text-white w-full" value={scheduleData.scheduled_date} onChange={e=>setScheduleData(s=>({...s,scheduled_date:e.target.value}))} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-ink-400 font-bold mb-1 block">Time</label>
              <input type="time" className="input bg-ink-800 border-ink-700 text-white w-full" value={scheduleData.scheduled_time} onChange={e=>setScheduleData(s=>({...s,scheduled_time:e.target.value}))} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-ink-400 font-bold mb-1 block">Type</label>
              <select className="input bg-ink-800 border-ink-700 text-white w-full" value={scheduleData.mode} onChange={e=>setScheduleData(s=>({...s,mode:e.target.value}))}>
                <option value="technical">Technical</option>
                <option value="hr">HR / Cultural</option>
                <option value="final">Final Round</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                try { 
                  await interviewAPI.schedule({ candidate_id: id, ...scheduleData }); 
                  toast.success('Interview scheduled'); 
                  setShowSchedule(false);
                } catch { toast.error('Failed to schedule'); }
              }}
              className="btn-primary bg-white text-ink-900 border-none px-6"
            >Confirm</button>
            <button onClick={() => setShowSchedule(false)} className="text-ink-400 text-xs px-4">Cancel</button>
          </div>
        </div>
      )}

      {/* Generated Interview Questions UI */}
      {guideData && (
        <div className="card p-6 border-indigo-200 bg-indigo-50/50 mb-6 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg text-indigo-900 flex items-center gap-2"><Send size={20}/> Suggested Interview Questions</h3>
            <button onClick={() => setGuideData(null)} className="text-xs text-indigo-400 hover:text-indigo-900">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guideData.map((s: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-indigo-400 mb-2 tracking-widest">{s.area}</div>
                <div className="space-y-3">
                  {(s.questions || s.custom_questions || []).map((q: any, j: number) => (
                    <div key={j} className="text-sm text-ink-700 flex gap-2">
                      <span className="text-indigo-300 font-bold font-mono">{j+1}.</span>
                      <p>{q.title || q}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Verification */}
        <div className="lg:col-span-1 space-y-6">
          <ConfidenceMeter score={score} />
          
          <div className="card p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink-400 mb-4">Verification Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Strong Verified', count: vCounts.strong_verified, color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Verified', count: vCounts.verified, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Evidence', count: vCounts.evidence, color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Claimed', count: vCounts.claimed, color: 'text-ink-500', bg: 'bg-ink-100' },
              ].map(stat => (
                <div key={stat.label} className={clsx('p-3 rounded-xl text-center', stat.bg)}>
                  <div className={clsx('text-xl font-bold', stat.color)}>{stat.count || 0}</div>
                  <div className={clsx('text-[10px] uppercase font-medium', stat.color)}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {profile?.bio && (
            <div className="card p-6">
              <h3 className="section-title mb-3">About</h3>
              <p className="text-ink-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Verified Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: any) => (
                <div key={s.name} className="px-3 py-1.5 rounded-lg border border-ink-100 bg-ink-50 flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-800">{s.name}</span>
                  {s.verification_level !== 'claimed' && <Shield size={12} className="text-green-600" />}
                </div>
              ))}
              {skills.length === 0 && <p className="text-ink-400 text-sm italic">No skills listed yet.</p>}
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <h3 className="section-title px-1">Key Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p: any) => (
                <div key={p.id} className="card p-5 border-l-4 border-l-ink-900">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-ink-900">{p.title}</h4>
                    <div className="flex gap-2">
                      {p.github_url && <a href={p.github_url} target="_blank" className="text-ink-400 hover:text-ink-900"><Github size={14} /></a>}
                      {p.project_url && <a href={p.project_url} target="_blank" className="text-ink-400 hover:text-ink-900"><ExternalLink size={14} /></a>}
                    </div>
                  </div>
                  <p className="text-xs text-ink-500 line-clamp-3 mb-3">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(p.technologies || []).map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-ink-100 text-ink-600 text-[9px] font-medium uppercase">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-ink-400 text-sm italic col-span-2">No projects added.</p>}
            </div>
          </div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="section-title px-1">Experience</h3>
              <div className="space-y-3">
                {experience.map((e: any) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="mt-1"><Briefcase size={14} className="text-ink-300" /></div>
                    <div>
                      <div className="text-sm font-bold text-ink-900">{e.role}</div>
                      <div className="text-xs text-ink-500">{e.company}</div>
                      <div className="text-[10px] text-ink-400 mt-0.5">
                        {new Date(e.start_date).getFullYear()} - {e.end_date ? new Date(e.end_date).getFullYear() : 'Present'}
                      </div>
                    </div>
                  </div>
                ))}
                {experience.length === 0 && <p className="text-ink-400 text-xs italic">No experience added.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="section-title px-1">Education</h3>
              <div className="space-y-3">
                {education.map((e: any) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="mt-1"><BookOpen size={14} className="text-ink-300" /></div>
                    <div>
                      <div className="text-sm font-bold text-ink-900">{e.degree}</div>
                      <div className="text-xs text-ink-500">{e.institution}</div>
                      <div className="text-[10px] text-ink-400 mt-0.5">{e.start_year} - {e.end_year}</div>
                    </div>
                  </div>
                ))}
                {education.length === 0 && <p className="text-ink-400 text-xs italic">No education added.</p>}
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="space-y-4">
            <h3 className="section-title px-1">Certifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.certificates || []).map((c: any) => (
                <div key={c.id} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500"><CheckCircle size={20} /></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-ink-900">{c.name}</h3>
                    <div className="text-sm text-ink-700">{c.issuer}</div>
                    <div className="text-[10px] text-ink-400 uppercase tracking-wider mt-1">Issued: {new Date(c.issue_date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {(data?.certificates || []).length === 0 && <p className="text-ink-400 text-sm italic">No certifications added.</p>}
            </div>
          </div>
        </div>

        {/* HR Toolkit: Bottom Section */}
        {user?.role === 'hr' && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-ink-100">
            {/* Action Panel */}
            <div className="card p-6 border-2 border-indigo-50">
              <h3 className="section-title mb-4 flex items-center gap-2"><UserCheck size={18}/> HR Decision</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Update Status</label>
                  <select className="input" value={evalForm.status} onChange={e=>setEvalForm(s=>({...s,status:e.target.value}))}>
                    <option>Shortlist</option>
                    <option>On Hold</option>
                    <option>Reject</option>
                    <option>Hired</option>
                  </select>
                </div>
                <div>
                  <label className="label">Internal Notes</label>
                  <textarea className="input h-24 resize-none" placeholder="Feedback from verification..." value={evalForm.notes} onChange={e=>setEvalForm(s=>({...s,notes:e.target.value}))}></textarea>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await evaluationAPI.saveHR(id, evalForm);
                      toast.success('Evaluation saved');
                      loadData();
                    } catch { toast.error('Failed to save'); }
                  }}
                  className="btn-primary w-full"
                >Save Evaluation</button>
              </div>
            </div>

            {/* AI Helper */}
            <div className="card p-6 bg-ink-50">
              <h3 className="section-title mb-3 flex items-center gap-2"><CheckCircle size={18} className="text-ink-900"/> Smart Helpers</h3>
              <div className="space-y-3">
                <button 
                   onClick={generateGuide}
                   className="w-full text-left p-3 rounded-lg border border-ink-200 bg-white hover:bg-ink-100 transition flex items-center justify-between group"
                >
                  <div className="text-xs font-medium text-ink-900">Get Interview Guide</div>
                  <Send size={14} className="text-ink-300 group-hover:text-ink-900"/>
                </button>
                <div className="p-3 rounded-lg bg-white border border-ink-200">
                  <div className="text-[10px] uppercase font-bold text-ink-400 mb-1">Fraud Analysis</div>
                  <p className="text-xs text-ink-600 italic">"Based on {score?.github_score}% code authenticity score, candidate has {score?.fraud_risk_level} risk profile."</p>
                </div>
              </div>
            </div>

            {/* Evaluation History */}
            <div className="card p-6">
              <h3 className="section-title mb-4">Hiring History</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {hrEval.map((ev, i) => (
                  <div key={i} className="border-b border-ink-50 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', 
                        ev.status === 'Reject' ? 'bg-red-100 text-red-700' : 
                        ev.status === 'Hired' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                        {ev.status}
                      </span>
                      <span className="text-[10px] text-ink-400">{new Date(ev.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-ink-600 line-clamp-2">{ev.notes}</p>
                    <div className="text-[10px] text-ink-400 mt-1">— {ev.hr_name || 'HR Team'}</div>
                  </div>
                ))}
                {hrEval.length === 0 && <p className="text-xs text-ink-400 italic text-center py-4">No evaluations yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

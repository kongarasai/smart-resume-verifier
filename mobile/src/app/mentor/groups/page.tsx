'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { groupAPI, rankingAPI, mentorAPI } from '@/lib/api';
import { Plus, Users, Archive, UserMinus, Download, Send, GraduationCap, BarChart2, Eye, AlertTriangle, Trophy, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [addingMembers, setAddingMembers] = useState(false);
  const [addSummary, setAddSummary] = useState<any>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [showTeacherAdd, setShowTeacherAdd] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparison, setComparison] = useState<any[]>([]);
  const [newGroup, setNewGroup] = useState({ workspace_id: '', name: '', description: '' });
  const [newWs, setNewWs] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    try {
      const [ws, gr] = await Promise.all([groupAPI.getWorkspaces(), groupAPI.getGroups()]);
      setWorkspaces(ws.data || []);
      setGroups(gr.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadMembers = async (gid: string) => {
    const r = await groupAPI.getMembers(gid);
    setMembers(r.data || []);
  };

  const selectGroup = (g: any) => { setSelectedGroup(g); loadMembers(g.id); setAddSummary(null); };

  const createWs = async () => {
    if (!newWs.name.trim()) return;
    try { await groupAPI.createWorkspace(newWs); toast.success('Workspace created'); setNewWs({name:'',description:''}); setShowCreateWs(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteWorkspace = async (wid: string) => {
    if (!confirm('Delete this workspace?')) return;
    try { await groupAPI.deleteWorkspace(wid); toast.success('Workspace deleted'); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const createGroup = async () => {
    if (!newGroup.workspace_id || !newGroup.name.trim()) return toast.error('Select workspace and enter name');
    try { await groupAPI.createGroup(newGroup); toast.success('Group created'); setNewGroup({workspace_id:'',name:'',description:''}); setShowCreateGroup(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const addMembers = async () => {
    const emails = emailInput.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!emails.length) return toast.error('Enter at least one email');
    setAddingMembers(true);
    try {
      const res = await groupAPI.addMembers({ group_id: selectedGroup.id, emails });
      setAddSummary(res.data); setEmailInput(''); loadMembers(selectedGroup.id);
      toast.success(`Added ${res.data.added} candidate(s)`);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setAddingMembers(false); }
  };

  const addTeacher = async () => {
    if (!teacherEmail.trim()) return toast.error('Enter teacher email');
    try {
      const res = await mentorAPI.addTeacher({ group_id: selectedGroup.id, email: teacherEmail.trim() });
      toast.success(res.data.message); setTeacherEmail(''); setShowTeacherAdd(false); loadMembers(selectedGroup.id);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const sendInvites = async (emails: string[]) => {
    const res = await groupAPI.sendInvites({ group_id: selectedGroup.id, emails });
    toast.success(`Generated ${res.data.invites?.length} invite link(s)`);
    setAddSummary(null);
  };

  const removeMember = async (uid: string) => {
    if (!confirm('Remove from group? Their account and skills are preserved.')) return;
    try { await groupAPI.removeMember({ group_id: selectedGroup.id, user_id: uid }); toast.success('Removed'); loadMembers(selectedGroup.id); }
    catch { toast.error('Failed'); }
  };

  const archiveGroup = async (gid: string) => {
    if (!confirm('Archive this group? Data is preserved.')) return;
    try { await groupAPI.archiveGroup(gid); toast.success('Archived'); setSelectedGroup(null); load(); }
    catch { toast.error('Failed'); }
  };

  const exportReport = async () => {
    const res = await groupAPI.exportReport(selectedGroup.id, 'csv');
    const blob = new Blob([res.data], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `group-report.csv`; a.click();
    toast.success('Downloaded');
  };

  const loadComparison = async (wsId: string) => {
    try {
      const res = await mentorAPI.getWorkspaceComparison(wsId);
      setComparison(res.data || []); setShowComparison(true);
    } catch { toast.error('Failed to load comparison'); }
  };

  const candidates = members.filter(m => m.group_role === 'candidate');
  const teachers = members.filter(m => m.group_role === 'teacher');

  return (
    <DashboardLayout requiredRole="mentor">
      <div className="animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="font-display text-3xl text-ink-900 mb-1">Groups</h1><p className="text-ink-500 text-sm">Manage workspaces, groups, candidates, and teachers</p></div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateWs(true)} className="btn-secondary"><Plus size={14} /> Workspace</button>
            <button onClick={() => setShowCreateGroup(true)} className="btn-primary"><Plus size={14} /> Group</button>
          </div>
        </div>

        {showCreateWs && (
          <div className="card p-5 mb-5 border-blue-200 bg-blue-50">
            <h3 className="font-medium mb-3">New Workspace</h3>
            <div className="flex gap-3">
              <input className="input flex-1" placeholder="Workspace name *" value={newWs.name} onChange={e => setNewWs(s=>({...s,name:e.target.value}))} />
              <input className="input flex-1" placeholder="Description" value={newWs.description} onChange={e => setNewWs(s=>({...s,description:e.target.value}))} />
              <button onClick={createWs} className="btn-primary shrink-0">Create</button>
              <button onClick={() => setShowCreateWs(false)} className="btn-secondary shrink-0">Cancel</button>
            </div>
          </div>
        )}

        {showCreateGroup && (
          <div className="card p-5 mb-5 border-green-200 bg-green-50">
            <h3 className="font-medium mb-3">New Group</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <select className="input" value={newGroup.workspace_id} onChange={e => setNewGroup(s=>({...s,workspace_id:e.target.value}))}>
                <option value="">Select workspace *</option>
                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input className="input" placeholder="Group name *" value={newGroup.name} onChange={e => setNewGroup(s=>({...s,name:e.target.value}))} />
            </div>
            <div className="flex gap-2"><button onClick={createGroup} className="btn-primary">Create Group</button><button onClick={() => setShowCreateGroup(false)} className="btn-secondary">Cancel</button></div>
          </div>
        )}

        {showComparison && comparison.length > 0 && (
          <div className="card p-5 mb-5 border-purple-200 bg-purple-50">
            <div className="flex justify-between mb-3"><h3 className="font-medium text-purple-900">Workspace Group Comparison</h3><button onClick={() => setShowComparison(false)} className="text-xs text-purple-700">Close</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {comparison.map((g: any, i: number) => (
                <div key={g.id} className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2"><span className="font-bold text-purple-700">#{i+1}</span><span className="font-medium text-ink-900 text-sm">{g.name}</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-center">
                    <div><div className="font-mono font-bold">{g.candidate_count}</div><div className="text-ink-400">Members</div></div>
                    <div><div className="font-mono font-bold">{Math.round(g.avg_confidence||0)}</div><div className="text-ink-400">Avg Score</div></div>
                    <div><div className="font-mono font-bold">{Math.round(g.top_score||0)}</div><div className="text-ink-400">Top Score</div></div>
                    <div><div className="font-mono font-bold">{g.weekly_attempts||0}</div><div className="text-ink-400">Practice/wk</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Groups list */}
          <div className="col-span-1">
            <div className="text-xs text-ink-500 uppercase tracking-wide mb-3">Groups ({groups.length})</div>
            {loading ? <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" /></div>
              : groups.length === 0 ? <div className="card p-6 text-center text-xs text-ink-400">No groups yet</div>
              : (
                <div className="space-y-2">
                  {groups.map(g => (
                    <div key={g.id} className="relative">
                      <button onClick={() => selectGroup(g)}
                        className={clsx('w-full text-left card p-3 hover:border-ink-300 transition-all',
                          selectedGroup?.id===g.id?'border-ink-900 bg-ink-50':'')}>
                        <div className="font-medium text-ink-900 text-sm">{g.name}</div>
                        <div className="text-xs text-ink-500">{g.workspace_name} · {g.member_count} members</div>
                      </button>
                    </div>
                  ))}
                </div>
              )}

            {/* Workspace comparison buttons */}
            {workspaces.length > 0 && (
              <div className="mt-5">
                <div className="text-xs text-ink-500 uppercase tracking-wide mb-2">Compare Workspaces</div>
                {workspaces.map(w => (
                  <div key={w.id} className="flex items-center gap-2 group w-full">
                    <button onClick={() => loadComparison(w.id)} className="flex-1 text-left text-xs text-purple-700 py-1.5 hover:underline flex items-center gap-1.5 truncate">
                      <BarChart2 size={11} className="shrink-0" /> {w.name}
                    </button>
                    <button onClick={() => deleteWorkspace(w.id)} className="text-ink-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group detail */}
          <div className="col-span-2">
            {!selectedGroup ? (
              <div className="card p-14 text-center"><Users size={36} className="mx-auto text-ink-300 mb-3" /><p className="text-ink-500 text-sm">Select a group to manage</p></div>
            ) : (
              <div className="space-y-5">
                {/* Header */}
                <div className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-xl text-ink-900">{selectedGroup.name}</h2>
                      <div className="text-xs text-ink-500 mt-1">{selectedGroup.workspace_name} · {candidates.length}/{selectedGroup.max_members} candidates · {teachers.length} teachers</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <a href="/mentor/problems" className="btn-secondary text-xs"><Plus size={11} /> Add Questions</a>
                      <button onClick={exportReport} className="btn-secondary text-xs"><Download size={11} /> Export CSV</button>
                      <button onClick={() => setShowTeacherAdd(!showTeacherAdd)} className="btn-secondary text-xs"><GraduationCap size={11} /> Add Teacher</button>
                      <button onClick={() => archiveGroup(selectedGroup.id)} className="btn-secondary text-xs"><Archive size={11} /> Archive</button>
                    </div>
                  </div>

                  {/* Add teacher panel */}
                  {showTeacherAdd && (
                    <div className="mt-4 pt-4 border-t border-ink-100">
                      <label className="label">Add Teacher by Email</label>
                      <div className="flex gap-2">
                        <input className="input flex-1" placeholder="teacher@school.edu" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} />
                        <button onClick={addTeacher} className="btn-primary shrink-0">Add Teacher</button>
                      </div>
                      <p className="text-xs text-ink-400 mt-1">Teacher must have registered with role "teacher"</p>
                    </div>
                  )}
                </div>

                {/* Teachers in group */}
                {teachers.length > 0 && (
                  <div className="card p-4">
                    <div className="text-xs text-ink-500 uppercase tracking-wide mb-3">Teachers ({teachers.length})</div>
                    {teachers.map((t: any) => (
                      <div key={t.user_id} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-medium">{t.full_name?.[0]}</div>
                          <div><div className="font-medium text-ink-900">{t.full_name}</div><div className="text-xs text-ink-400">{t.email}</div></div>
                        </div>
                        <button onClick={() => removeMember(t.user_id)} className="text-ink-300 hover:text-red-500"><UserMinus size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add candidates */}
                <div className="card p-5">
                  <h3 className="font-medium text-ink-900 text-sm mb-3">Add Candidates by Email</h3>
                  <textarea className="input h-24 resize-none w-full mb-3" placeholder="Emails (one per line or comma separated)" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                  <button onClick={addMembers} disabled={addingMembers} className="btn-primary">
                    {addingMembers ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                    {addingMembers ? 'Adding...' : 'Add Candidates'}
                  </button>

                  {addSummary && (
                    <div className="mt-4 p-4 bg-ink-50 rounded-lg border border-ink-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-center text-sm mb-3">
                        {[['Total',addSummary.total],['Added',addSummary.added],['Already in',addSummary.already_in_group],['Not registered',addSummary.not_registered?.length]].map(([l,v]) => (
                          <div key={l}><div className="font-bold text-ink-900">{v}</div><div className="text-xs text-ink-500">{l}</div></div>
                        ))}
                      </div>
                      {addSummary.not_registered?.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-ink-700 mb-2">Not registered ({addSummary.not_registered.length}):</div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {addSummary.not_registered.map((e: string) => <span key={e} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">{e}</span>)}
                          </div>
                          <button onClick={() => sendInvites(addSummary.not_registered)} className="btn-secondary text-xs">
                            <Send size={11} /> Send Invite Links
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Candidates table */}
                <div className="card p-5">
                  <h3 className="font-medium text-ink-900 text-sm mb-4">Candidates Overview ({candidates.length})</h3>
                  {candidates.length === 0 ? <p className="text-xs text-ink-400 text-center py-4">No candidates yet</p> : (
                    <div className="space-y-6">
                      
                      {/* Top Performers Leaderboard */}
                      <div>
                         <h4 className="flex items-center gap-2 text-xs font-semibold text-green-700 uppercase tracking-wider mb-3"><Trophy size={14}/> Top Performers</h4>
                         <div className="space-y-2">
                           {candidates.filter(c => c.confidence_score >= 60).map((m: any) => (
                             <div key={m.user_id} className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-0 hover:bg-ink-50 px-2 rounded transition-colors">
                               <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">#{m.rank_position || '—'}</div>
                               <div className="flex-1 min-w-0">
                                 <div className="font-medium text-ink-900 text-sm">{m.full_name}</div>
                                 <div className="text-xs text-ink-400">{m.email}</div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center text-xs shrink-0 mr-4">
                                 <div><div className="font-mono font-bold text-green-600">{m.confidence_score||0}</div><div className="text-ink-400">Score</div></div>
                                 <div>
                                   <div className={clsx('font-medium text-green-600')}>
                                     {(m.career_readiness||'beginner').replace('_',' ')}
                                   </div>
                                   <div className="text-ink-400">Status</div>
                                 </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   toast.loading('Opening profile...', { duration: 1500 });
                                   const url = `/candidates/view/?id=${m.user_id}`;
                                   window.location.assign(url);
                                   
                                 }}
                                 className="btn-secondary text-xs flex items-center gap-1.5"
                               >
                                 <Eye size={13}/> View Profile
                               </button>
                               <button onClick={() => removeMember(m.user_id)} className="text-ink-300 hover:text-red-500 shrink-0 ml-2"><UserMinus size={14} /></button>
                             </div>
                           ))}
                           {candidates.filter(c => c.confidence_score >= 60).length === 0 && <p className="text-xs text-ink-400 italic py-2">No top performers benchmarked.</p>}
                         </div>
                      </div>

                      {/* At Risk Candidates */}
                      <div>
                         <h4 className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3"><AlertTriangle size={14}/> Developing / At Risk</h4>
                         <div className="space-y-2">
                           {candidates.filter(c => c.confidence_score < 60).map((m: any) => (
                             <div key={m.user_id} className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-0 hover:bg-amber-50 px-2 rounded transition-colors">
                               <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">#{m.rank_position || '—'}</div>
                               <div className="flex-1 min-w-0">
                                 <div className="font-medium text-ink-900 text-sm">{m.full_name}</div>
                                 <div className="text-xs text-ink-400">{m.email}</div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center text-xs shrink-0 mr-4">
                                 <div><div className="font-mono font-bold text-amber-600">{m.confidence_score||0}</div><div className="text-amber-700/60">Score</div></div>
                                 <div>
                                   <div className="font-medium text-amber-600 whitespace-nowrap">
                                     {(m.career_readiness||'beginner').replace('_',' ')}
                                   </div>
                                   <div className="text-amber-700/60">Status</div>
                                 </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   toast.loading('Opening profile...', { duration: 1500 });
                                   const url = `/candidates/view/?id=${m.user_id}`;
                                   window.location.assign(url);
                                   
                                 }}
                                 className="px-3 py-1.5 bg-white border border-ink-200 text-ink-700 rounded text-xs font-medium hover:bg-ink-100 transition flex items-center gap-1.5"
                               >
                                 <Eye size={13}/> View Profile
                               </button>
                               <button onClick={() => removeMember(m.user_id)} className="text-ink-300 hover:text-red-500 shrink-0 ml-2"><UserMinus size={14} /></button>
                             </div>
                           ))}
                           {candidates.filter(c => c.confidence_score < 60).length === 0 && <p className="text-xs text-ink-400 italic py-2">No developing candidates.</p>}
                         </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

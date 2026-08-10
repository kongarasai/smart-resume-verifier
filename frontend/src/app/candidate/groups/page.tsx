'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { candidateGroupAPI, practiceAPI } from '@/lib/api';
import { Users, Megaphone, Trophy, BookOpen, ChevronRight, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type SubTab = 'overview' | 'questions' | 'announcements' | 'ranking' | 'expired' | 'assignments';

export default function CandidateGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [questions, setQuestions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Practice state
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expiredSubTab, setExpiredSubTab] = useState<'questions' | 'assignments'>('questions');
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    candidateGroupAPI.getMyGroups()
      .then((r: any) => { setGroups(r.data || []); if (r.data?.[0]) selectGroup(r.data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectGroup = async (g: any) => {
    setSelectedGroup(g);
    setSubTab('overview');
    setActiveQuestion(null);
    setActiveAssignment(null);
    setTestSubmitted(false);
    setTestAnswers({});
    setTestResult(null);
    setResult(null);
    try {
      const [q, a, r, m] = await Promise.all([
        candidateGroupAPI.getGroupQuestions(g.id),
        candidateGroupAPI.getGroupAnnouncements(g.id),
        candidateGroupAPI.getGroupRanking(g.id),
        candidateGroupAPI.getGroupMembers(g.id),
      ]);
      setQuestions(q.data || []);
      console.log('Group Questions fetched:', q.data || []);
      setAnnouncements(a.data || []);
      setRankings(r.data || []);
      setMembers(m.data || []);
    } catch {}
  };

  const submitAnswer = async (qId: string, ans: string, timeTaken: number) => {
    setSubmitting(true);
    try {
      const res = await practiceAPI.submitAnswer({ question_id: qId, submitted_answer: ans, time_taken_seconds: timeTaken });
      setResult(res.data);
      if (res.data.is_correct) toast.success(`Correct! +${res.data.score} points`);
      else if (res.data.is_correct === false) toast.error('Incorrect answer');
      else toast.success('Answer submitted for review');
      // Refresh questions and group stats
      const q = await candidateGroupAPI.getGroupQuestions(selectedGroup.id);
      setQuestions(q.data || []);
      const groupsRes = await candidateGroupAPI.getMyGroups();
      const updatedGroups = groupsRes.data || [];
      setGroups(updatedGroups);
      const updatedG = updatedGroups.find((gr: any) => gr.id === selectedGroup.id);
      if (updatedG) setSelectedGroup(updatedG);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submit failed');
    } finally { setSubmitting(false); }
  };

  const submitTest = async () => {
    if (!activeAssignment) return;
    setSubmitting(true);
    try {
      const res = await practiceAPI.submitAssignmentTest({ 
        assignment_id: activeAssignment.id, 
        answers: testAnswers 
      });
      toast.success('Assignment submitted!');
      setTestResult(res.data);
      setTestSubmitted(true);
      // Refresh questions and group stats
      const q = await candidateGroupAPI.getGroupQuestions(selectedGroup.id);
      setQuestions(q.data || []);
      const groupsRes = await candidateGroupAPI.getMyGroups();
      const updatedGroups = groupsRes.data || [];
      setGroups(updatedGroups);
      const updatedG = updatedGroups.find((gr: any) => gr.id === selectedGroup.id);
      if (updatedG) setSelectedGroup(updatedG);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl text-ink-900 mb-1">My Groups</h1>
        <p className="text-ink-500 text-sm mb-6">Groups you belong to — questions, announcements, and rankings</p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" /></div>
        ) : groups.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={40} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-xl text-ink-800 mb-2">No groups yet</h3>
            <p className="text-ink-500 text-sm">Your mentor will add you to a group. Check back after receiving a notification.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Group list sidebar */}
            <div className="w-full md:w-56 shrink-0 space-y-2 flex md:flex-col gap-2 md:gap-0 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
              {groups.map(g => (
                <button key={g.id} onClick={() => selectGroup(g)}
                  className={clsx('w-64 md:w-full text-left card p-3 hover:border-ink-300 transition-all shrink-0',
                    selectedGroup?.id === g.id ? 'border-ink-900 bg-ink-50' : '')}>
                  <div className="font-medium text-ink-900 text-sm">{g.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{g.workspace_name}</div>
                  <div className="text-xs text-ink-400 mt-1">{g.candidate_count} members</div>
                  {g.rank_position && (
                    <div className="text-xs text-amber-700 mt-0.5">Your rank: #{g.rank_position}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Group content */}
            {selectedGroup && (
              <div className="flex-1 min-w-0">
                {/* Sub-tabs */}
                <div className="flex gap-0 border-b border-ink-200 mb-5 overflow-x-auto scrollbar-hide whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0">
                  {[
                    { id: 'overview', label: 'Overview', icon: Users },
                    { id: 'assignments', label: `Assignments (${Array.from(new Set(questions.filter(q => !q.is_expired && q.assignment_id).map(q => q.assignment_id))).length})`, icon: BookOpen },
                    { id: 'questions', label: `Direct Questions (${questions.filter(q => !q.is_expired && !q.assignment_id).length})`, icon: Star },
                    { id: 'expired', label: `Expired (${questions.filter(q => q.is_expired).length})`, icon: Clock },
                    { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
                    { id: 'ranking', label: 'Rankings', icon: Trophy },
                  ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setSubTab(id as SubTab)}
                      className={clsx('flex items-center gap-1.5 px-5 py-3 text-sm -mb-px border-b-2 transition-colors shrink-0',
                        subTab === id ? 'border-ink-900 text-ink-900 font-medium' : 'border-transparent text-ink-500 hover:text-ink-700')}>
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>

                {/* Unified Specialized Views (Test Mode / Single Question) */}
                {activeAssignment ? (
                  <div className="card p-6 animate-slide-up bg-white shadow-xl border-ink-900 mt-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-100">
                      <div>
                        <h2 className="text-2xl font-display text-ink-900">{activeAssignment.name}</h2>
                        <p className="text-xs text-ink-500">
                          {activeAssignment.isExpired ? 'Reviewing expired assignment. Submission disabled.' : 'Answer all questions below and submit when ready.'}
                        </p>
                      </div>
                      <button onClick={() => setActiveAssignment(null)} className="text-ink-400 hover:text-ink-900"><XCircle size={24} /></button>
                    </div>

                    {testSubmitted ? (
                      <div className="py-12 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-xl font-bold text-ink-900 mb-2">Test Submitted!</h3>
                        {testResult && (
                          <div className="bg-amber-50 rounded-xl p-6 max-w-sm mx-auto mb-6 border border-amber-200">
                            <div className="text-sm text-amber-800 uppercase tracking-wider font-bold mb-1">Your Score</div>
                            <div className="text-5xl font-display font-black text-amber-900">{testResult.totalScore}</div>
                            <div className="text-xs text-amber-600 mt-2">Points added to your profile</div>
                          </div>
                        )}
                        <p className="text-ink-500 mb-6">Your answers have been recorded. Teachers will review any text/code answers.</p>
                        <button onClick={() => { setActiveAssignment(null); setTestSubmitted(false); setTestResult(null); }} className="btn-primary">Back to Group</button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {activeAssignment.questions.map((q: any, i: number) => (
                          <div key={q.id} className="space-y-3">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-ink-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                              <div className="flex-1">
                                <h4 className="font-medium text-ink-900">{q.title}</h4>
                                <p className="text-sm text-ink-500 mt-1">{q.description}</p>
                              </div>
                            </div>

                            {q.question_type === 'mcq' && q.options && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-9">
                                {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: any) => (
                                  <button 
                                    key={opt.id} 
                                    onClick={() => setTestAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                    className={clsx('text-left px-4 py-2 rounded-lg border text-sm transition-all',
                                      testAnswers[q.id] === opt.id ? 'border-ink-900 bg-ink-50 font-bold' : 'border-ink-100 hover:border-ink-300')}
                                  >
                                    <span className="font-mono text-[10px] text-ink-400 mr-2">{opt.id.toUpperCase()}.</span>{opt.text}
                                  </button>
                                ))}
                              </div>
                            )}

                            {q.question_type !== 'mcq' && (
                              <div className="ml-9">
                                <textarea 
                                  className="input w-full h-24 text-sm" 
                                  placeholder="Type your answer..." 
                                  value={testAnswers[q.id] || ''}
                                  onChange={(e) => setTestAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                  disabled={false}
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="pt-6 border-t border-ink-100 flex justify-end gap-3">
                          <button onClick={() => setActiveAssignment(null)} className="btn-secondary">Close</button>
                          <button 
                            onClick={submitTest} 
                            disabled={submitting || Object.keys(testAnswers).length < activeAssignment.questions.length} 
                            className="btn-primary"
                          >
                            {submitting ? 'Submitting...' : 'Submit All Answers'}
                          </button>
                        </div>
                        {Object.keys(testAnswers).length < activeAssignment.questions.length && (
                          <p className="text-[10px] text-right text-red-400">Please answer all questions before submitting.</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : activeQuestion ? (
                  <div className="card p-6 animate-slide-up mt-6">
                    <button onClick={() => { setActiveQuestion(null); setResult(null); setAnswer(''); }} className="text-xs text-ink-500 mb-4 flex items-center gap-1">← Back</button>
                    <div className="flex gap-2 mb-3">
                      <span className={clsx('badge', activeQuestion.difficulty==='easy'?'badge-green':activeQuestion.difficulty==='medium'?'badge-amber':'badge-red')}>{activeQuestion.difficulty}</span>
                      <span className="badge badge-gray">{activeQuestion.category}</span>
                      <span className="badge badge-blue">{activeQuestion.points} pts</span>
                    </div>
                    <h3 className="font-medium text-ink-900 mb-2">{activeQuestion.title}</h3>
                    <p className="text-ink-600 text-sm mb-4 leading-relaxed">{activeQuestion.description}</p>
                    
                    {activeQuestion.attachment_url && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-ink-100 max-w-lg">
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}${activeQuestion.attachment_url}`} 
                          alt="Question Attachment" 
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    )}

                    {result ? (
                      <div className={clsx('p-4 rounded-lg mb-4', result.is_correct===true ? 'bg-green-50 border border-green-200' : result.is_correct===false ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200')}>
                        {result.is_correct===true && <p className="text-green-700 font-medium text-sm">✓ Correct! +{result.score} points earned</p>}
                        {result.is_correct===false && (
                          <div>
                            <p className="text-red-700 font-medium text-sm">✗ Incorrect</p>
                            {result.correct_answer && <p className="text-xs text-red-600 mt-1">Correct answer: <span className="font-bold">{result.correct_answer.toUpperCase()}</span></p>}
                          </div>
                        )}
                        {result.is_correct===null && <p className="text-amber-700 font-medium text-sm">✓ Answer recorded. A teacher will review it.</p>}
                        <button onClick={() => { setActiveQuestion(null); setResult(null); setAnswer(''); }} className="btn-secondary btn-xs mt-3">Continue</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeQuestion.question_type === 'mcq' && activeQuestion.options && (
                          <div className="space-y-2">
                            {(typeof activeQuestion.options === 'string' ? JSON.parse(activeQuestion.options) : activeQuestion.options).map((opt: any) => (
                              <button key={opt.id} onClick={() => submitAnswer(activeQuestion.id, opt.id, 0)} disabled={submitting}
                                className="w-full text-left p-3 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors text-sm">
                                <span className="font-mono text-xs text-ink-400 mr-2">{opt.id.toUpperCase()}.</span> {opt.text}
                              </button>
                            ))}
                          </div>
                        )}
                        {activeQuestion.question_type !== 'mcq' && (
                          <div>
                            <textarea className="input w-full h-32 mb-3" placeholder="Type your answer here..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
                            <button onClick={() => submitAnswer(activeQuestion.id, answer, 0)} disabled={submitting || !answer} className="btn-primary">
                              {submitting ? 'Submitting...' : 'Submit Answer'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Overview */}
                {subTab === 'overview' && !activeAssignment && !activeQuestion && (
                  <div className="mt-6 space-y-4">
                    <div className="card p-5">
                      <h2 className="font-display text-xl text-ink-900 mb-1">{selectedGroup.name}</h2>
                      <div className="text-xs text-ink-500 mb-3">Mentor: {selectedGroup.mentor_name} · {selectedGroup.workspace_name}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[['Members', selectedGroup.candidate_count || members.filter((m:any)=>m.group_role==='candidate').length],
                          ['Your Rank', selectedGroup.rank_position ? `#${selectedGroup.rank_position}` : '—'],
                          ['Your Score', selectedGroup.total_score ? Math.round(selectedGroup.total_score) : '—']
                        ].map(([l,v]) => (
                          <div key={l} className="bg-ink-50 rounded-lg p-3 text-center">
                            <div className="font-mono text-xl font-bold text-ink-900">{v}</div>
                            <div className="text-xs text-ink-500 mt-0.5">{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Teachers in this group */}
                    {members.filter((m:any)=>m.group_role==='teacher').length > 0 && (
                      <div className="card p-4">
                        <div className="text-xs text-ink-500 uppercase tracking-wide mb-3">Teachers</div>
                        {members.filter((m:any)=>m.group_role==='teacher').map((t:any) => (
                          <div key={t.user_id} className="flex items-center gap-2 text-sm py-1">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-medium">{t.full_name?.[0]}</div>
                            <span className="text-ink-800">{t.full_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Assignments */}
                {subTab === 'assignments' && !activeAssignment && !activeQuestion && (
                  <div className="space-y-6">
                    {Array.from(new Set(questions.filter(q => !q.is_expired && q.assignment_id).map(q => q.assignment_id))).length === 0 ? (
                      <div className="card p-12 text-center"><BookOpen size={32} className="mx-auto text-ink-300 mb-3" /><p className="text-ink-400 text-sm">No active assignments.</p></div>
                    ) : (
                      Array.from(new Set(questions.filter(q => !q.is_expired && q.assignment_id).map(q => q.assignment_id))).map(aid => {
                        const assignmentQs = questions.filter(q => q.assignment_id === aid && !q.is_expired);
                        const aName = assignmentQs[0]?.assignment_name || 'Unnamed Assignment';
                        const expiry = assignmentQs[0]?.expires_at;
                        return (
                          <div key={aid as string} className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <div>
                                <h3 className="font-display text-lg text-ink-900">{aName}</h3>
                                {expiry && <div className="text-[10px] text-red-500 font-bold uppercase">Expires: {new Date(expiry).toLocaleString()}</div>}
                              </div>
                              <button 
                                onClick={() => { setActiveAssignment({ id: aid, name: aName, questions: assignmentQs, isExpired: false }); setTestAnswers({}); setTestSubmitted(false); }}
                                className="btn-primary text-sm min-h-[44px] px-5"
                              >
                                Take Test
                              </button>
                            </div>
                            <div className="space-y-2">
                              {assignmentQs.map(q => (
                                <div key={q.id} className="card p-3 bg-white/50 flex items-center justify-between border-dashed">
                                  <span className="text-sm text-ink-600">{q.title}</span>
                                  {q.last_result === true && <CheckCircle size={14} className="text-green-500" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Questions */}
                {subTab === 'questions' && !activeAssignment && !activeQuestion && (
                  <div className="space-y-2">
                    {questions.filter(q => !q.is_expired && !q.assignment_id).map((q: any) => (
                      <QuestionCard key={q.id} q={q} onAttempt={() => { setActiveQuestion(q); setAnswer(''); setResult(null); }} />
                    ))}
                    {questions.filter(q => !q.is_expired && !q.assignment_id).length === 0 && (
                      <div className="card p-12 text-center">
                        <BookOpen size={32} className="mx-auto text-ink-300 mb-3" />
                        <p className="text-ink-400 text-sm">No individual active questions yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Expired (Archive) */}
                {subTab === 'expired' && !activeAssignment && !activeQuestion && (
                  <div className="space-y-4">
                    {/* Nested Sub-tabs for Expired */}
                    <div className="flex gap-4 border-b border-ink-100 mb-4">
                      {[
                        { id: 'questions', label: 'Expired Questions' },
                        { id: 'assignments', label: 'Expired Assignments' }
                      ].map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setExpiredSubTab(t.id as any)}
                          className={clsx('pb-2 text-xs font-bold transition-all border-b-2', 
                            expiredSubTab === t.id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-600')}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {expiredSubTab === 'questions' ? (
                      <div className="space-y-2">
                        {questions.filter(q => q.is_expired && !q.assignment_id).map((q: any) => (
                          <QuestionCard key={q.id} q={q} onAttempt={() => { setActiveQuestion(q); setAnswer(''); setResult(null); }} isExpired />
                        ))}
                        {questions.filter(q => q.is_expired && !q.assignment_id).length === 0 && (
                          <div className="card p-12 text-center">
                            <BookOpen size={32} className="mx-auto text-ink-300 mb-3" />
                            <p className="text-ink-400 text-sm">No individual expired questions.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Grouping by assignment_id */}
                        {Array.from(new Set(questions.filter(q => q.is_expired && q.assignment_id).map(q => q.assignment_id))).map(aid => {
                          const assignmentQs = questions.filter(q => q.assignment_id === aid);
                          const aName = assignmentQs[0]?.assignment_name || 'Unnamed Assignment';
                          return (
                            <div key={aid as string} className="card p-4 bg-white shadow-sm border border-ink-100">
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink-50">
                                <div>
                                  <h4 className="font-bold text-ink-900 text-base">{aName}</h4>
                                  <p className="text-[10px] text-ink-400 uppercase tracking-widest font-semibold">{assignmentQs.length} Questions</p>
                                </div>
                                <button 
                                  onClick={() => { setActiveAssignment({ id: aid, name: aName, questions: assignmentQs, isExpired: true }); setTestAnswers({}); setTestSubmitted(false); }}
                                  className="btn-secondary text-[10px] px-3 py-1.5"
                                >
                                  Review Assignment
                                </button>
                              </div>
                              <div className="space-y-2">
                                {assignmentQs.map(q => (
                                  <div key={q.id} className="flex items-center justify-between text-xs text-ink-500 bg-ink-50/50 p-2 rounded border border-dashed border-ink-100">
                                    <span>{q.title}</span>
                                    {q.last_result === true && <CheckCircle size={12} className="text-green-500" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {questions.filter(q => q.is_expired && q.assignment_id).length === 0 && (
                          <div className="card p-12 text-center">
                            <Clock size={32} className="mx-auto text-ink-300 mb-3" />
                            <p className="text-ink-400 text-sm">No expired assignments.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Announcements */}
                {subTab === 'announcements' && !activeAssignment && !activeQuestion && (
                  <div className="space-y-3">
                    {announcements.length === 0 ? (
                      <div className="card p-12 text-center"><Megaphone size={32} className="mx-auto text-ink-300 mb-3" /><p className="text-ink-400 text-sm">No announcements yet.</p></div>
                    ) : announcements.map((a: any) => (
                      <div key={a.id} className="card p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-ink-900">{a.title}</h3>
                            <div className="text-xs text-ink-400">By {a.author} ({a.author_role}) · {new Date(a.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <p className="text-sm text-ink-600 leading-relaxed">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ranking */}
                {subTab === 'ranking' && !activeAssignment && !activeQuestion && (
                  <div className="card p-5">
                    <h2 className="section-title mb-4">Group Leaderboard — {selectedGroup.name}</h2>
                    {rankings.length === 0 ? (
                      <div className="text-center py-8"><Trophy size={32} className="mx-auto text-ink-300 mb-3" /><p className="text-ink-400 text-sm">No rankings yet. Solve practice problems to appear here.</p></div>
                    ) : (
                      <div className="space-y-2">
                        {rankings.map((r: any, i: number) => (
                          <div key={r.user_id} className={clsx('flex items-center gap-3 p-3 rounded-lg', i === 0 ? 'bg-amber-50 border border-amber-200' : i === 1 ? 'bg-ink-100' : i === 2 ? 'bg-orange-50' : 'bg-white border border-ink-100')}>
                            <div className="w-8 text-center font-display text-lg font-bold text-ink-700">#{r.rank_position}</div>
                            <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-medium text-ink-600 shrink-0">{r.full_name?.[0]?.toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-ink-900 text-sm">{r.full_name}</div>
                              <div className="text-xs text-ink-400">{r.headline || r.career_readiness}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-ink-900">{Math.round(r.total_score || 0)}</div>
                              {r.rank_change !== 0 && (
                                <div className={clsx('text-xs', r.rank_change > 0 ? 'text-green-600' : 'text-red-500')}>
                                  {r.rank_change > 0 ? `↑${r.rank_change}` : `↓${Math.abs(r.rank_change)}`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function QuestionCard({ q, onAttempt, isExpired }: { q: any, onAttempt: () => void, isExpired?: boolean }) {
  return (
    <div key={q.id} className="card p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={clsx("font-medium text-sm", isExpired ? "text-ink-400" : "text-ink-900")}>{q.title}</span>
          <span className={clsx('badge text-xs', q.difficulty==='easy'?'badge-green':q.difficulty==='medium'?'badge-amber':'badge-red')}>{q.difficulty}</span>
          <span className="badge badge-gray text-xs">{q.category}</span>
          {isExpired && <span className="badge bg-red-50 text-red-500 text-[10px] border-red-100 uppercase font-bold">Expired</span>}
        </div>
        <div className="text-xs text-ink-500">
          By {q.created_by_name} · {q.points} pts · Max {q.max_attempts} attempts
          {q.my_attempts > 0 && <span className="ml-2">· Tried {q.my_attempts}×{q.last_result===true?' ✓':q.last_result===false?' ✗':''}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {q.last_result === true && <CheckCircle size={16} className="text-green-500" />}
        {q.last_result === false && q.my_attempts < q.max_attempts && <XCircle size={16} className="text-red-400" />}
        {q.my_attempts >= q.max_attempts && q.last_result !== true
          ? <span className="text-xs text-ink-400">Max attempts</span>
            : <button 
              onClick={onAttempt} 
              className={clsx("btn-primary text-sm min-h-[44px] px-6", isExpired && "bg-ink-200 text-ink-600 hover:bg-ink-300 border-ink-300")}
            >
              {isExpired ? 'Review' : q.my_attempts > 0 ? 'Retry' : 'Attempt'}
            </button>}
      </div>
    </div>
  );
}

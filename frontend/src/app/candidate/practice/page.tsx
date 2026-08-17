'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { practiceAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, ChevronRight, BarChart2, BookOpen, Star, RotateCcw, History, Trophy, ArrowLeft, Square, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type Phase = 'select' | 'quiz' | 'done';

const CATEGORIES = [
  { value: 'coding', label: 'Coding', emoji: '💻', desc: 'Data structures & algorithms' },
  { value: 'aptitude', label: 'Aptitude', emoji: '🧮', desc: 'Logical reasoning & math' },
  { value: 'technical_mcq', label: 'Technical MCQ', emoji: '⚙️', desc: 'CS concepts & system design' },
  { value: 'hr', label: 'HR Questions', emoji: '🤝', desc: 'Behavioral & soft skills' },
];

export default function PracticePage() {
  const router = useRouter();
  const now = new Date();
  const [phase, setPhase] = useState<Phase>('select');
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string; result: any }>>({});
  const [progress, setProgress] = useState<any>(null);
  const [data, setData] = useState<{ groups: any[], assignments: any[] }>({ groups: [], assignments: [] });
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [showLangSelect, setShowLangSelect] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [timer, setTimer] = useState(0);
  const [starred, setStarred] = useState<Set<any>>(new Set());
  const timerRef = useRef<any>(null);

  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  const loadInitialData = () => {
    practiceAPI.getProgress().then((r: any) => setProgress(r.data)).catch(() => {});
    practiceAPI.getAssignments().then((r: any) => setData(r.data || { groups: [], assignments: [] })).catch(() => {});
    practiceAPI.getStarred().then((r: any) => setStarred(new Set((r.data || []).map((q: any) => String(q.id))))).catch(() => {});
    practiceAPI.getHistory().then((r: any) => setSessionHistory(r.data || [])).catch(() => {});
  };

  useEffect(() => { 
    setIsMounted(true);
    loadInitialData();
  }, []);

  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, idx]);

  const handleCategoryClick = (cat: string) => {
    if (cat === 'coding') {
      router.push('/candidate/practice/coding');
    } else {
      startSession(cat);
    }
  };

  const startSession = async (cat: string, tag?: string) => {
    setLoading(true);
    setCategory(cat);
    try {
      const res = await practiceAPI.startSession({ category: cat, tag });
      setQuestions(res.data || []);
      setIdx(0);
      setAnswers({});
      setTimer(0);
      setPhase('quiz');
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const startAssignment = async (groupId: string, assignmentId: string) => {
    setLoading(true);
    try {
      const res = await practiceAPI.getAssignmentQuestions(groupId, assignmentId);
      setQuestions(res.data || []);
      setIdx(0);
      setAnswers({});
      setTimer(0);
      setCategory('assignment');
      setPhase('quiz');
    } catch {
      toast.error('Failed to load assignment questions');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (qId: any, answer: string) => {
    if (answers[qId]) return;
    try {
      const res = await practiceAPI.submitAnswer({
        question_id: qId,
        submitted_answer: answer,
        time_taken_seconds: timer,
      });
      setAnswers(prev => ({
        ...prev,
        [qId]: { selected: answer, result: res.data },
      }));
    } catch {
      toast.error('Failed to submit answer');
    }
  };

  const nextQuestion = () => {
    setTimer(0);
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      endSession();
    }
  };

  const toggleStar = async () => {
    const qId = q?.id;
    if (!qId) return;
    try {
      await practiceAPI.toggleStar(qId);
      setStarred(s => {
        const next = new Set(s);
        const strId = String(qId);
        next.has(strId) ? next.delete(strId) : next.add(strId);
        return next;
      });
    } catch {
      toast.error('Failed to update star');
    }
  };

  const endSession = async () => {
    setShowEndModal(false);
    try {
      const answeredQIds = Object.keys(answers);
      const qIds = answeredQIds.length > 0 ? answeredQIds : questions.slice(0, idx + 1).map(q => q.id);
      await practiceAPI.endSession({ category, question_ids: qIds });
      const progressRes = await practiceAPI.getProgress();
      setProgress(progressRes.data);
      practiceAPI.getHistory().then((r: any) => setSessionHistory(r.data || [])).catch(() => {});
      setPhase('done');
    } catch {
      setPhase('done');
    }
  };

  const resetToSelect = () => {
    setPhase('select');
    setCategory('');
    setQuestions([]);
    setIdx(0);
    setAnswers({});
    setTimer(0);
    loadInitialData();
  };

  const q = questions[idx];
  const currentAnswer = q ? answers[q.id] : null;
  const correct = Object.values(answers).filter((a: any) => a.result?.is_correct).length;
  const totalAttempted = Object.keys(answers).length > 0 ? Object.keys(answers).length : 1;
  const activeAssignments = data.assignments.filter(a => !a.expires_at || new Date(a.expires_at) > now);

  if (!isMounted) return <DashboardLayout><div className="animate-pulse p-8">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="animate-fade-in pb-16">
        {/* Select phase */}
        {phase === 'select' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-3xl text-ink-900 mb-1">Practice</h1>
                <p className="text-ink-500 text-sm">Answer real questions to build your skill evidence score.</p>
              </div>
              <button onClick={() => router.push('/candidate/progress')} className="btn-secondary">
                <BarChart2 size={14} /> My Progress
              </button>
            </div>

            {/* Assignments section */}
            {activeAssignments.length > 0 && (
              <div className="mb-8">
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" /> Targeted Assignments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAssignments.map(a => (
                    <button key={a.id} onClick={() => startAssignment(a.group_id, a.id)} 
                      className="card p-4 hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between group bg-amber-50/10 text-left">
                      <div className="text-left">
                        <div className="font-medium text-ink-900 group-hover:text-ink-950">{a.name}</div>
                        <div className="text-[10px] text-ink-400 mt-0.5 uppercase tracking-wider font-semibold flex items-center gap-2">
                          <span>{a.question_count} questions</span>
                          <span>•</span>
                          <span>{data.groups.find(g => g.id === a.group_id)?.name || 'Group'}</span>
                          {a.expires_at && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock size={10} /> {new Date(a.expires_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="bg-amber-100 p-2 rounded-full text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Groups section */}
            {data.groups.length > 0 && (
              <div className="mb-8">
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-ink-400" /> Your Groups
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.groups.map(g => (
                    <a key={g.id} href={`/candidate/assignments/active/?id=${g.id}`} 
                      className="card p-4 hover:shadow-md hover:border-ink-300 transition-all flex items-center justify-between group">
                      <div>
                        <div className="font-medium text-ink-900 group-hover:text-ink-950">{g.name}</div>
                        <div className="text-xs text-ink-400 mt-0.5">{g.total_question_count} questions total</div>
                      </div>
                      <ChevronRight size={16} className="text-ink-300 group-hover:text-ink-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Practice Modules */}
            <h3 className="section-title mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-ink-400" /> Practice Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const catStats = progress?.by_category?.find((c: any) => c.category === cat.value);
                return (
                  <button key={cat.value} onClick={() => handleCategoryClick(cat.value)} disabled={loading}
                    className="card p-6 text-left hover:shadow-md hover:border-ink-300 transition-all active:scale-[0.99] group">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl mb-3">{cat.emoji}</div>
                      {catStats && (
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 text-[10px] font-bold">Last: {catStats.last_score}%</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-0.5"><Trophy size={9} /> {catStats.best_score}%</span>
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-ink-900 mb-1 group-hover:text-amber-600 transition-colors">{cat.label}</div>
                    <div className="text-sm text-ink-500">{cat.desc}</div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-ink-400">
                        Start session <ChevronRight size={12} />
                      </div>
                      {catStats && (
                        <div className="text-[10px] text-ink-400">{catStats.total_sessions} session{catStats.total_sessions !== 1 ? 's' : ''}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recent Session History */}
            {sessionHistory.length > 0 && (
              <div className="mt-8">
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <History size={16} className="text-ink-400" /> Recent Sessions
                </h3>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink-50 border-b border-ink-100">
                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Category</th>
                        <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Score</th>
                        <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Result</th>
                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionHistory.slice(0, 10).map((s: any) => (
                        <tr key={s.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-25 transition-colors">
                          <td className="px-4 py-3 font-medium text-ink-900 capitalize">{s.category?.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={clsx('font-bold font-mono', s.score_percentage >= 70 ? 'text-green-700' : s.score_percentage >= 40 ? 'text-amber-600' : 'text-red-600')}>
                              {s.score_percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-ink-500">{s.correct_answers}/{s.total_questions}</td>
                          <td className="px-4 py-3 text-right text-xs text-ink-400">
                            {s.completed_at && !isNaN(new Date(s.completed_at).getTime()) ? new Date(s.completed_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Confirmation Modal to End Exam in the Middle */}
        {showEndModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm p-4">
            <div className="card p-6 w-full max-w-md animate-slide-up bg-white shadow-2xl">
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <AlertCircle size={24} />
                <h3 className="font-display text-lg font-bold text-ink-900">End Practice Session?</h3>
              </div>
              <p className="text-sm text-ink-600 mb-6 leading-relaxed">
                Are you sure you want to end this test now? Your {Object.keys(answers).length} answered question{Object.keys(answers).length !== 1 ? 's' : ''} will be submitted and your final scorecard will be generated.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowEndModal(false)} className="btn-secondary text-sm">
                  Continue Test
                </button>
                <button onClick={endSession} className="btn-primary bg-red-600 hover:bg-red-700 text-white text-sm">
                  End & Submit Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz phase */}
        {phase === 'quiz' && q && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            {/* Top Bar with End Test Option */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setShowEndModal(true)} className="text-xs font-semibold text-ink-600 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 hover:border-red-200 transition-colors">
                <ArrowLeft size={14} /> Exit / End Test
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-mono bg-ink-100 px-2.5 py-1 rounded-md text-ink-600">
                  <Clock size={12} /> {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </div>
                <button onClick={() => setShowEndModal(true)} className="text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1 rounded-md transition-colors">
                  Finish Now
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 score-bar">
                <div className="score-bar-fill bg-ink-900 transition-all duration-300" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-ink-500 font-semibold">{idx + 1}/{questions.length}</span>
            </div>

            <div className="card p-6 shadow-sm border-ink-200">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className={clsx('badge', {
                  'bg-green-50 text-green-700 border-green-200': q.difficulty === 'easy',
                  'bg-amber-50 text-amber-700 border-amber-200': q.difficulty === 'medium',
                  'bg-red-50 text-red-700 border-red-200': q.difficulty === 'hard',
                })}>{(q.difficulty || 'medium').toUpperCase()}</span>
                {q.category && <span className="badge bg-ink-100 text-ink-600 border-ink-200 capitalize">{q.category}</span>}
                {q.question_type && <span className="badge bg-ink-100 text-ink-600 border-ink-200 uppercase text-[10px]">{q.question_type}</span>}
                <button 
                  onClick={toggleStar}
                  className={clsx('ml-auto p-1.5 rounded-lg border transition-all', 
                    starred.has(String(q.id)) ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-ink-100 text-ink-300 hover:text-amber-500')}
                >
                   <Star size={16} className={starred.has(String(q.id)) ? "fill-current" : ""} />
                </button>
              </div>

              <h2 className="font-display text-xl text-ink-900 mb-2">{q.title}</h2>
              {q.description && <p className="text-ink-600 text-sm mb-5 leading-relaxed">{q.description}</p>}

              {/* MCQ options */}
              {(!q.question_type || q.question_type === 'mcq') && q.options && (
                <div className="space-y-2.5 my-4">
                  {(JSON.parse(typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) as any[]).map((opt: any) => {
                    const selected = currentAnswer?.selected === opt.id;
                    const isCorrect = currentAnswer?.result?.correct_answer === opt.id;
                    const isWrong = selected && !currentAnswer?.result?.is_correct;
                    return (
                      <button key={opt.id}
                        onClick={() => submitAnswer(q.id, opt.id)}
                        disabled={!!currentAnswer}
                        className={clsx('w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between',
                          !currentAnswer ? 'hover:bg-ink-50 hover:border-ink-400 border-ink-200 bg-white' :
                          isCorrect ? 'bg-green-50 border-green-400 text-green-900 font-medium' :
                          isWrong ? 'bg-red-50 border-red-400 text-red-900 font-medium' :
                          'border-ink-100 text-ink-400 opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-700">{opt.id.toUpperCase()}</span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && <CheckCircle size={18} className="text-green-600 shrink-0" />}
                        {isWrong && <XCircle size={18} className="text-red-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text question */}
              {q.question_type === 'text' && (
                <div>
                  <textarea
                    id={`text-${q.id}`}
                    className="input h-28 resize-none w-full"
                    placeholder="Type your answer here..."
                    disabled={!!currentAnswer}
                  />
                  {!currentAnswer && (
                    <button
                      onClick={() => {
                        const el = document.getElementById(`text-${q.id}`) as HTMLTextAreaElement;
                        submitAnswer(q.id, el.value || '(submitted)');
                      }}
                      className="btn-primary mt-3"
                    >Submit Response</button>
                  )}
                </div>
              )}

              {/* Code question */}
              {q.question_type === 'code' && (
                <div>
                  <textarea
                    id={`code-${q.id}`}
                    className="input h-36 resize-none font-mono text-xs w-full bg-slate-950 text-slate-100 p-4"
                    placeholder="// Write your solution here..."
                    disabled={!!currentAnswer}
                  />
                  {!currentAnswer && (
                    <button onClick={() => {
                      const el = document.getElementById(`code-${q.id}`) as HTMLTextAreaElement;
                      submitAnswer(q.id, el.value || '(submitted)');
                    }} className="btn-primary mt-3">Submit Code</button>
                  )}
                </div>
              )}

              {/* Result + next */}
              {currentAnswer && (
                <div className="mt-5 pt-5 border-t border-ink-100 flex items-center justify-between">
                  <div>
                    {currentAnswer.result?.is_correct === true && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <CheckCircle size={18} /> Correct! +{currentAnswer.result.score || 10} points
                      </div>
                    )}
                    {currentAnswer.result?.is_correct === false && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                        <XCircle size={18} /> Incorrect
                      </div>
                    )}
                    {currentAnswer.result?.is_correct === null && (
                      <div className="text-xs text-ink-500">Answer recorded for verification.</div>
                    )}
                  </div>
                  <button onClick={nextQuestion} className="btn-primary flex items-center gap-2 shadow">
                    {idx < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Done phase */}
        {phase === 'done' && (
          <div className="max-w-lg mx-auto text-center py-8 animate-slide-up">
            {/* Top Return Button */}
            <div className="flex justify-start mb-4">
              <button onClick={resetToSelect} className="text-xs font-semibold text-ink-600 hover:text-ink-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 bg-white">
                <ArrowLeft size={14} /> Back to Practice Categories
              </button>
            </div>

            <div className="text-5xl mb-3">🎉</div>
            <h2 className="font-display text-3xl text-ink-900 mb-1">Session Complete!</h2>
            <p className="text-sm text-ink-500 mb-6">Great job! Your answers have been recorded and your skills score is updated.</p>

            <div className="card p-6 my-6 text-left shadow-sm border-ink-200">
              {/* Scorecard Stats */}
              <div className="grid grid-cols-3 gap-4 text-center mb-6 pb-6 border-b border-ink-100">
                <div>
                  <div className="font-display text-3xl font-bold text-green-700">{correct}</div>
                  <div className="text-xs text-ink-500 font-medium mt-1">Correct</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-red-600">{Math.max(0, totalAttempted - correct)}</div>
                  <div className="text-xs text-ink-500 font-medium mt-1">Incorrect</div>
                </div>
                <div>
                  <div className={clsx('font-display text-3xl font-bold', Math.round((correct / totalAttempted) * 100) >= 70 ? 'text-green-700' : Math.round((correct / totalAttempted) * 100) >= 40 ? 'text-amber-600' : 'text-red-600')}>
                    {Math.round((correct / totalAttempted) * 100)}%
                  </div>
                  <div className="text-xs text-ink-500 font-medium mt-1">Score</div>
                </div>
              </div>

              {/* Previous Best Score Comparison */}
              {(() => {
                const catStats = progress?.by_category?.find((c: any) => c.category === category);
                const currentScore = Math.round((correct / totalAttempted) * 100);
                if (!catStats || catStats.total_sessions <= 1) return null;
                const isBetter = currentScore > (catStats.best_score || 0);
                return (
                  <div className={clsx('rounded-xl p-4 border text-center', isBetter ? 'bg-green-50 border-green-200' : 'bg-ink-50 border-ink-200')}>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-ink-400 mb-1">Previous Best</div>
                    <div className="font-display text-2xl text-ink-700">{catStats.best_score}%</div>
                    {isBetter && <div className="text-xs text-green-600 font-medium mt-1">🏆 New personal best score!</div>}
                    {!isBetter && <div className="text-xs text-ink-500 mt-1">Your best: {catStats.best_score}% • Avg: {catStats.avg_score}%</div>}
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => { loadInitialData(); startSession(category); }} className="btn-primary flex items-center justify-center gap-2">
                <RotateCcw size={14} /> Re-Test {CATEGORIES.find(c => c.value === category)?.label || 'Practice'}
              </button>
              <button onClick={resetToSelect} className="btn-secondary justify-center">
                Practice Other Category
              </button>
              <button onClick={() => router.push('/candidate/progress')} className="btn-secondary justify-center">
                View Progress & Analytics
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

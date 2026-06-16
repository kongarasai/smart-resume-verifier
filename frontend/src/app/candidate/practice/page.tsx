'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { practiceAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, ChevronRight, BarChart2, BookOpen, Star, RotateCcw, History, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
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


  const [showLangSelect, setShowLangSelect] = useState(false);
  const [timer, setTimer] = useState(0);
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [timeline, setTimeline] = useState<any[]>([]);
  const timerRef = useRef<any>(null);

  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  const loadInitialData = () => {
    practiceAPI.getProgress().then(r => setProgress(r.data)).catch(() => {});
    practiceAPI.getAssignments().then(r => setData(r.data || { groups: [], assignments: [] })).catch(() => {});
    practiceAPI.getStarred().then(r => setStarred(new Set((r.data || []).map((q: any) => q.id)))).catch(() => {});
    practiceAPI.getHistory().then(r => setSessionHistory(r.data || [])).catch(() => {});
  };

  useEffect(() => { loadInitialData(); }, []);


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
    }
    else startSession(cat);
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
      setQuestions(res.data);
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


  const submitAnswer = async (qId: string, answer: string) => {
    if (answers[qId]) return; // Already answered
    const assignment = data.assignments.find(a => a.id === questions[0]?.assignment_id);
    const isExpired = assignment?.expires_at && new Date(assignment.expires_at) <= now;
    if (isExpired) {
      toast.error('This assignment has expired. You can only review questions.');
      return;
    }
    try {
      const res = await practiceAPI.submitAnswer({ question_id: qId, submitted_answer: answer, time_taken_seconds: timer });
      setAnswers(prev => ({ ...prev, [qId]: { selected: answer, result: res.data } }));
    } catch {
      toast.error('Submit failed');
    }
  };

  const nextQuestion = () => {
    setTimer(0);
    if (idx < questions.length - 1) setIdx(idx + 1);
    else endSession();
  };

  const toggleStar = async () => {
    const qId = q?.id;
    if (!qId) return;
    try {
      await practiceAPI.toggleStar(qId);
      setStarred(s => {
        const next = new Set(s);
        next.has(qId) ? next.delete(qId) : next.add(qId);
        return next;
      });
    } catch {
      toast.error('Failed to update star');
    }
  };

  const endSession = async () => {
    try {
      const qIds = questions.map(q => q.id);
      await practiceAPI.endSession({ category, question_ids: qIds });
      const progressRes = await practiceAPI.getProgress();
      setProgress(progressRes.data);
      setPhase('done');
    } catch {
      setPhase('done');
    }
  };

  const q = questions[idx];
  const currentAnswer = q ? answers[q.id] : null;
  const correct = Object.values(answers).filter((a: any) => a.result?.is_correct).length;
  const activeAssignments = data.assignments.filter(a => !a.expires_at || new Date(a.expires_at) > now);
  const expiredAssignments = data.assignments.filter(a => a.expires_at && new Date(a.expires_at) <= now);

  const chartData = progress?.by_category?.map((c: any) => ({
    name: c.category, score: Math.round(c.avg_score)
  })) || [];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Select phase */}
        {phase === 'select' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-3xl text-ink-900 mb-1">Practice</h1>
                <p className="text-ink-500 text-sm">Answer real questions to build your skill evidence score.</p>
              </div>
              <button onClick={() => router.push('/candidate/progress')} className="btn-secondary"><BarChart2 size={14} /> My Progress</button>
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
                      className="card p-4 hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between group bg-amber-50/10">
                      <div className="text-left">
                        <div className="font-medium text-ink-900 group-hover:text-ink-950">{a.name}</div>
                        <div className="text-[10px] text-ink-400 mt-0.5 uppercase tracking-wider font-semibold flex items-center gap-2">
                          <span>{a.question_count} questions</span>
                          <span>•</span>
                          <span>{data.groups.find(g => g.id === a.group_id)?.name}</span>
                          {a.expires_at && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-600"><Clock size={10} /> {new Date(a.expires_at).toLocaleDateString()}</span>
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


            <h3 className="section-title mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-ink-400" /> Quick Practice
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const catStats = progress?.by_category?.find((c: any) => c.category === cat.value);
                return (
                  <button key={cat.value} onClick={() => handleCategoryClick(cat.value)} disabled={loading}
                    className="card p-6 text-left hover:shadow-md hover:border-ink-300 transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl mb-3">{cat.emoji}</div>
                      {catStats && (
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 text-[10px] font-bold">Last: {catStats.last_score}%</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-0.5"><Trophy size={9} /> {catStats.best_score}%</span>
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-ink-900 mb-1">{cat.label}</div>
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
                          <td className="px-4 py-3 text-right text-xs text-ink-400">{s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Language select modal */}
        {showLangSelect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm">
            <div className="card p-6 w-full max-w-sm animate-slide-up">
              <h3 className="font-display text-xl mb-4">Select Programming Language</h3>
              <div className="space-y-2 mb-5">
                {['C', 'C++', 'Java', 'Python', 'Javascript'].map(lang => (
                  <button key={lang} onClick={() => { setShowLangSelect(false); startSession('coding', lang); }}
                    className="w-full text-left p-3 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors font-medium text-ink-900">
                    {lang}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowLangSelect(false)} className="btn-secondary w-full justify-center">Cancel</button>
            </div>
          </div>
        )}

        {/* Quiz phase */}
        {phase === 'quiz' && q && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 score-bar">
                <div className="score-bar-fill bg-ink-900" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-ink-500">{idx + 1}/{questions.length}</span>
              <div className="flex items-center gap-1 text-xs text-ink-400">
                <Clock size={11} /> {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="card p-6">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className={clsx('badge', {
                  'bg-green-50 text-green-700 border-green-200': q.difficulty === 'easy',
                  'bg-amber-50 text-amber-700 border-amber-200': q.difficulty === 'medium',
                  'bg-red-50 text-red-700 border-red-200': q.difficulty === 'hard',
                })}>{q.difficulty}</span>
                <span className="badge bg-ink-100 text-ink-600 border-ink-200">{q.category}</span>
                <span className="badge bg-ink-100 text-ink-600 border-ink-200">{q.question_type}</span>
                <button 
                  onClick={toggleStar}
                  className={clsx('ml-auto p-1.5 rounded-lg border transition-all', 
                    starred.has(q.id) ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-ink-100 text-ink-300 hover:text-amber-500')}
                >
                   <Star size={16} className={starred.has(q.id) ? "fill-current" : ""} />
                </button>
              </div>

              <h2 className="font-display text-xl text-ink-900 mb-2">{q.title}</h2>
              <p className="text-ink-600 text-sm mb-5 leading-relaxed">{q.description}</p>

              {/* MCQ options */}
              {q.question_type === 'mcq' && q.options && (
                <div className="space-y-2">
                  {(JSON.parse(typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) as any[]).map((opt: any) => {
                    const selected = currentAnswer?.selected === opt.id;
                    const isCorrect = currentAnswer?.result?.correct_answer === opt.id;
                    const isWrong = selected && !currentAnswer?.result?.is_correct;
                    return (
                      <button key={opt.id}
                        onClick={() => submitAnswer(q.id, opt.id)}
                        disabled={!!currentAnswer}
                        className={clsx('w-full text-left px-4 py-3 rounded-lg border text-sm transition-all',
                          !currentAnswer ? 'hover:bg-ink-50 border-ink-200' :
                          isCorrect ? 'bg-green-50 border-green-400 text-green-800' :
                          isWrong ? 'bg-red-50 border-red-400 text-red-800' :
                          'border-ink-200 text-ink-400'
                        )}
                      >
                        <span className="font-mono text-xs text-ink-400 mr-2">{opt.id.toUpperCase()}.</span>
                        {opt.text}
                        {isCorrect && <CheckCircle size={14} className="inline ml-2 text-green-600" />}
                        {isWrong && <XCircle size={14} className="inline ml-2 text-red-600" />}
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
                    >Submit</button>
                  )}
                </div>
              )}

              {/* Code question */}
              {q.question_type === 'code' && (
                <div>
                  <textarea
                    id={`code-${q.id}`}
                    className="input h-36 resize-none font-mono text-xs w-full"
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
                <div className="mt-5 pt-5 border-t border-ink-100">
                  {currentAnswer.result.is_correct === true && (
                    <div className="flex items-center gap-2 text-sm text-green-700 mb-3">
                      <CheckCircle size={16} /> Correct! +{currentAnswer.result.score} points
                    </div>
                  )}
                  {currentAnswer.result.is_correct === false && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
                      <XCircle size={16} /> Incorrect
                    </div>
                  )}
                  {currentAnswer.result.is_correct === null && (
                    <div className="text-xs text-ink-500 mb-3">Answer recorded. Code/text answers are not auto-graded.</div>
                  )}
                  <button onClick={nextQuestion} className="btn-primary">
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
          <div className="max-w-lg mx-auto text-center py-12 animate-slide-up">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-3xl text-ink-900 mb-2">Session Complete!</h2>
            <div className="card p-6 my-6 text-left">
              {/* Current Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center mb-6">
                <div><div className="font-display text-3xl text-green-700">{correct}</div><div className="text-xs text-ink-500">Correct</div></div>
                <div><div className="font-display text-3xl text-red-600">{questions.length - correct}</div><div className="text-xs text-ink-500">Incorrect</div></div>
                <div><div className={clsx('font-display text-3xl', Math.round((correct / questions.length) * 100) >= 70 ? 'text-green-700' : Math.round((correct / questions.length) * 100) >= 40 ? 'text-amber-600' : 'text-red-600')}>{Math.round((correct / questions.length) * 100)}%</div><div className="text-xs text-ink-500">Score</div></div>
              </div>

              {/* Previous Best Score Comparison */}
              {(() => {
                const catStats = progress?.by_category?.find((c: any) => c.category === category);
                const currentScore = Math.round((correct / questions.length) * 100);
                if (!catStats || catStats.total_sessions <= 1) return null;
                const isBetter = currentScore > catStats.best_score;
                return (
                  <div className={clsx('rounded-xl p-4 border text-center', isBetter ? 'bg-green-50 border-green-200' : 'bg-ink-50 border-ink-200')}>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-ink-400 mb-1">Previous Best</div>
                    <div className="font-display text-2xl text-ink-700">{catStats.best_score}%</div>
                    {isBetter && <div className="text-xs text-green-600 font-medium mt-1">🏆 New personal best!</div>}
                    {!isBetter && <div className="text-xs text-ink-500 mt-1">Your best: {catStats.best_score}% • Avg: {catStats.avg_score}%</div>}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { loadInitialData(); startSession(category); }} className="btn-primary flex items-center gap-2">
                <RotateCcw size={14} /> Re-Test {CATEGORIES.find(c => c.value === category)?.label}
              </button>
              <button onClick={() => { loadInitialData(); setPhase('select'); }} className="btn-secondary">Practice Other</button>
              <button onClick={() => router.push('/candidate/progress')} className="btn-secondary">View Progress</button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

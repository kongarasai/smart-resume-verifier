'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { practiceAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ChevronLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function AssignmentClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    practiceAPI.getAssignmentQuestions(params.id)
      .then(r => setQuestions(r.data || []))
      .catch(() => toast.error('Failed to load assignment'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleMCQSelect = (qId: string, optId: string) => {
    if (done) return;
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleTextChange = (qId: string, value: string) => {
    if (done) return;
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const submitAll = async () => {
    if (Object.keys(answers).length === 0) {
      toast.error('Please answer at least one question');
      return;
    }
    setSubmitting(true);
    try {
      const res = await practiceAPI.submitAssignmentTest({
        assignment_id: params.id,
        answers: answers
      });
      
      const newResults: Record<string, any> = {};
      res.results.forEach((r: any) => {
        newResults[r.question_id] = r;
      });
      setResults(newResults);
      setDone(true);
      toast.success(`Assignment submitted! Score: ${res.percentage}% (${res.correctCount}/${questions.length})`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-ink-900 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl mx-auto pb-20">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-500 hover:text-ink-900 mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Practice
        </button>

        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900 mb-2">Assignment Questions</h1>
          <p className="text-ink-500">Attempt all questions below and submit at once.</p>
        </div>

        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="card p-6 border-l-4 border-l-ink-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-ink-900 text-white flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                <h3 className="font-display text-lg text-ink-900">{q.title}</h3>
                <div className="ml-auto flex gap-2">
                   <span className="badge badge-gray text-[10px] uppercase">{q.difficulty}</span>
                   <span className="badge badge-amber text-[10px] uppercase">{q.points} PTS</span>
                </div>
              </div>
              
              <p className="text-ink-700 text-sm mb-6 leading-relaxed whitespace-pre-wrap">{q.description}</p>

              {q.question_type === 'mcq' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(JSON.parse(typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []))).map((opt: any) => {
                    const isSelected = answers[q.id] === opt.id;
                    const res = results[q.id];
                    const isCorrect = res?.correct_answer === opt.id;
                    const isWrong = isSelected && res && !res.is_correct;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleMCQSelect(q.id, opt.id)}
                        disabled={done}
                        className={clsx(
                          'text-left p-3 rounded-xl border text-sm transition-all flex items-start gap-3',
                          !done ? (isSelected ? 'border-ink-900 bg-ink-50 ring-1 ring-ink-900' : 'border-ink-200 hover:border-ink-400') :
                          isCorrect ? 'border-green-500 bg-green-50 text-green-800' :
                          isWrong ? 'border-red-500 bg-red-50 text-red-800' : 'border-ink-100 text-ink-400'
                        )}
                      >
                        <span className="font-mono font-bold text-xs mt-0.5">{opt.id.toUpperCase()}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {done && isCorrect && <CheckCircle size={16} className="text-green-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'text' && (
                <textarea
                  className="input h-32 resize-none"
                  placeholder="Type your answer..."
                  value={answers[q.id] || ''}
                  onChange={e => handleTextChange(q.id, e.target.value)}
                  disabled={done}
                />
              )}

              {q.question_type === 'code' && (
                <textarea
                  className="input h-48 font-mono text-xs resize-none"
                  placeholder="// Paste your code solution here..."
                  value={answers[q.id] || ''}
                  onChange={e => handleTextChange(q.id, e.target.value)}
                  disabled={done}
                />
              )}

              {done && results[q.id] && (
                <div className="mt-4 p-3 rounded-lg bg-ink-25 border border-ink-100 text-xs flex items-center gap-2">
                   {results[q.id].is_correct ? (
                     <><CheckCircle size={14} className="text-green-600"/> <span className="text-green-700 font-medium">Correct!</span></>
                   ) : results[q.id].is_correct === false ? (
                     <><AlertCircle size={14} className="text-red-600"/> <span className="text-red-700 font-medium">Incorrect</span></>
                   ) : (
                     <><Clock size={14} className="text-amber-600"/> <span className="text-amber-700 font-medium">Recorded for review</span></>
                   )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!done && (
          <div className="fixed bottom-8 right-8 animate-slide-up">
            <button
              onClick={submitAll}
              disabled={submitting || questions.length === 0}
              className="btn-primary shadow-2xl py-4 px-10 text-lg rounded-2xl"
            >
              {submitting ? 'Submitting...' : 'Submit All Answers'}
            </button>
          </div>
        )}

        {done && (
          <div className="mt-12 text-center">
            <button onClick={() => router.push('/candidate/practice')} className="btn-primary">Return to Practice Dashboard</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

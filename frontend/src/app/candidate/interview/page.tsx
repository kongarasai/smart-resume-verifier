'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { mockInterviewAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Bot, MessageSquare, Send, Sparkles, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function MockInterviewPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [completed, setCompleted] = useState<any[]>([]);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [videoMode, setVideoMode] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    setEvaluation(null);
    setCompleted([]);
    try {
      const res = await mockInterviewAPI.getQuestions();
      setQuestions(res.data.questions || []);
      setCurrentIdx(0);
    } catch {
      toast.error('Failed to start interview. AI might be busy.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await mockInterviewAPI.getHistory();
      setHistory(res.data || []);
    } catch {}
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    try {
      const res = await mockInterviewAPI.evaluate({
        question: questions[currentIdx],
        answer: answer.trim()
      });
      setEvaluation(res.data);
      const newEntry = { 
        question: questions[currentIdx], 
        answer: answer.trim(), 
        score: res.data.score,
        strengths: res.data.strengths,
        improvements: res.data.improvements,
        model_hint: res.data.model_hint
      };
      setCompleted(prev => [...prev, newEntry]);

      // If it's the last question, save the session
      if (currentIdx === questions.length - 1) {
        const allFeedback = [...completed, newEntry];
        const avgScore = Math.round(allFeedback.reduce((a, b) => a + b.score, 0) / allFeedback.length);
        await mockInterviewAPI.saveSession({
          overall_score: avgScore,
          feedback: allFeedback,
          questions_count: allFeedback.length
        });
      }
    } catch {
      toast.error('Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setEvaluation(null);
    setAnswer('');
    setCurrentIdx(prev => prev + 1);
  };

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="animate-fade-in max-w-4xl mx-auto pb-20">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-2">AI Mock Interview</h1>
            <p className="text-ink-500 text-sm">Tailored technical interview practice based on your profile.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setVideoMode(!videoMode)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-semibold border transition-all",
                videoMode ? "bg-red-50 text-red-600 border-red-200" : "bg-ink-100 text-ink-600 border-ink-200"
              )}
            >
              {videoMode ? 'Disable Camera' : 'Enable Camera (Mock)'}
            </button>
            <button 
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
            >
              {showHistory ? 'Back to Interview' : 'View History'}
            </button>
          </div>
        </div>

        {videoMode && currentIdx !== -1 && currentIdx < questions.length && (
          <div className="mb-6 aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl border-4 border-white">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-ink-500 text-sm flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-ink-800 border-t-ink-500 animate-spin" />
                Connecting to Secure Stream...
              </div>
            </div>
            <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse">
              LIVE • RECORDING
            </div>
          </div>
        )}

        {showHistory ? (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-ink-900 mb-4">Past Sessions</h2>
            {history.length === 0 ? (
              <div className="card p-12 text-center text-ink-400">No sessions recorded yet.</div>
            ) : (
              history.map(h => (
                <div key={h.id} className="card p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-900">Session on {new Date(h.completed_at).toLocaleDateString()}</p>
                    <p className="text-xs text-ink-500">{h.questions_count} questions answered</p>
                  </div>
                  <div className={clsx(
                    "px-4 py-1.5 rounded-full text-sm font-bold",
                    h.overall_score >= 80 ? "bg-green-100 text-green-700" :
                    h.overall_score >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  )}>
                    {h.overall_score}/100
                  </div>
                </div>
              ))
            )}
          </div>
        ) : currentIdx === -1 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-ink-50 flex items-center justify-center mb-6 text-ink-900">
              <Bot size={48} />
            </div>
            <h2 className="text-xl font-bold text-ink-900 mb-3">Ready to test your skills?</h2>
            <p className="text-ink-500 max-w-md mx-auto mb-8 leading-relaxed">
              Our AI will analyze your verified skills and projects to generate a personalized 
              5-question technical interview.
            </p>
            <button 
              onClick={startInterview}
              disabled={loading}
              className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Start Interview <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        ) : currentIdx < questions.length ? (
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="flex items-center gap-2 mb-4">
              {questions.map((_, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                    i < currentIdx ? "bg-green-500" : i === currentIdx ? "bg-ink-900" : "bg-ink-100"
                  )}
                />
              ))}
            </div>

            <div className="card p-8 animate-slide-up">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-ink-100 text-ink-900 flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-xs text-ink-400 font-bold uppercase tracking-widest mb-1">Question {currentIdx + 1} of 5</p>
                  <h3 className="text-lg font-medium text-ink-900 leading-snug">{questions[currentIdx]}</h3>
                </div>
              </div>

              {!evaluation ? (
                <div className="space-y-4">
                  <textarea 
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    className="input w-full min-h-[160px] p-4 text-sm resize-none"
                    placeholder="Type your answer here... Be as detailed as possible."
                    disabled={evaluating}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={submitAnswer}
                      disabled={evaluating || !answer.trim()}
                      className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      {evaluating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Submit Answer <Send size={14} /></>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-ink-50 border border-ink-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-ink-900 font-semibold">
                        <CheckCircle2 size={18} className="text-green-600" />
                        AI Feedback
                      </div>
                      <div className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        evaluation.score >= 8 ? "bg-green-100 text-green-700" :
                        evaluation.score >= 5 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      )}>
                        Score: {evaluation.score}/10
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2">Strengths</p>
                        <p className="text-sm text-ink-700">{evaluation.strengths}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2">To Improve</p>
                        <p className="text-sm text-ink-700">{evaluation.improvements}</p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-xl border border-blue-50">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Sparkles size={10} /> Model Answer Hint
                      </p>
                      <p className="text-sm text-ink-600 italic leading-relaxed">{evaluation.model_hint}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={nextQuestion} className="btn-primary px-8 py-2.5 rounded-xl flex items-center gap-2">
                      {currentIdx === questions.length - 1 ? 'Finish Interview' : 'Next Question'} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-ink-900 mb-3">Interview Completed!</h2>
            <p className="text-ink-500 mb-8 max-w-md mx-auto">
              Great job! You've completed your AI-powered technical practice. 
              Review your summary below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="p-4 rounded-2xl border border-ink-100 text-left">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Average Score</p>
                <p className="text-2xl font-bold text-ink-900">
                  {Math.round(completed.reduce((a, b) => a + b.score, 0) / completed.length)}/10
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-ink-100 text-left">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Questions Answered</p>
                <p className="text-2xl font-bold text-ink-900">{completed.length}</p>
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="btn-secondary px-8 py-3 rounded-xl">
              Take Another Interview
            </button>
          </div>
        )}

        {/* Tips section */}
        {currentIdx !== -1 && currentIdx < questions.length && (
          <div className="mt-12 flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Tip:</strong> The AI evaluates both technical accuracy and your ability to explain concepts clearly. 
              Try to mention real-world examples from your verified projects!
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

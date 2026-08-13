'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { practiceAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Maximize2, Play, AlertOctagon, CheckCircle2, ChevronRight, List, Star } from 'lucide-react';
import clsx from 'clsx';

export default function LanguageClient({ params }: { params: { language: string } }) {
  const { user, isLoading, initFromStorage } = useAuthStore();
  const router = useRouter();
  const language = params.language;

  useEffect(() => { initFromStorage(); }, []);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState('// Write your code here...');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const [timer, setTimer] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [starred, setStarred] = useState<Set<number>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabRef = useRef(0);
  const gameOverRef = useRef(false);
  const isDoneRef = useRef(false);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          practiceAPI.startSession({ category: 'coding', limit: 50 }),
          practiceAPI.getStarred()
        ]);
        setQuestions(qRes.data.length > 0 ? qRes.data : []);
        setStarred(new Set((sRes.data || []).map((q: any) => q.id)));
      } catch {
        toast.error('Failed to load tasks');
      }
    };
    loadQuestions();
  }, [language]);

  const enforceFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      toast.error('Fullscreen access required for test environment.');
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isDoneRef.current && !gameOverRef.current) {
        tabRef.current += 1;
        setTabSwitches(tabRef.current);
        if (tabRef.current >= 3) {
          gameOverRef.current = true;
          setGameOver(true);
          toast.error('Test Terminated: Maximum tab switches exceeded.');
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        } else {
          toast.error('Warning: Tab switch detected! (' + tabRef.current + '/3 allowed)');
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    timerRef.current = setInterval(() => {
      if (!isDoneRef.current && !gameOverRef.current) {
        setTimer(t => t + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => { isDoneRef.current = isDone; }, [isDone]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const nextQ = () => { if (currentIdx < questions.length - 1) setCurrentIdx(c => c + 1); };
  const prevQ = () => { if (currentIdx > 0) setCurrentIdx(c => c - 1); };
  const toggleStar = async () => {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;
    try {
      await practiceAPI.toggleStar(qId);
      setStarred(s => {
        const next = new Set(s);
        next.has(qId) ? next.delete(qId) : next.add(qId);
        return next;
      });
      toast.success(starred.has(qId) ? 'Unstarred' : 'Starred');
    } catch {
      toast.error('Failed to update star');
    }
  };

  const runCode = async () => {
    if (gameOver) return;
    setIsRunning(true);
    try {
      const r = await practiceAPI.runCode({ language, code, test_input: '' });
      const out = r.data.compile_output || r.data.stderr || r.data.stdout || 'Program exited cleanly.';
      setOutput(out);
    } catch (e: any) {
      setOutput('Execution Error: ' + (e.response?.data?.error || e.message));
    }
    setIsRunning(false);
  };

  const submitSolution = async () => {
    if (!questions[currentIdx] || gameOver) return;
    try {
      await practiceAPI.submitAnswer({
        question_id: questions[currentIdx].id,
        submitted_answer: code,
        time_taken_seconds: timer,
      });
      toast.success('Solution Recorded!');
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setCode('// Write your code here...');
        setOutput('');
      } else {
        await practiceAPI.endSession({
          category: 'coding',
          question_ids: questions.map(q => q.id)
        });
        isDoneRef.current = true;
        setIsDone(true);
      }
    } catch {
      toast.error('Submission failed.');
    }
  };

  const minuteStr = String(Math.floor(timer / 60)).padStart(2, '0');
  const secondStr = String(timer % 60).padStart(2, '0');

  if (gameOver) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <AlertOctagon size={80} className="text-red-500 mb-6" />
          <h1 className="text-4xl font-display text-ink-900 mb-2">Test Terminated</h1>
          <p className="text-ink-600 max-w-md text-center">
            Anti-cheat protocol triggered. You exceeded the allowable tab-switch violations.
          </p>
          <button
            onClick={() => router.push('/candidate/practice')}
            className="btn-primary mt-8"
          >
            Return Home
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const q = questions[currentIdx];

  const difficultyClass = q
    ? q.difficulty === 'easy'
      ? 'text-green-400'
      : q.difficulty === 'medium'
      ? 'text-amber-400'
      : 'text-red-400'
    : '';

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col text-white">
      <header className="flex items-center justify-between px-6 py-3 border-b border-ink-800 bg-ink-900 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-xl text-ink-100 flex items-center gap-2">
            <span className="uppercase text-amber-500">{language}</span> Sandbox
          </h1>
          <div className="h-4 w-px bg-ink-700" />
          <span className="text-sm font-mono text-ink-400">
            Question {currentIdx + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-ink-300 font-mono text-sm">
            <span>Time:</span>
            <span className="text-ink-100">{minuteStr}:{secondStr}</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertOctagon size={16} /> Violations: {tabSwitches}/3
          </div>
          {!isFullscreen && (
            <button
              onClick={enforceFullscreen}
              className="flex items-center gap-1 border border-ink-700 text-ink-300 hover:text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              <Maximize2 size={12} className="mr-1" /> Enter Fullscreen
            </button>
          )}
        </div>
      </header>

      {isDone ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <CheckCircle2 size={70} className="text-green-500 mb-6" />
          <h2 className="text-3xl font-display mb-2">Test Completed</h2>
          <p className="text-ink-400 mb-8">
            Your solutions have been captured for review.
          </p>
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
              router.push('/candidate/practice');
            }}
            className="px-6 py-3 bg-white text-ink-900 rounded-lg hover:bg-ink-100 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[35%] border-r border-ink-800 bg-ink-950 flex flex-col overflow-y-auto">
            {q ? (
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <span className={clsx('text-xs font-medium px-2 py-1 rounded bg-ink-800', difficultyClass)}>
                    {q.difficulty?.toUpperCase()}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-ink-800 text-ink-400">
                    {q.points} PTS
                  </span>
                  <button 
                    onClick={toggleStar} 
                    className={clsx('ml-auto text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1', 
                      starred.has(q.id) ? 'bg-amber-900/30 text-amber-400 border-amber-700/50' : 'bg-ink-800 text-ink-400 border-transparent hover:text-white')}
                  >
                    <Star size={12} className={starred.has(q.id) ? "fill-amber-400" : ""} /> Star
                  </button>
                </div>
                <h2 className="text-2xl font-display mb-4 text-ink-100">{q.title}</h2>
                <div className="text-ink-300 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                  {q.description}
                </div>
                
                <div className="mt-8 pt-6 border-t border-ink-800 flex items-center justify-between">
                   <button 
                     onClick={prevQ}
                     disabled={currentIdx === 0}
                     className="px-3 py-1.5 rounded bg-ink-800 text-ink-300 hover:text-white text-sm disabled:opacity-30 disabled:hover:text-ink-300 transition-colors"
                   >
                     &larr; Prev
                   </button>
                   <button 
                     onClick={nextQ}
                     disabled={currentIdx === questions.length - 1}
                     className="px-3 py-1.5 rounded bg-ink-800 text-ink-300 hover:text-white text-sm disabled:opacity-30 disabled:hover:text-ink-300 transition-colors"
                   >
                     Next &rarr;
                   </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-ink-500 font-mono text-sm animate-pulse">
                Loading problem...
              </div>
            )}
          </div>

          <div className="w-[65%] flex flex-col bg-ink-900 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={language.toLowerCase() === 'c++' ? 'cpp' : language.toLowerCase() === 'c#' ? 'csharp' : language.toLowerCase()}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 16 },
                }}
              />
            </div>

            <div className="h-[38%] bg-[#1e1e1e] flex flex-col shrink-0 border-t border-ink-800">
              <div className="flex items-center justify-between px-4 py-2 border-b border-ink-800 bg-ink-900">
                <span className="font-mono text-xs text-ink-400 flex items-center gap-2">
                  <List size={14} /> TERMINAL
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex items-center gap-1 bg-ink-800 hover:bg-ink-700 text-ink-200 text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <Play size={12} /> {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                  <button
                    onClick={submitSolution}
                    disabled={isRunning}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    Submit <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 font-mono text-sm text-ink-300 overflow-y-auto whitespace-pre-wrap">
                {output ? output : <span className="opacity-40 italic">{'// Run your code to see output...'}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

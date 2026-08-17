import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  RotateCcw,
  BarChart2,
  Trophy,
  History,
  Sparkles,
  Layers,
  Code2,
  AlertCircle,
  ArrowLeft,
  Home,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

type Phase = 'select' | 'quiz' | 'done';

const CATEGORIES = [
  { value: 'coding', label: 'Coding', emoji: '💻', desc: 'Data structures & algorithms' },
  { value: 'aptitude', label: 'Aptitude', emoji: '🧮', desc: 'Logical reasoning & math' },
  { value: 'technical_mcq', label: 'Technical MCQ', emoji: '⚙️', desc: 'CS concepts & system design' },
  { value: 'hr', label: 'HR Questions', emoji: '🤝', desc: 'Behavioral & soft skills' },
];

export default function PracticeScreen({ navigation }: any) {
  const [phase, setPhase] = useState<Phase>('select');
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string; result: any }>>({});
  const [progress, setProgress] = useState<any>(null);
  const [data, setData] = useState<{ groups: any[]; assignments: any[] }>({ groups: [], assignments: [] });
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<any>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [progRes, assignRes, starredRes, histRes] = await Promise.allSettled([
        apiClient.get('/practice/progress'),
        apiClient.get('/practice/assignments'),
        apiClient.get('/practice/starred'),
        apiClient.get('/practice/history'),
      ]);

      if (progRes.status === 'fulfilled') setProgress(progRes.value.data);
      if (assignRes.status === 'fulfilled') setData(assignRes.value.data || { groups: [], assignments: [] });
      if (starredRes.status === 'fulfilled') {
        const starIds = new Set<string>((starredRes.value.data || []).map((q: any) => String(q.id)));
        setStarred(starIds);
      }
      if (histRes.status === 'fulfilled') setSessionHistory(histRes.value.data || []);
    } catch (err) {
      console.log('Error loading practice data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
  };

  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, idx]);

  const handleCategoryClick = (cat: string) => {
    if (cat === 'coding') {
      navigation?.navigate('CodingLanguages');
    } else {
      startSession(cat);
    }
  };

  const startSession = async (cat: string, tag?: string) => {
    setLoading(true);
    setCategory(cat);
    try {
      const res = await apiClient.post('/practice/start', { category: cat, tag });
      setQuestions(res.data || []);
      setIdx(0);
      setAnswers({});
      setTimer(0);
      setTextAnswer('');
      setCodeAnswer('');
      setPhase('quiz');
    } catch (err) {
      Alert.alert('Error', 'Failed to load practice questions');
    } finally {
      setLoading(false);
    }
  };

  const startAssignment = async (groupId: string, assignmentId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/practice/assignments/${groupId}?assignmentId=${assignmentId}`);
      setQuestions(res.data || []);
      setIdx(0);
      setAnswers({});
      setTimer(0);
      setTextAnswer('');
      setCodeAnswer('');
      setCategory('assignment');
      setPhase('quiz');
    } catch (err) {
      Alert.alert('Error', 'Failed to load assignment questions');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (qId: string, answer: string) => {
    if (answers[qId]) return;
    try {
      const res = await apiClient.post('/practice/submit', {
        question_id: qId,
        submitted_answer: answer,
        time_taken_seconds: timer,
      });
      setAnswers((prev) => ({
        ...prev,
        [qId]: { selected: answer, result: res.data },
      }));
    } catch (err) {
      Alert.alert('Error', 'Failed to submit answer');
    }
  };

  const nextQuestion = () => {
    setTimer(0);
    setTextAnswer('');
    setCodeAnswer('');
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      endSession();
    }
  };

  const toggleStar = async (qId: string) => {
    if (!qId) return;
    try {
      await apiClient.post('/practice/toggle-star', { question_id: qId });
      setStarred((prev) => {
        const next = new Set(prev);
        if (next.has(qId)) next.delete(qId);
        else next.add(qId);
        return next;
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update star');
    }
  };

  const confirmEndSessionEarly = () => {
    const answeredCount = Object.keys(answers).length;
    Alert.alert(
      'End Practice Session?',
      `Are you sure you want to end this test now? Your ${answeredCount} answered question${answeredCount !== 1 ? 's' : ''} will be submitted and scored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End & Submit', style: 'destructive', onPress: endSession },
      ]
    );
  };

  const endSession = async () => {
    try {
      const answeredQIds = Object.keys(answers);
      const qIds = answeredQIds.length > 0 ? answeredQIds : questions.slice(0, idx + 1).map((q) => q.id);
      await apiClient.post('/practice/end', { category, question_ids: qIds });
      const progressRes = await apiClient.get('/practice/progress');
      setProgress(progressRes.data);
      const histRes = await apiClient.get('/practice/history');
      setSessionHistory(histRes.data || []);
      setPhase('done');
    } catch (err) {
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
    setTextAnswer('');
    setCodeAnswer('');
    loadInitialData();
  };

  const q = questions[idx];
  const currentAnswer = q ? answers[q.id] : null;
  const correctCount = Object.values(answers).filter((a: any) => a.result?.is_correct).length;
  const totalAttempted = Object.keys(answers).length > 0 ? Object.keys(answers).length : 1;
  const now = new Date();
  const activeAssignments = (data.assignments || []).filter(
    (a) => !a.expires_at || new Date(a.expires_at) > now
  );

  return (
    <DashboardLayout title="Practice">
      {/* PHASE 1: SELECT CATEGORY & ASSIGNMENTS */}
      {phase === 'select' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.pageHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Practice</Text>
              <Text style={styles.headerSubtitle}>
                Answer real questions to build your skill evidence score.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.btnProgress}
              onPress={() => navigation?.navigate('Progress')}
              activeOpacity={0.8}
            >
              <BarChart2 size={14} color="#0f172a" />
              <Text style={styles.btnProgressText}>My Progress</Text>
            </TouchableOpacity>
          </View>

          {/* Targeted Assignments */}
          {activeAssignments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Star size={16} color="#d97706" fill="#d97706" />
                <Text style={styles.sectionTitle}>Targeted Assignments</Text>
              </View>
              <View style={styles.assignmentList}>
                {activeAssignments.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.assignmentCard}
                    onPress={() => startAssignment(a.group_id, a.id)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignmentName}>{a.name}</Text>
                      <View style={styles.assignmentMetaRow}>
                        <Text style={styles.assignmentMetaText}>{a.question_count} questions</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.assignmentMetaText}>
                          {data.groups?.find((g) => g.id === a.group_id)?.name || 'Group'}
                        </Text>
                        {a.expires_at ? (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <View style={styles.expiresRow}>
                              <Clock size={10} color="#d97706" />
                              <Text style={styles.expiresText}>
                                {new Date(a.expires_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.assignmentChevron}>
                      <ChevronRight size={14} color="#d97706" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Enrolled Groups */}
          {data.groups && data.groups.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BookOpen size={16} color="#475569" />
                <Text style={styles.sectionTitle}>Your Groups</Text>
              </View>
              <View style={styles.groupsList}>
                {data.groups.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.groupCard}
                    onPress={() => navigation?.navigate('Assignments', { groupId: g.id })}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupName}>{g.name}</Text>
                      <Text style={styles.groupMeta}>{g.total_question_count || 0} questions available</Text>
                    </View>
                    <ChevronRight size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quick Practice Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart2 size={16} color="#475569" />
              <Text style={styles.sectionTitle}>4 Practice Categories</Text>
            </View>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => {
                const catStats = progress?.by_category?.find((c: any) => c.category === cat.value);
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={styles.catCard}
                    onPress={() => handleCategoryClick(cat.value)}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <View style={styles.catTopRow}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      {catStats ? (
                        <View style={styles.catStatsPills}>
                          <View style={styles.lastScorePill}>
                            <Text style={styles.lastScoreText}>Last: {catStats.last_score}%</Text>
                          </View>
                          <View style={styles.bestScorePill}>
                            <Trophy size={9} color="#b45309" />
                            <Text style={styles.bestScoreText}>{catStats.best_score}%</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={styles.catDesc}>{cat.desc}</Text>

                    <View style={styles.catFooter}>
                      <View style={styles.startSessionRow}>
                        <Text style={styles.startSessionText}>Start session</Text>
                        <ChevronRight size={12} color="#64748b" />
                      </View>
                      {catStats ? (
                        <Text style={styles.sessionCountText}>
                          {catStats.total_sessions} session{catStats.total_sessions !== 1 ? 's' : ''}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recent Session History */}
          {sessionHistory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <History size={16} color="#475569" />
                <Text style={styles.sectionTitle}>Recent Sessions</Text>
              </View>
              <View style={styles.historyCard}>
                {sessionHistory.slice(0, 8).map((s: any, i: number) => {
                  const pct = s.score_percentage || 0;
                  const scoreColor = pct >= 70 ? '#15803d' : pct >= 40 ? '#d97706' : '#dc2626';
                  return (
                    <View
                      key={s.id || i}
                      style={[
                        styles.historyRow,
                        i === sessionHistory.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyCategory}>
                          {String(s.category || 'Practice').replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.historyDate}>
                          {s.completed_at
                            ? new Date(s.completed_at).toLocaleDateString()
                            : 'Completed'}
                        </Text>
                      </View>
                      <View style={styles.historyResultBox}>
                        <Text style={styles.historyResultText}>
                          {s.correct_answers || 0}/{s.total_questions || 0}
                        </Text>
                      </View>
                      <View style={[styles.historyScoreBadge, { backgroundColor: `${scoreColor}15` }]}>
                        <Text style={[styles.historyScoreText, { color: scoreColor }]}>
                          {pct}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* PHASE 2: QUIZ / TEST MODE */}
      {phase === 'quiz' && q && (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Top Exit & Controls Header */}
          <View style={styles.quizTopNav}>
            <TouchableOpacity
              style={styles.btnExitExam}
              onPress={confirmEndSessionEarly}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color="#475569" />
              <Text style={styles.btnExitExamText}>Exit / End Test</Text>
            </TouchableOpacity>

            <View style={styles.timerBox}>
              <Clock size={13} color="#475569" />
              <Text style={styles.timerText}>
                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={confirmEndSessionEarly}
              style={styles.btnFinishTop}
              activeOpacity={0.7}
            >
              <Text style={styles.btnFinishTopText}>Finish Early</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Header */}
          <View style={styles.quizHeader}>
            <View style={styles.quizProgressBar}>
              <View
                style={[
                  styles.quizProgressFill,
                  { width: `${((idx + 1) / questions.length) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.quizMetaRow}>
              <Text style={styles.qNumText}>
                Question {idx + 1} of {questions.length}
              </Text>
              <Text style={styles.answeredCountText}>
                {Object.keys(answers).length} answered
              </Text>
            </View>
          </View>

          {/* Question Card */}
          <View style={styles.card}>
            {/* Meta tags & Star */}
            <View style={styles.questionMetaRow}>
              <View
                style={[
                  styles.diffBadge,
                  q.difficulty === 'easy'
                    ? styles.diffEasy
                    : q.difficulty === 'hard'
                    ? styles.diffHard
                    : styles.diffMedium,
                ]}
              >
                <Text
                  style={[
                    styles.diffBadgeText,
                    q.difficulty === 'easy'
                      ? styles.diffTextEasy
                      : q.difficulty === 'hard'
                      ? styles.diffTextHard
                      : styles.diffTextMedium,
                  ]}
                >
                  {(q.difficulty || 'Medium').toUpperCase()}
                </Text>
              </View>
              {q.category ? (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{q.category}</Text>
                </View>
              ) : null}
              {q.question_type ? (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{q.question_type}</Text>
                </View>
              ) : null}

              {/* Star / Bookmark */}
              <TouchableOpacity
                style={[
                  styles.btnStar,
                  starred.has(String(q.id)) && styles.btnStarActive,
                ]}
                onPress={() => toggleStar(String(q.id))}
                activeOpacity={0.8}
              >
                <Star
                  size={16}
                  color={starred.has(String(q.id)) ? '#d97706' : '#cbd5e1'}
                  fill={starred.has(String(q.id)) ? '#d97706' : 'none'}
                />
              </TouchableOpacity>
            </View>

            {/* Question Title & Description */}
            <Text style={styles.qTitle}>{q.title}</Text>
            {q.description ? <Text style={styles.qDesc}>{q.description}</Text> : null}

            {/* MCQ Options */}
            {(!q.question_type || q.question_type === 'mcq') && q.options && (
              <View style={styles.optionsList}>
                {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map(
                  (opt: any) => {
                    const isSelected = currentAnswer?.selected === opt.id;
                    const isCorrect = currentAnswer?.result?.correct_answer === opt.id;
                    const isWrong = isSelected && !currentAnswer?.result?.is_correct;

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.optionBtn,
                          !currentAnswer && styles.optionBtnDefault,
                          isCorrect && styles.optionBtnCorrect,
                          isWrong && styles.optionBtnWrong,
                        ]}
                        onPress={() => submitAnswer(q.id, opt.id)}
                        disabled={!!currentAnswer}
                        activeOpacity={0.8}
                      >
                        <View style={styles.optionLetterBox}>
                          <Text style={styles.optionLetterText}>{opt.id?.toUpperCase()}.</Text>
                        </View>
                        <Text
                          style={[
                            styles.optionText,
                            isCorrect && styles.optionTextCorrect,
                            isWrong && styles.optionTextWrong,
                          ]}
                        >
                          {opt.text}
                        </Text>
                        {isCorrect && <CheckCircle size={16} color="#16a34a" style={{ marginLeft: 8 }} />}
                        {isWrong && <XCircle size={16} color="#dc2626" style={{ marginLeft: 8 }} />}
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            )}

            {/* Text Answer */}
            {q.question_type === 'text' && (
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Type your explanation or response here..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  value={textAnswer}
                  onChangeText={setTextAnswer}
                  editable={!currentAnswer}
                />
                {!currentAnswer && (
                  <TouchableOpacity
                    style={styles.btnSubmitAnswer}
                    onPress={() => submitAnswer(q.id, textAnswer || '(submitted)')}
                  >
                    <Text style={styles.btnSubmitAnswerText}>Submit Response</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Code Answer */}
            {q.question_type === 'code' && (
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.textArea, styles.codeArea]}
                  placeholder="// Write your code solution here..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={6}
                  value={codeAnswer}
                  onChangeText={setCodeAnswer}
                  editable={!currentAnswer}
                />
                {!currentAnswer && (
                  <TouchableOpacity
                    style={styles.btnSubmitAnswer}
                    onPress={() => submitAnswer(q.id, codeAnswer || '(submitted)')}
                  >
                    <Text style={styles.btnSubmitAnswerText}>Submit Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Result Feedback & Next Button */}
            {currentAnswer && (
              <View style={styles.resultFeedbackBox}>
                {currentAnswer.result?.is_correct === true && (
                  <View style={styles.feedbackRow}>
                    <CheckCircle size={16} color="#16a34a" />
                    <Text style={styles.feedbackCorrectText}>
                      Correct! +{currentAnswer.result.score || 10} points
                    </Text>
                  </View>
                )}
                {currentAnswer.result?.is_correct === false && (
                  <View style={styles.feedbackRow}>
                    <XCircle size={16} color="#dc2626" />
                    <Text style={styles.feedbackWrongText}>Incorrect answer</Text>
                  </View>
                )}
                {currentAnswer.result?.is_correct === null && (
                  <Text style={styles.feedbackNeutralText}>
                    Answer submitted. Written/code responses are logged for verification.
                  </Text>
                )}

                <TouchableOpacity style={styles.btnNext} onPress={nextQuestion} activeOpacity={0.85}>
                  <Text style={styles.btnNextText}>
                    {idx < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                  </Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom End Test Control */}
          <TouchableOpacity
            style={styles.btnEndBottom}
            onPress={confirmEndSessionEarly}
            activeOpacity={0.7}
          >
            <AlertCircle size={14} color="#dc2626" />
            <Text style={styles.btnEndBottomText}>End Test & Submit Current Answers</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* PHASE 3: SESSION DONE / SCORECARD */}
      {phase === 'done' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.doneContent}>
          {/* Top Quick Return Header */}
          <View style={styles.doneTopHeader}>
            <TouchableOpacity
              style={styles.btnBackTop}
              onPress={resetToSelect}
              activeOpacity={0.8}
            >
              <ArrowLeft size={16} color="#1e293b" />
              <Text style={styles.btnBackTopText}>Back to Practice Categories</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Session Complete!</Text>
          <Text style={styles.doneSubtitle}>
            Great job! Your answers have been recorded and your skills score is updated.
          </Text>

          {/* Results Summary Card */}
          <View style={styles.card}>
            <View style={styles.scoreStatsRow}>
              <View style={styles.scoreStatCol}>
                <Text style={[styles.scoreStatNum, { color: '#16a34a' }]}>{correctCount}</Text>
                <Text style={styles.scoreStatLabel}>Correct</Text>
              </View>
              <View style={styles.scoreStatDivider} />
              <View style={styles.scoreStatCol}>
                <Text style={[styles.scoreStatNum, { color: '#dc2626' }]}>
                  {Math.max(0, totalAttempted - correctCount)}
                </Text>
                <Text style={styles.scoreStatLabel}>Incorrect</Text>
              </View>
              <View style={styles.scoreStatDivider} />
              <View style={styles.scoreStatCol}>
                {(() => {
                  const scorePct = Math.round((correctCount / totalAttempted) * 100);
                  const color = scorePct >= 70 ? '#16a34a' : scorePct >= 40 ? '#d97706' : '#dc2626';
                  return (
                    <>
                      <Text style={[styles.scoreStatNum, { color }]}>{scorePct}%</Text>
                      <Text style={styles.scoreStatLabel}>Score</Text>
                    </>
                  );
                })()}
              </View>
            </View>

            {/* Personal Best Comparison */}
            {(() => {
              const catStats = progress?.by_category?.find((c: any) => c.category === category);
              const currentScore = Math.round((correctCount / totalAttempted) * 100);
              if (!catStats || catStats.total_sessions <= 1) return null;
              const isBetter = currentScore > (catStats.best_score || 0);

              return (
                <View
                  style={[
                    styles.bestComparisonBox,
                    isBetter ? styles.bestComparisonBetter : styles.bestComparisonNeutral,
                  ]}
                >
                  <Text style={styles.bestCompHeader}>PREVIOUS BEST</Text>
                  <Text style={styles.bestCompNum}>{catStats.best_score}%</Text>
                  {isBetter ? (
                    <Text style={styles.bestCompBetterText}>🏆 New personal best score!</Text>
                  ) : (
                    <Text style={styles.bestCompNeutralText}>
                      Your best: {catStats.best_score}% • Avg: {catStats.avg_score}%
                    </Text>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Action Buttons */}
          <View style={styles.doneActions}>
            <TouchableOpacity
              style={styles.btnPrimaryAction}
              onPress={() => {
                loadInitialData();
                startSession(category);
              }}
              activeOpacity={0.85}
            >
              <RotateCcw size={16} color="#fff" />
              <Text style={styles.btnPrimaryActionText}>
                Re-Test {CATEGORIES.find((c) => c.value === category)?.label || 'Practice'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondaryAction}
              onPress={resetToSelect}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryActionText}>Practice Other Category</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondaryAction}
              onPress={() => navigation?.navigate('Progress')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryActionText}>View Progress & Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnOutlineAction}
              onPress={() => navigation?.navigate('Dashboard')}
              activeOpacity={0.85}
            >
              <Home size={15} color="#475569" />
              <Text style={styles.btnOutlineActionText}>Exit to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 50 },
  doneContent: { padding: 20, alignItems: 'center', paddingBottom: 60 },

  doneTopHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  btnBackTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnBackTopText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 3 },
  btnProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnProgressText: { fontSize: 12, fontWeight: '600', color: '#0f172a' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },

  assignmentList: { gap: 10 },
  assignmentCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignmentName: { fontSize: 14, fontWeight: 'bold', color: '#78350f' },
  assignmentMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  assignmentMetaText: { fontSize: 11, color: '#92400e', fontWeight: '500' },
  metaDot: { fontSize: 11, color: '#b45309', marginHorizontal: 4 },
  expiresRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiresText: { fontSize: 11, color: '#b45309', fontWeight: '600' },
  assignmentChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  groupsList: { gap: 8 },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  groupMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },

  catGrid: { gap: 12 },
  catCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catEmoji: { fontSize: 26 },
  catStatsPills: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lastScorePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lastScoreText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  bestScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bestScoreText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
  catLabel: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  catDesc: { fontSize: 13, color: '#64748b', marginTop: 3 },
  catFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  startSessionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  startSessionText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  sessionCountText: { fontSize: 11, color: '#94a3b8' },

  historyCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyCategory: { fontSize: 13, fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' },
  historyDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  historyResultBox: { paddingHorizontal: 10 },
  historyResultText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  historyScoreBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  historyScoreText: { fontSize: 12, fontWeight: 'bold' },

  /* QUIZ STYLES */
  quizTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  btnExitExam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  btnExitExamText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  btnFinishTop: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  btnFinishTopText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },

  quizHeader: { marginBottom: 16 },
  quizProgressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  quizProgressFill: {
    height: '100%',
    backgroundColor: '#0f172a',
  },
  quizMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qNumText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  answeredCountText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: { fontSize: 12, fontWeight: '600', color: '#475569', fontFamily: 'monospace' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  questionMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffEasy: { backgroundColor: '#dcfce7' },
  diffMedium: { backgroundColor: '#fef3c7' },
  diffHard: { backgroundColor: '#fee2e2' },
  diffBadgeText: { fontSize: 10, fontWeight: 'bold' },
  diffTextEasy: { color: '#15803d' },
  diffTextMedium: { color: '#b45309' },
  diffTextHard: { color: '#b91c1c' },
  tagBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagBadgeText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  btnStar: { marginLeft: 'auto', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  btnStarActive: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },

  qTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, lineHeight: 24 },
  qDesc: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 },

  optionsList: { gap: 10, marginTop: 4 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionBtnDefault: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  optionBtnCorrect: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  optionBtnWrong: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  optionLetterBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionLetterText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  optionText: { flex: 1, fontSize: 13, color: '#334155' },
  optionTextCorrect: { color: '#166534', fontWeight: '600' },
  optionTextWrong: { color: '#991b1b', fontWeight: '600' },

  inputWrap: { marginTop: 8 },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
  },
  codeArea: { backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'monospace' },
  btnSubmitAnswer: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnSubmitAnswerText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  resultFeedbackBox: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  feedbackCorrectText: { fontSize: 13, fontWeight: 'bold', color: '#15803d' },
  feedbackWrongText: { fontSize: 13, fontWeight: 'bold', color: '#dc2626' },
  feedbackNeutralText: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  btnNext: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnNextText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  btnEndBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 10,
  },
  btnEndBottomText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },

  /* DONE STYLES */
  doneEmoji: { fontSize: 44, marginBottom: 8 },
  doneTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  doneSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 },

  scoreStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 10 },
  scoreStatCol: { alignItems: 'center' },
  scoreStatNum: { fontSize: 26, fontWeight: 'bold' },
  scoreStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },
  scoreStatDivider: { width: 1, height: 36, backgroundColor: '#f1f5f9' },

  bestComparisonBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  bestComparisonBetter: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  bestComparisonNeutral: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  bestCompHeader: { fontSize: 9, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  bestCompNum: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginVertical: 2 },
  bestCompBetterText: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  bestCompNeutralText: { fontSize: 11, color: '#64748b' },

  doneActions: { width: '100%', gap: 10, marginTop: 18 },
  btnPrimaryAction: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnPrimaryActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnSecondaryAction: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnSecondaryActionText: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  btnOutlineAction: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnOutlineActionText: { color: '#475569', fontSize: 13, fontWeight: '600' },
});

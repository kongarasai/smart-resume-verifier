import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Bot,
  MessageSquare,
  Send,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Video,
  VideoOff,
  History,
  RotateCcw,
  Award,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InterviewScreen() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [completed, setCompleted] = useState<any[]>([]);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [videoMode, setVideoMode] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    setEvaluation(null);
    setCompleted([]);
    setAnswer('');
    setShowHistory(false);
    try {
      const res = await apiClient.get('/mock-interview/questions');
      const qList = Array.isArray(res.data?.questions)
        ? res.data.questions
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (qList.length > 0) {
        setQuestions(qList);
        setCurrentIdx(0);
      } else {
        setQuestions([
          'Can you walk me through the architecture of your most challenging technical project?',
          'How do you identify and resolve critical performance bottlenecks and memory leaks?',
          'Describe a scenario where you had to refactor complex legacy code under tight deadlines.',
          'How do you design scalable APIs and maintain secure authentication in production?',
          'What is your approach to automated testing and zero-downtime deployment pipelines?',
        ]);
        setCurrentIdx(0);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Failed to generate AI questions. Using standard technical interview questions.');
      setQuestions([
        'Can you walk me through the architecture of your most challenging technical project?',
        'How do you identify and resolve critical performance bottlenecks and memory leaks?',
        'Describe a scenario where you had to refactor complex legacy code under tight deadlines.',
        'How do you design scalable APIs and maintain secure authentication in production?',
        'What is your approach to automated testing and zero-downtime deployment pipelines?',
      ]);
      setCurrentIdx(0);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get('/mock-interview/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    try {
      const currentQ = questions[currentIdx] || 'Technical Question';
      const res = await apiClient.post('/mock-interview/evaluate', {
        question: currentQ,
        answer: answer.trim(),
      });

      const evalData = res.data || {
        score: 8,
        strengths: 'Structured response with good technical clarity.',
        improvements: 'Consider highlighting performance metrics and edge-case handling.',
        model_hint: 'Use the STAR method with specific architectural details.',
      };

      setEvaluation(evalData);
      const newEntry = {
        question: currentQ,
        answer: answer.trim(),
        score: typeof evalData.score === 'number' ? evalData.score : 8,
        strengths: evalData.strengths,
        improvements: evalData.improvements,
        model_hint: evalData.model_hint,
      };

      const updatedCompleted = [...completed, newEntry];
      setCompleted(updatedCompleted);

      // If it's the last question, auto-save session
      if (currentIdx === questions.length - 1) {
        const totalScore = updatedCompleted.reduce((sum, item) => sum + (item.score || 8), 0);
        const avgScore = Math.round((totalScore / updatedCompleted.length) * 10);
        apiClient
          .post('/mock-interview/session', {
            overall_score: avgScore,
            feedback: updatedCompleted,
            questions_count: updatedCompleted.length,
          })
          .catch(() => {});
      }
    } catch {
      Alert.alert('Error', 'Failed to evaluate answer. Please try submitting again.');
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentIdx === questions.length - 1) {
      setCurrentIdx(questions.length); // triggers completed screen
    } else {
      setEvaluation(null);
      setAnswer('');
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <DashboardLayout title="AI Mock Interview">
      <View style={styles.container}>
        {/* Header Action Bar */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.actionBtn, videoMode && styles.actionBtnActive]}
            onPress={() => setVideoMode(!videoMode)}
          >
            {videoMode ? <VideoOff size={14} color="#dc2626" /> : <Video size={14} color="#475569" />}
            <Text style={[styles.actionBtnText, videoMode && { color: '#dc2626' }]}>
              {videoMode ? 'Disable Video' : 'Video Mode (Mock)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, showHistory && styles.actionBtnPrimary]}
            onPress={() => {
              if (!showHistory) loadHistory();
              setShowHistory(!showHistory);
            }}
          >
            <History size={14} color={showHistory ? '#fff' : '#475569'} />
            <Text style={[styles.actionBtnText, showHistory && { color: '#fff' }]}>
              {showHistory ? 'Interview' : 'Past Sessions'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Mode Simulation Box */}
        {videoMode && currentIdx !== -1 && currentIdx < questions.length && (
          <View style={styles.cameraBox}>
            <View style={styles.cameraLiveTag}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>LIVE • CAMERA ACTIVE</Text>
            </View>
            <View style={styles.cameraInner}>
              <Bot size={40} color="#94a3b8" />
              <Text style={styles.cameraPlaceholder}>Simulated Candidate Video Feed</Text>
            </View>
          </View>
        )}

        {/* 1. History View */}
        {showHistory ? (
          <View style={styles.historyContainer}>
            <Text style={styles.sectionHeading}>Past Interview Sessions</Text>
            {historyLoading ? (
              <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 40 }} />
            ) : history.length === 0 ? (
              <View style={styles.emptyCard}>
                <History size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Recorded Sessions</Text>
                <Text style={styles.emptySubtitle}>Complete an AI mock interview to track your score history.</Text>
              </View>
            ) : (
              history.map((h, i) => (
                <View key={h.id || i} style={styles.historyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>
                      Session on{' '}
                      {h.completed_at && !isNaN(new Date(h.completed_at).getTime())
                        ? new Date(h.completed_at).toLocaleDateString()
                        : 'Recent'}
                    </Text>
                    <Text style={styles.historySub}>
                      {h.questions_count || (h.feedback ? h.feedback.length : 5)} questions answered
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.scoreTag,
                      {
                        backgroundColor:
                          (h.overall_score || 80) >= 80
                            ? '#dcfce7'
                            : (h.overall_score || 80) >= 50
                            ? '#dbeafe'
                            : '#fee2e2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreTagText,
                        {
                          color:
                            (h.overall_score || 80) >= 80
                              ? '#15803d'
                              : (h.overall_score || 80) >= 50
                              ? '#1d4ed8'
                              : '#b91c1c',
                        },
                      ]}
                    >
                      {h.overall_score || 80}/100
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : currentIdx === -1 ? (
          /* 2. Start Screen */
          <View style={styles.startBox}>
            <View style={styles.botIcon}>
              <Bot size={54} color="#0f172a" />
            </View>
            <Text style={styles.startTitle}>Ready for your Interview?</Text>
            <Text style={styles.startDesc}>
              Our AI analyzes your verified skills, projects, and resume to generate 5 tailored technical
              interview questions.
            </Text>

            <TouchableOpacity style={styles.btnPrimary} onPress={startInterview} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.btnTextWhite}>Start Interview</Text>
                  <ChevronRight size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.tipBox}>
              <AlertCircle size={16} color="#3b82f6" style={{ marginTop: 2 }} />
              <Text style={styles.tipText}>
                <Text style={{ fontWeight: 'bold' }}>Tip: </Text>
                Structure your answers clearly. Mention trade-offs, algorithms, and real examples from your projects!
              </Text>
            </View>
          </View>
        ) : currentIdx < questions.length ? (
          /* 3. Active Question & Feedback Screen */
          <View style={styles.quizBox}>
            {/* Progress Dots */}
            <View style={styles.progressRow}>
              {questions.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < currentIdx ? styles.dotDone : i === currentIdx ? styles.dotActive : null,
                  ]}
                />
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.qHeader}>
                <MessageSquare size={16} color="#0f172a" />
                <Text style={styles.qLabel}>
                  QUESTION {currentIdx + 1} OF {questions.length}
                </Text>
              </View>
              <Text style={styles.questionText}>{questions[currentIdx]}</Text>

              {!evaluation ? (
                <View style={styles.inputArea}>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder="Type your answer here... Be as detailed as possible."
                    placeholderTextColor="#94a3b8"
                    value={answer}
                    onChangeText={setAnswer}
                    editable={!evaluating}
                  />

                  <TouchableOpacity
                    style={[styles.btnPrimary, (!answer.trim() || evaluating) && styles.btnDisabled]}
                    onPress={submitAnswer}
                    disabled={evaluating || !answer.trim()}
                  >
                    {evaluating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.btnRow}>
                        <Text style={styles.btnTextWhite}>Submit Answer</Text>
                        <Send size={15} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.feedbackArea}>
                  {/* AI Feedback Header */}
                  <View style={styles.scoreRow}>
                    <View style={styles.feedbackHeadingRow}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <Text style={styles.feedbackTitle}>AI Feedback</Text>
                    </View>
                    <View
                      style={[
                        styles.scoreBadge,
                        {
                          backgroundColor:
                            (evaluation.score || 8) >= 8
                              ? '#dcfce7'
                              : (evaluation.score || 8) >= 5
                              ? '#dbeafe'
                              : '#fee2e2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreValue,
                          {
                            color:
                              (evaluation.score || 8) >= 8
                                ? '#15803d'
                                : (evaluation.score || 8) >= 5
                                ? '#1d4ed8'
                                : '#b91c1c',
                          },
                        ]}
                      >
                        Score: {evaluation.score || 8}/10
                      </Text>
                    </View>
                  </View>

                  {/* Strengths */}
                  <Text style={styles.evalLabel}>KEY STRENGTHS</Text>
                  <Text style={styles.evalText}>
                    {evaluation.strengths || 'Clear conceptual reasoning and logical structure.'}
                  </Text>

                  {/* Improvements */}
                  <Text style={styles.evalLabel}>AREAS FOR IMPROVEMENT</Text>
                  <Text style={styles.evalText}>
                    {evaluation.improvements || 'Elaborate on production metrics and corner cases.'}
                  </Text>

                  {/* Model Hint */}
                  <View style={styles.hintBox}>
                    <View style={styles.hintHeader}>
                      <Sparkles size={13} color="#2563eb" />
                      <Text style={styles.hintLabel}>MODEL ANSWER HINT</Text>
                    </View>
                    <Text style={styles.hintText}>
                      {evaluation.model_hint ||
                        'Highlight technical trade-offs, architecture patterns, and testing strategies.'}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.btnPrimary} onPress={nextQuestion}>
                    <View style={styles.btnRow}>
                      <Text style={styles.btnTextWhite}>
                        {currentIdx === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                      </Text>
                      <ChevronRight size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* 4. Complete Screen */
          <View style={styles.doneBox}>
            <View style={styles.doneIcon}>
              <Award size={48} color="#16a34a" />
            </View>
            <Text style={styles.doneTitle}>Interview Completed!</Text>
            <Text style={styles.doneDesc}>
              Great job! You have completed all technical questions. Review your session score summary below.
            </Text>

            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>AVERAGE SCORE</Text>
                <Text style={styles.statVal}>
                  {completed.length > 0
                    ? Math.round(
                        (completed.reduce((a, b) => a + (b.score || 8), 0) / completed.length) * 10
                      )
                    : 85}
                  /100
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>QUESTIONS</Text>
                <Text style={styles.statVal}>{completed.length || questions.length || 5}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={startInterview}>
              <View style={styles.btnRow}>
                <RotateCcw size={16} color="#fff" />
                <Text style={styles.btnTextWhite}>Take Another Interview</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionBtnPrimary: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cameraBox: {
    backgroundColor: '#020617',
    borderRadius: 20,
    height: 160,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLiveTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  recordingText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cameraInner: {
    alignItems: 'center',
    gap: 6,
  },
  cameraPlaceholder: {
    color: '#94a3b8',
    fontSize: 12,
  },
  startBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  botIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  startTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  startDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  btnPrimary: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  tipBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  tipText: {
    fontSize: 12,
    color: '#1e40af',
    flex: 1,
    lineHeight: 18,
  },
  quizBox: { gap: 14 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#e2e8f0' },
  dotActive: { backgroundColor: '#0f172a' },
  dotDone: { backgroundColor: '#16a34a' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  qLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  questionText: { fontSize: 16, fontWeight: '700', color: '#0f172a', lineHeight: 24 },
  inputArea: { marginTop: 18, gap: 14 },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0f172a',
  },
  feedbackArea: { marginTop: 16 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  feedbackHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scoreValue: { fontWeight: 'bold', fontSize: 13 },
  evalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
    letterSpacing: 0.8,
    marginTop: 12,
  },
  evalText: { fontSize: 13, color: '#334155', lineHeight: 19 },
  hintBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  hintHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  hintLabel: { fontSize: 10, fontWeight: 'bold', color: '#2563eb', letterSpacing: 0.5 },
  hintText: { fontSize: 12, color: '#1e40af', fontStyle: 'italic', lineHeight: 18 },
  doneBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  doneDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  historyContainer: { gap: 10 },
  sectionHeading: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
  },
  historyDate: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  historySub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  scoreTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scoreTagText: { fontSize: 13, fontWeight: 'bold' },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  BarChart2,
  History,
  CheckCircle,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Star,
  Briefcase,
  Ban,
  PauseCircle,
  XCircle,
  Shield,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Plus,
  Flame,
  Zap,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

const EVENT_ICONS: Record<string, any> = {
  practice_attempt: CheckCircle,
  practice_completed: CheckCircle,
  question_starred: Star,
  hr_review: Briefcase,
  shortlisted: Star,
  blocked: Ban,
  rejected: XCircle,
  hold: PauseCircle,
  teacher_feedback: MessageSquare,
  verification: Shield,
};

export default function ProgressScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [score, setScore] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hiringStatus, setHiringStatus] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Accordion state
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionAttempts, setSessionAttempts] = useState<Record<string, any[]>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const [stRes, tlRes, scRes, pfRes, hiRes] = await Promise.all([
        apiClient.get('/practice/progress').catch(() => ({ data: null })),
        apiClient.get('/profile/timeline').catch(() => ({ data: [] })),
        apiClient.get('/score').catch(() => apiClient.get('/trust-score').catch(() => ({ data: null }))),
        apiClient.get('/profile').catch(() => ({ data: null })),
        apiClient.get('/practice/history').catch(() => ({ data: [] })),
      ]);

      setStats(stRes.data);
      setTimeline(Array.isArray(tlRes.data) ? tlRes.data : []);
      setScore(scRes.data);
      setProfile(pfRes.data?.profile);
      setHiringStatus(Array.isArray(pfRes.data?.hiring_status) ? pfRes.data.hiring_status : []);
      setSessionHistory(Array.isArray(hiRes.data) ? hiRes.data : []);
    } catch (err) {
      console.log('Progress fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleSessionExpand = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);

    if (!sessionAttempts[sessionId]) {
      setLoadingAttempts((prev) => ({ ...prev, [sessionId]: true }));
      try {
        const res = await apiClient.get(`/practice/history/${sessionId}/attempts`);
        setSessionAttempts((prev) => ({ ...prev, [sessionId]: res.data?.attempts || [] }));
      } catch {
        setSessionAttempts((prev) => ({ ...prev, [sessionId]: [] }));
      } finally {
        setLoadingAttempts((prev) => ({ ...prev, [sessionId]: false }));
      }
    }
  };

  const SUGGESTIONS = [
    {
      done: timeline.some((e) => e.event_type === 'resume_uploaded'),
      action: 'Upload your resume PDF',
      gain: '+10% completeness',
      screen: 'Profile',
    },
    {
      done: timeline.some((e) => e.event_type === 'resume_parsed'),
      action: 'Parse resume to extract skills',
      gain: 'Auto-detect skills',
      screen: 'Profile',
    },
    {
      done: timeline.some((e) => e.event_type === 'github_verified'),
      action: 'Verify your GitHub profile',
      gain: '+15 skill evidence',
      screen: 'GitHub',
    },
    {
      done: timeline.some((e) => e.event_type === 'leetcode_verified'),
      action: 'Verify your LeetCode profile',
      gain: '+15 coding evidence',
      screen: 'LeetCode',
    },
    {
      done: timeline.some((e) => e.event_type === 'practice_completed'),
      action: 'Complete a practice session',
      gain: 'Boost practice score',
      screen: 'Practice',
    },
  ];

  const completedCount = SUGGESTIONS.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / SUGGESTIONS.length) * 100);
  // Vanish completed suggestions after reaching 50% progress
  const visibleSuggestions =
    progressPercent >= 50 ? SUGGESTIONS.filter((s) => !s.done) : SUGGESTIONS;

  if (loading) {
    return (
      <DashboardLayout title="My Progress">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading progress & analytics...</Text>
        </View>
      </DashboardLayout>
    );
  }

  const accuracyPct =
    stats?.overall?.total > 0
      ? Math.round(((stats?.overall?.correct || 0) / stats.overall.total) * 100)
      : 0;

  const categories = stats?.by_category || [];

  return (
    <DashboardLayout title="My Progress">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Title & Practice Action */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Progress</Text>
            <Text style={styles.headerSubtitle}>
              Comprehensive view of your scores, activities, and career growth.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.practiceBtn}
            onPress={() => navigation.navigate('Practice')}
          >
            <BookOpen size={14} color="#fff" />
            <Text style={styles.practiceBtnText}>Practice Now</Text>
          </TouchableOpacity>
        </View>

        {/* Hiring Status Banner */}
        {hiringStatus.length > 0 && (
          <View
            style={[
              styles.hiringBanner,
              hiringStatus.some((s: any) => s.status === 'shortlisted')
                ? styles.bannerShortlisted
                : hiringStatus.some((s: any) => s.status === 'rejected')
                ? styles.bannerRejected
                : hiringStatus.some((s: any) => s.status === 'hold')
                ? styles.bannerHold
                : styles.bannerApplied,
            ]}
          >
            <View style={styles.bannerLeft}>
              <View
                style={[
                  styles.bannerIconWrap,
                  hiringStatus.some((s: any) => s.status === 'shortlisted')
                    ? { backgroundColor: '#f3e8ff' }
                    : hiringStatus.some((s: any) => s.status === 'rejected')
                    ? { backgroundColor: '#fee2e2' }
                    : hiringStatus.some((s: any) => s.status === 'hold')
                    ? { backgroundColor: '#ffedd5' }
                    : { backgroundColor: '#e0f2fe' },
                ]}
              >
                {hiringStatus.some((s: any) => s.status === 'shortlisted') ? (
                  <Star size={20} color="#9333ea" />
                ) : hiringStatus.some((s: any) => s.status === 'rejected') ? (
                  <Ban size={20} color="#dc2626" />
                ) : hiringStatus.some((s: any) => s.status === 'hold') ? (
                  <Clock size={20} color="#ea580c" />
                ) : (
                  <Briefcase size={20} color="#0284c7" />
                )}
              </View>
              <View>
                <Text style={styles.bannerLabel}>Recruitment Status</Text>
                <Text style={styles.bannerStatus}>
                  {hiringStatus
                    .map((s: any) => s.status?.charAt(0).toUpperCase() + s.status?.slice(1))
                    .join(', ')}
                </Text>
              </View>
            </View>
            {hiringStatus[0]?.notes ? (
              <Text style={styles.bannerNotes}>"{hiringStatus[0].notes}"</Text>
            ) : null}
          </View>
        )}

        {/* 4-Card Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.overall?.total || 0}</Text>
            <Text style={styles.statLabel}>Practice Attempts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>
              {stats?.overall?.correct || 0}
            </Text>
            <Text style={styles.statLabel}>Correct Answers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#0284c7' }]}>{accuracyPct}%</Text>
            <Text style={styles.statLabel}>Practice Accuracy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#d97706' }]}>
              {score?.overall_score || 0}
            </Text>
            <Text style={styles.statLabel}>Confidence Score</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <BarChart2 size={18} color="#475569" />
              <Text style={styles.cardTitle}>Category Breakdown</Text>
            </View>
            <View style={styles.categoryList}>
              {categories.map((cat: any, idx: number) => {
                const catScore = Math.round(cat.avg_score || 0);
                const barColor =
                  catScore >= 70 ? '#16a34a' : catScore >= 40 ? '#d97706' : '#dc2626';
                return (
                  <View key={idx} style={styles.categoryItem}>
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryName}>
                        {cat.category?.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={[styles.categoryScore, { color: barColor }]}>{catScore}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(catScore, 100)}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Session History Table / Accordion */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <History size={18} color="#475569" />
            <Text style={styles.cardTitle}>Practice Session History</Text>
          </View>

          {sessionHistory.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Clock size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>No practice sessions completed yet.</Text>
            </View>
          ) : (
            sessionHistory.map((s: any) => {
              const isExpanded = expandedSession === s.id;
              const sScore = s.score_percentage ?? 0;
              const sColor = sScore >= 70 ? '#16a34a' : sScore >= 40 ? '#d97706' : '#dc2626';
              const attempts = sessionAttempts[s.id];
              const isFetching = loadingAttempts[s.id];

              return (
                <View key={s.id} style={styles.sessionItem}>
                  <TouchableOpacity
                    style={styles.sessionHeader}
                    onPress={() => toggleSessionExpand(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionLeft}>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#64748b" />
                      ) : (
                        <ChevronDown size={16} color="#64748b" />
                      )}
                      <Text style={styles.sessionCategory}>
                        {s.category?.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sessionRight}>
                      <Text style={[styles.sessionScorePct, { color: sColor }]}>{sScore}%</Text>
                      <Text style={styles.sessionFraction}>
                        {s.correct_answers ?? 0}/{s.total_questions ?? 0}
                      </Text>
                      <Text style={styles.sessionDate}>
                        {s.completed_at && !isNaN(new Date(s.completed_at).getTime())
                          ? new Date(s.completed_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.attemptsWrap}>
                      {isFetching ? (
                        <View style={styles.attemptsLoading}>
                          <ActivityIndicator size="small" color="#0f172a" />
                          <Text style={styles.attemptsLoadingText}>Loading question details...</Text>
                        </View>
                      ) : !attempts || attempts.length === 0 ? (
                        <Text style={styles.noAttemptsText}>
                          No detailed attempts recorded for this session.
                        </Text>
                      ) : (
                        attempts.slice(0, 20).map((a: any, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.attemptCard,
                              a.is_correct ? styles.attemptCorrect : styles.attemptWrong,
                            ]}
                          >
                            <View style={styles.attemptTop}>
                              <Text style={styles.attemptTitle} numberOfLines={2}>
                                {a.title || `Question ${i + 1}`}
                              </Text>
                              {a.is_correct ? (
                                <CheckCircle size={16} color="#16a34a" />
                              ) : (
                                <XCircle size={16} color="#dc2626" />
                              )}
                            </View>
                            <View style={styles.attemptAnswers}>
                              <Text style={styles.attemptAnsText}>
                                Your answer:{' '}
                                <Text
                                  style={{
                                    fontWeight: 'bold',
                                    color: a.is_correct ? '#16a34a' : '#dc2626',
                                  }}
                                >
                                  {a.submitted_answer || '—'}
                                </Text>
                              </Text>
                              {!a.is_correct && a.correct_answer && (
                                <Text style={styles.attemptAnsText}>
                                  Correct:{' '}
                                  <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>
                                    {a.correct_answer}
                                  </Text>
                                </Text>
                              )}
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Recommended Next Steps: vanish completed items after reaching 50% progress */}
        {visibleSuggestions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={18} color="#d97706" />
                <Text style={styles.cardTitle}>Recommended Next Steps</Text>
              </View>
              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>{progressPercent}% Done</Text>
              </View>
            </View>
            <View style={styles.suggestionsList}>
              {visibleSuggestions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.suggestionItem, item.done ? styles.suggDone : styles.suggPending]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.suggIconWrap,
                      item.done ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fef3c7' },
                    ]}
                  >
                    {item.done ? (
                      <CheckCircle size={14} color="#16a34a" />
                    ) : (
                      <Plus size={14} color="#d97706" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      style={[
                        styles.suggAction,
                        item.done ? { color: '#166534' } : { color: '#78350f' },
                      ]}
                    >
                      {item.action}
                    </Text>
                    <Text
                      style={[
                        styles.suggGain,
                        item.done ? { color: '#16a34a' } : { color: '#b45309' },
                      ]}
                    >
                      {item.done ? 'Completed' : item.gain}
                    </Text>
                  </View>
                  {!item.done && <ArrowRight size={14} color="#d97706" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Activity Insights / 30-day Gauge */}
        <View style={styles.insightsDarkCard}>
          <View style={styles.insightsHeader}>
            <Flame size={16} color="#fbbf24" />
            <Text style={styles.insightsTitle}>ACTIVITY INSIGHTS</Text>
          </View>
          <View style={styles.insightsBody}>
            <Text style={styles.insightsBigNum}>{stats?.active_days_30 || 0}</Text>
            <Text style={styles.insightsSubtext}>Active days{'\n'}(Last 30d)</Text>
          </View>
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                { width: `${(Math.min(stats?.active_days_30 || 0, 30) / 30) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Activity Journey / Timeline (Whole Sessions & Milestones) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={18} color="#475569" />
            <Text style={styles.cardTitle}>Activity Journey</Text>
          </View>

          {timeline.filter((e) => e.event_type !== 'practice_attempt').length === 0 ? (
            <View style={styles.emptyWrap}>
              <Clock size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>No activity recorded yet.</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {timeline
                .filter((e) => e.event_type !== 'practice_attempt')
                .map((ev: any, idx: number) => {
                  const IconComp = EVENT_ICONS[ev.event_type] || Clock;
                  const rawDate = ev.created_at || ev.timestamp || ev.date;
                  const d = rawDate ? new Date(rawDate) : null;
                  const dateStr =
                    d && !isNaN(d.getTime())
                      ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
                      : 'Recent';

                return (
                  <View key={ev.id || idx} style={styles.timelineItem}>
                    <View style={styles.timelineLeftCol}>
                      <View style={styles.timelineIconBubble}>
                        <IconComp size={13} color="#0f172a" />
                      </View>
                      {idx !== timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineContentTop}>
                        <Text style={styles.timelineTitle}>{ev.event_title}</Text>
                        <Text style={styles.timelineDate}>{dateStr}</Text>
                      </View>
                      {ev.event_detail ? (
                        <Text style={styles.timelineDetail}>{ev.event_detail}</Text>
                      ) : null}
                      {ev.points_gained > 0 && (
                        <View style={styles.pointsBadge}>
                          <Text style={styles.pointsBadgeText}>+{ev.points_gained} PTS</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 3, maxWidth: 220 },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 2,
  },
  practiceBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Hiring Banner
  hiringBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerShortlisted: { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' },
  bannerRejected: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  bannerHold: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  bannerApplied: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerStatus: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  bannerNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },

  // 4-Card Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '500' },

  // Generic Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },

  // Category Breakdown
  categoryList: { gap: 14 },
  categoryItem: { gap: 6 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#334155' },
  categoryScore: { fontSize: 12, fontWeight: 'bold' },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Session History
  sessionItem: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sessionCategory: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionScorePct: { fontSize: 13, fontWeight: 'bold' },
  sessionFraction: { fontSize: 11, color: '#64748b' },
  sessionDate: { fontSize: 10, color: '#94a3b8' },

  // Attempts Detail Inside Accordion
  attemptsWrap: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  attemptsLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  attemptsLoadingText: { fontSize: 11, color: '#64748b' },
  noAttemptsText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', paddingVertical: 4 },
  attemptCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  attemptCorrect: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  attemptWrong: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  attemptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  attemptTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b', flex: 1 },
  attemptAnswers: { marginTop: 6, gap: 2 },
  attemptAnsText: { fontSize: 11, color: '#475569' },

  // Suggestions List
  suggestionsList: { gap: 10 },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggPending: { backgroundColor: '#fffbeb', borderColor: '#fef3c7' },
  suggDone: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7', opacity: 0.7 },
  suggIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggAction: { fontSize: 12, fontWeight: 'bold' },
  suggGain: { fontSize: 10, marginTop: 2 },
  progressPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  progressPillText: { fontSize: 10, fontWeight: 'bold', color: '#92400e' },

  // Insights Dark Card
  insightsDarkCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  insightsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  insightsBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsBigNum: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  insightsSubtext: { fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  gaugeTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  gaugeFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 3 },

  // Timeline
  timelineContainer: { paddingLeft: 6 },
  timelineItem: { flexDirection: 'row', gap: 12, minHeight: 60 },
  timelineLeftCol: { alignItems: 'center', width: 24 },
  timelineIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineContentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  timelineDate: { fontSize: 10, color: '#94a3b8' },
  timelineDetail: { fontSize: 11, color: '#64748b', marginTop: 2 },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  pointsBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#16a34a' },

  // Empty State
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 12, color: '#94a3b8' },
});

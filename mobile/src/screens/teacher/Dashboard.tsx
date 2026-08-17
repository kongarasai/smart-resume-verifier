import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Trophy,
  Eye,
  AlertCircle,
  BarChart2,
  Mail,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function TeacherDashboard({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async (keepSelection = false) => {
    try {
      const res = await apiClient.get('/groups');
      const grps = res.data || [];
      setGroups(grps);

      if (grps.length > 0) {
        const target = keepSelection && selectedGroup
          ? grps.find((g: any) => g.id === selectedGroup.id) || grps[0]
          : grps[0];
        await loadGroup(target);
      } else {
        setSelectedGroup(null);
        setMembers([]);
        setRankings([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGroup = async (g: any) => {
    setSelectedGroup(g);
    try {
      const [rRes, mRes] = await Promise.all([
        apiClient.get(`/ranking/group/${g.id}`),
        apiClient.get(`/groups/${g.id}/members`),
      ]);
      setRankings(rRes.data || []);
      setMembers(mRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups(true);
  }, [selectedGroup]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const candidateMembers = members.filter((m: any) => m.group_role === 'candidate');

  // Candidates needing attention: inactive >7d, rank dropping < -2, or low/no confidence score
  const needsAttention = candidateMembers.filter((m: any) => {
    const lastPractice = m.last_practice ? new Date(m.last_practice) : null;
    const daysSince = lastPractice
      ? (Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    return daysSince > 7 || (m.rank_change && m.rank_change < -2) || !m.confidence_score || m.confidence_score < 40;
  });

  // Active candidates in last 7 days
  const activeCount = candidateMembers.filter((m: any) => {
    const lastPractice = m.last_practice ? new Date(m.last_practice) : null;
    return lastPractice && (Date.now() - lastPractice.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const avgScore = rankings.length
    ? Math.round(
        rankings.reduce((s: number, r: any) => s + (Number(r.total_score) || 0), 0) /
          rankings.length
      )
    : 0;

  const handleSendReminder = (candidate: any) => {
    if (!candidate.email) {
      Alert.alert('Notice', 'No email address registered for this candidate.');
      return;
    }
    const subject = encodeURIComponent(`Checking in on your Progress - ${selectedGroup?.name || ''}`);
    const body = encodeURIComponent(
      `Hi ${candidate.full_name},\n\nThis is a quick check-in from your instructor regarding your practice assignments on SentryConnect. Keep up the momentum!\n\nBest regards,\nInstructor`
    );
    Linking.openURL(`mailto:${candidate.email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Reminder', `Sent reminder notification to ${candidate.full_name} (${candidate.email})`);
    });
  };

  return (
    <DashboardLayout title="Teacher Portal">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
      >
        {/* Header & Group Selector */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Teacher Dashboard</Text>
          <Text style={styles.headerSubtitle}>Monitor candidates, rankings, and group activity</Text>

          {groups.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabs}>
              {groups.map((g) => {
                const isActive = selectedGroup?.id === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => loadGroup(g)}
                    style={[styles.groupTab, isActive && styles.activeGroupTab]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.groupTabText, isActive && styles.activeGroupTabText]}>
                      {g.name}
                    </Text>
                    {g.workspace_name ? (
                      <Text style={[styles.groupTabWs, isActive && styles.activeGroupTabWs]}>
                        {g.workspace_name}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading group insights...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Not assigned to any group</Text>
            <Text style={styles.emptySubtitle}>
              Ask your administrator or mentor to assign you to a cohort group.
            </Text>
          </View>
        ) : (
          <View style={styles.contentBody}>
            {/* Quick Action Bar */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Problems')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <BookOpen size={18} color="#2563eb" />
                </View>
                <Text style={styles.actionCardTitle}>Add Question</Text>
                <Text style={styles.actionCardSub}>MCQ & Coding</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('TeacherRankings')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#fef3c7' }]}>
                  <Trophy size={18} color="#d97706" />
                </View>
                <Text style={styles.actionCardTitle}>Rankings</Text>
                <Text style={styles.actionCardSub}>Leaderboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() =>
                  navigation.navigate('TeacherAnalytics', {
                    groupId: selectedGroup?.id,
                    groupName: selectedGroup?.name,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#f3e8ff' }]}>
                  <BarChart2 size={18} color="#7c3aed" />
                </View>
                <Text style={styles.actionCardTitle}>Analytics</Text>
                <Text style={styles.actionCardSub}>Assignment Stats</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('GroupCandidates')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#f0fdf4' }]}>
                  <Users size={18} color="#16a34a" />
                </View>
                <Text style={styles.actionCardTitle}>Candidates</Text>
                <Text style={styles.actionCardSub}>Profiles & Score</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#1a6fa8' }]}>
                  {candidateMembers.length}
                </Text>
                <Text style={styles.statLabel}>Candidates</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#2d9e5f' }]}>{activeCount}</Text>
                <Text style={styles.statLabel}>Active (7d)</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#d97706' }]}>
                  {needsAttention.length}
                </Text>
                <Text style={styles.statLabel}>Needs Attention</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#7c3aed' }]}>{avgScore}</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
            </View>

            {/* Candidates Needing Attention */}
            {needsAttention.length > 0 && (
              <View style={styles.attentionCard}>
                <View style={styles.attentionHeader}>
                  <AlertCircle size={16} color="#b45309" />
                  <Text style={styles.attentionTitle}>
                    Candidates Needing Attention ({needsAttention.length})
                  </Text>
                </View>

                {needsAttention.map((m: any) => {
                  const lastPractice = m.last_practice ? new Date(m.last_practice) : null;
                  const isInactive = Boolean(!lastPractice || (Date.now() - lastPractice.getTime()) > 7 * 24 * 60 * 60 * 1000);
                  const isDropping = Boolean(typeof m.rank_change === 'number' && m.rank_change < -2);
                  const isLowScore = Boolean(!m.confidence_score || m.confidence_score < 40);

                  return (
                    <View key={m.user_id} style={styles.attentionRow}>
                      <TouchableOpacity
                        style={styles.attentionInfo}
                        onPress={() => navigation.navigate('CandidateDetail', { id: m.user_id })}
                      >
                        <Text style={styles.attentionName}>{m.full_name}</Text>
                        <Text style={styles.attentionEmail}>{m.email}</Text>

                        <View style={styles.badgesRow}>
                          {isInactive && (
                            <View style={[styles.badge, styles.badgeRed]}>
                              <Text style={styles.badgeRedText}>No practice</Text>
                            </View>
                          )}
                          {isDropping && (
                            <View style={[styles.badge, styles.badgeAmber]}>
                              <Text style={styles.badgeAmberText}>Rank dropping</Text>
                            </View>
                          )}
                          {isLowScore && (
                            <View style={[styles.badge, styles.badgeGray]}>
                              <Text style={styles.badgeGrayText}>Low score</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>

                      <View style={styles.attentionActions}>
                        <TouchableOpacity
                          style={styles.profileBtn}
                          onPress={() => navigation.navigate('CandidateDetail', { id: m.user_id })}
                        >
                          <Eye size={12} color="#475569" />
                          <Text style={styles.profileBtnText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.remindBtn}
                          onPress={() => handleSendReminder(m)}
                        >
                          <Mail size={12} color="#b45309" />
                          <Text style={styles.remindBtnText}>Remind</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Group Leaderboard / Rankings */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Trophy size={18} color="#d97706" />
                  <Text style={styles.sectionTitle}>
                    Group Rankings — {selectedGroup?.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('TeacherRankings')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                  <Text style={styles.viewAllText}>Full View</Text>
                  <ChevronRight size={12} color="#2563eb" />
                </TouchableOpacity>
              </View>

              {rankings.length === 0 ? (
                <Text style={styles.emptyText}>
                  No rankings recorded yet. Candidates need to complete practice tasks.
                </Text>
              ) : (
                rankings.slice(0, 10).map((r: any, i: number) => {
                  const isTop1 = i === 0;
                  const isTop2 = i === 1;
                  const isTop3 = i === 2;

                  return (
                    <TouchableOpacity
                      key={r.user_id}
                      style={[
                        styles.rankRow,
                        isTop1 && styles.rankTop1,
                        isTop2 && styles.rankTop2,
                        isTop3 && styles.rankTop3,
                      ]}
                      onPress={() => navigation.navigate('CandidateDetail', { id: r.user_id })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.rankNumCol}>
                        <Text
                          style={[
                            styles.rankNumText,
                            isTop1 && { color: '#b45309' },
                            isTop2 && { color: '#475569' },
                            isTop3 && { color: '#c2410c' },
                          ]}
                        >
                          #{r.rank_position || i + 1}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.rankAvatar,
                          isTop1 && { backgroundColor: '#fde68a' },
                          isTop2 && { backgroundColor: '#e2e8f0' },
                          isTop3 && { backgroundColor: '#ffedd5' },
                        ]}
                      >
                        <Text style={styles.rankAvatarText}>
                          {(r.full_name?.charAt(0) || 'C').toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.rankFullName} numberOfLines={1}>
                          {r.full_name}
                        </Text>
                        <Text style={styles.rankSubScores}>
                          Practice: {Math.round(r.practice_score || 0)} • GitHub:{' '}
                          {Math.round(r.github_score || 0)} • LC:{' '}
                          {Math.round(r.leetcode_score || 0)}
                        </Text>
                      </View>

                      <View style={styles.scoreCol}>
                        <Text style={styles.totalScoreVal}>
                          {Math.round(r.total_score || 0)}
                        </Text>
                        <View style={styles.trendRow}>
                          {r.rank_change > 0 ? (
                            <>
                              <TrendingUp size={10} color="#16a34a" />
                              <Text style={[styles.trendText, { color: '#16a34a' }]}>
                                {r.rank_change}
                              </Text>
                            </>
                          ) : r.rank_change < 0 ? (
                            <>
                              <TrendingDown size={10} color="#dc2626" />
                              <Text style={[styles.trendText, { color: '#dc2626' }]}>
                                {Math.abs(r.rank_change)}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Minus size={10} color="#94a3b8" />
                              <Text style={[styles.trendText, { color: '#94a3b8' }]}>-</Text>
                            </>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* All Candidates In Cohort */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Users size={18} color="#0f172a" />
                  <Text style={styles.sectionTitle}>
                    All Candidates ({candidateMembers.length})
                  </Text>
                </View>
              </View>

              {candidateMembers.length === 0 ? (
                <Text style={styles.emptyText}>No candidates enrolled in this group yet.</Text>
              ) : (
                candidateMembers.map((m: any) => {
                  const lastPractice = m.last_practice ? new Date(m.last_practice) : null;
                  const daysSince = lastPractice
                    ? Math.floor((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <TouchableOpacity
                      key={m.user_id}
                      style={styles.candidateRow}
                      onPress={() => navigation.navigate('CandidateDetail', { id: m.user_id })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.candidateAvatar}>
                        <Text style={styles.candidateAvatarText}>
                          {(m.full_name?.charAt(0) || 'C').toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.candidateName} numberOfLines={1}>
                          {m.full_name}
                        </Text>
                        <Text style={styles.candidateEmail} numberOfLines={1}>
                          {m.email}
                        </Text>
                      </View>

                      <View style={styles.candidateMetrics}>
                        <View style={styles.metricPill}>
                          <Text style={styles.metricVal}>{m.confidence_score || 0}</Text>
                          <Text style={styles.metricLab}>Score</Text>
                        </View>

                        <View style={styles.metricPill}>
                          <Text style={styles.metricVal}>
                            {m.rank_position ? `#${m.rank_position}` : '—'}
                          </Text>
                          <Text style={styles.metricLab}>Rank</Text>
                        </View>

                        <View style={styles.metricPill}>
                          <Text
                            style={[
                              styles.metricVal,
                              daysSince === null
                                ? { color: '#94a3b8' }
                                : daysSince <= 3
                                ? { color: '#16a34a' }
                                : daysSince <= 7
                                ? { color: '#d97706' }
                                : { color: '#dc2626' },
                            ]}
                          >
                            {daysSince === null ? 'Never' : `${daysSince}d`}
                          </Text>
                          <Text style={styles.metricLab}>Active</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 14 },
  groupTabs: { flexDirection: 'row' },
  groupTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeGroupTab: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  groupTabText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  activeGroupTabText: { color: '#fff' },
  groupTabWs: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  activeGroupTabWs: { color: '#94a3b8' },

  loadingContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, color: '#64748b', marginTop: 10 },

  emptyCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 12 },
  emptySubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6 },

  contentBody: { padding: 16, gap: 16 },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  actionCardSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center', fontWeight: '500' },

  // Attention Box
  attentionCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  attentionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  attentionTitle: { fontSize: 13, fontWeight: 'bold', color: '#92400e' },
  attentionRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  attentionInfo: { flex: 1, marginRight: 8 },
  attentionName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  attentionEmail: { fontSize: 11, color: '#64748b', marginTop: 1 },
  badgesRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeRedText: { fontSize: 9, fontWeight: 'bold', color: '#dc2626' },
  badgeAmber: { backgroundColor: '#fef3c7' },
  badgeAmberText: { fontSize: 9, fontWeight: 'bold', color: '#d97706' },
  badgeGray: { backgroundColor: '#f1f5f9' },
  badgeGrayText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  attentionActions: { flexDirection: 'row', gap: 6 },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileBtnText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  remindBtnText: { fontSize: 11, fontWeight: 'bold', color: '#92400e' },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  viewAllText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  emptyText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },

  // Rankings
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rankTop1: { backgroundColor: '#fffdf5', borderColor: '#fef3c7' },
  rankTop2: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  rankTop3: { backgroundColor: '#fff7ed', borderColor: '#ffedd5' },
  rankNumCol: { width: 28, alignItems: 'center' },
  rankNumText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  rankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  rankFullName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  rankSubScores: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  scoreCol: { alignItems: 'flex-end', marginLeft: 8 },
  totalScoreVal: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  trendText: { fontSize: 9, fontWeight: 'bold' },

  // All Candidates List
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  candidateAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  candidateAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  candidateName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  candidateEmail: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  candidateMetrics: { flexDirection: 'row', gap: 6 },
  metricPill: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minWidth: 42,
  },
  metricVal: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  metricLab: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' },
});


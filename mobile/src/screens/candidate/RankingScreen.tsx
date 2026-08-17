import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  RefreshCw,
  Award,
  Sparkles,
  Users,
  Code,
  Target,
  Shield,
  BookOpen,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

const FORMULA = [
  { label: 'Practice Problems', weight: 30, color: '#1a6fa8' },
  { label: 'Projects', weight: 20, color: '#2d9e5f' },
  { label: 'GitHub Activity', weight: 15, color: '#7c3aed' },
  { label: 'LeetCode', weight: 15, color: '#d97706' },
  { label: 'Skill Verification', weight: 10, color: '#db2777' },
  { label: 'Activity Engagement', weight: 10, color: '#0891b2' },
];

export default function RankingScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get('/ranking');
      setData(res.data);
    } catch (err) {
      console.log('Error loading rankings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await apiClient.post('/ranking/recalculate');
      await loadData();
      Alert.alert('Success', 'Rankings recalculated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to recalculate rankings. Please try again.');
    } finally {
      setRecalculating(false);
    }
  };

  const RankChange = ({ change }: { change: number }) => {
    if (!change) {
      return (
        <View style={styles.changeRow}>
          <Minus size={12} color="#94a3b8" />
          <Text style={[styles.changeText, { color: '#94a3b8' }]}>Unchanged</Text>
        </View>
      );
    }
    if (change > 0) {
      return (
        <View style={styles.changeRow}>
          <TrendingUp size={12} color="#16a34a" />
          <Text style={[styles.changeText, { color: '#16a34a' }]}>+{change} positions</Text>
        </View>
      );
    }
    return (
      <View style={styles.changeRow}>
        <TrendingDown size={12} color="#dc2626" />
        <Text style={[styles.changeText, { color: '#dc2626' }]}>{change} positions</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Rankings">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading rankings & leaderboard...</Text>
        </View>
      </DashboardLayout>
    );
  }

  const overall = data?.overall;
  const groupRankings = data?.group_rankings || [];
  const leaderboard = data?.leaderboard || [];

  return (
    <DashboardLayout title="Rankings">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Rankings</Text>
            <Text style={styles.headerSubtitle}>
              Your position across groups and the overall platform
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btnRecalculate, recalculating && styles.btnRecalculateDisabled]}
            onPress={handleRecalculate}
            disabled={recalculating}
            activeOpacity={0.8}
          >
            {recalculating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <RefreshCw size={13} color="#fff" />
            )}
            <Text style={styles.btnRecalculateText}>
              {recalculating ? 'Calculating...' : 'Recalculate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overall Platform Ranking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Trophy size={18} color="#d97706" />
            <Text style={styles.cardTitle}>My Platform Ranking</Text>
          </View>

          {overall ? (
            <View>
              <View style={styles.overallMainRow}>
                {/* Big Rank Badge */}
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNum}>#{overall.rank_position}</Text>
                  <Text style={styles.rankBadgeLabel}>GLOBAL RANK</Text>
                </View>

                {/* Score & Change */}
                <View style={{ flex: 1 }}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreVal}>
                      {Math.round(overall.total_score || 0)}
                      <Text style={styles.scoreMax}> /100</Text>
                    </Text>
                    <RankChange change={overall.rank_change || 0} />
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.scoreBarTrack}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { width: `${Math.min(Math.round(overall.total_score || 0), 100)}%` },
                      ]}
                    />
                  </View>

                  {overall.rank_change !== 0 && overall.previous_rank ? (
                    <Text style={styles.previousRankText}>
                      Previous rank: #{overall.previous_rank}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Sub-score Breakdown Grid */}
              <View style={styles.subScoresGrid}>
                <View style={styles.subScoreItem}>
                  <Text style={[styles.subScoreVal, { color: '#7c3aed' }]}>
                    {Math.round(overall.github_score || 0)}
                  </Text>
                  <Text style={styles.subScoreLab}>GitHub</Text>
                </View>
                <View style={styles.subScoreItem}>
                  <Text style={[styles.subScoreVal, { color: '#d97706' }]}>
                    {Math.round(overall.leetcode_score || 0)}
                  </Text>
                  <Text style={styles.subScoreLab}>LeetCode</Text>
                </View>
                <View style={styles.subScoreItem}>
                  <Text style={[styles.subScoreVal, { color: '#db2777' }]}>
                    {Math.round(overall.skill_score || 0)}
                  </Text>
                  <Text style={styles.subScoreLab}>Skills</Text>
                </View>
                <View style={styles.subScoreItem}>
                  <Text style={[styles.subScoreVal, { color: '#1a6fa8' }]}>
                    {Math.round(overall.practice_score || 0)}
                  </Text>
                  <Text style={styles.subScoreLab}>Practice</Text>
                </View>
                <View style={styles.subScoreItem}>
                  <Text style={[styles.subScoreVal, { color: '#2d9e5f' }]}>
                    {Math.round(overall.project_score || 0)}
                  </Text>
                  <Text style={styles.subScoreLab}>Projects</Text>
                </View>
                <View style={styles.subScoreItem}>
                  <Text style={[styles.subScoreVal, { color: '#0891b2' }]}>
                    {Math.round(overall.activity_score || 0)}
                  </Text>
                  <Text style={styles.subScoreLab}>Activity</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Trophy size={42} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Ranking Yet</Text>
              <Text style={styles.emptyDesc}>
                Solve practice problems and verify your profile to establish your platform rank.
              </Text>
              <TouchableOpacity style={styles.btnGetRanked} onPress={handleRecalculate}>
                <Sparkles size={14} color="#fff" />
                <Text style={styles.btnGetRankedText}>Get Ranked Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Real Platform Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Award size={18} color="#0f172a" />
              <Text style={styles.cardTitle}>Platform Top Candidates</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{leaderboard.length} Candidates</Text>
              </View>
            </View>

            <View style={styles.leaderboardList}>
              {leaderboard.map((cand: any) => {
                const isTop1 = cand.rank_position === 1;
                const isTop2 = cand.rank_position === 2;
                const isTop3 = cand.rank_position === 3;
                const isCurrentUser = cand.is_current_user;

                return (
                  <View
                    key={cand.user_id}
                    style={[
                      styles.leaderboardRow,
                      isCurrentUser && styles.leaderboardRowCurrent,
                    ]}
                  >
                    {/* Rank Badge / Medal */}
                    <View style={styles.rankIconBox}>
                      {isTop1 ? (
                        <View style={[styles.medalCircle, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                          <Text style={{ fontSize: 13 }}>🥇</Text>
                        </View>
                      ) : isTop2 ? (
                        <View style={[styles.medalCircle, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                          <Text style={{ fontSize: 13 }}>🥈</Text>
                        </View>
                      ) : isTop3 ? (
                        <View style={[styles.medalCircle, { backgroundColor: '#ffedd5', borderColor: '#fed7aa' }]}>
                          <Text style={{ fontSize: 13 }}>🥉</Text>
                        </View>
                      ) : (
                        <View style={styles.regularRankBox}>
                          <Text style={styles.regularRankText}>#{cand.rank_position}</Text>
                        </View>
                      )}
                    </View>

                    {/* Candidate Info */}
                    <View style={styles.candInfo}>
                      <View style={styles.candNameRow}>
                        <Text
                          style={[
                            styles.candName,
                            isCurrentUser && { color: '#0f172a', fontWeight: 'bold' },
                          ]}
                          numberOfLines={1}
                        >
                          {cand.full_name}
                        </Text>
                        {isCurrentUser && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>YOU</Text>
                          </View>
                        )}
                      </View>
                      {cand.email ? (
                        <Text style={styles.candEmail} numberOfLines={1}>
                          {cand.email}
                        </Text>
                      ) : null}

                      {/* Sub-score Chips */}
                      <View style={styles.candScoreChips}>
                        <Text style={[styles.candScoreChip, { color: '#7c3aed' }]}>
                          GH: {Math.round(cand.github_score || 0)}
                        </Text>
                        <Text style={[styles.candScoreChip, { color: '#d97706' }]}>
                          LC: {Math.round(cand.leetcode_score || 0)}
                        </Text>
                        <Text style={[styles.candScoreChip, { color: '#db2777' }]}>
                          Skills: {Math.round(cand.skill_score || 0)}
                        </Text>
                        <Text style={[styles.candScoreChip, { color: '#1a6fa8' }]}>
                          Practice: {Math.round(cand.practice_score || 0)}
                        </Text>
                      </View>
                    </View>

                    {/* Total Score */}
                    <View style={styles.candTotalCol}>
                      <Text style={styles.candTotalNum}>
                        {Math.round(cand.total_score || 0)}
                      </Text>
                      <Text style={styles.candTotalLabel}>pts</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Group Standings */}
        {groupRankings.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Users size={18} color="#475569" />
              <Text style={styles.cardTitle}>Group Rankings</Text>
            </View>

            <View style={styles.groupList}>
              {groupRankings.map((r: any) => (
                <View key={r.group_id} style={styles.groupItem}>
                  <View style={styles.groupItemHeader}>
                    <View style={styles.groupItemRankBox}>
                      <Text style={styles.groupItemRankNum}>#{r.rank_position}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupItemName}>{r.group_name}</Text>
                      {r.workspace_name ? (
                        <Text style={styles.groupItemWorkspace}>{r.workspace_name}</Text>
                      ) : null}
                      <View style={{ marginTop: 2 }}>
                        <RankChange change={r.rank_change || 0} />
                      </View>
                    </View>
                    <View style={styles.groupItemTotalScoreCol}>
                      <Text style={styles.groupItemTotalScore}>
                        {Math.round(r.total_score || 0)}
                      </Text>
                      <Text style={styles.groupItemScoreLabel}>score</Text>
                    </View>
                  </View>

                  {/* Component Breakdown Pills */}
                  <View style={styles.groupPillsRow}>
                    <View style={styles.pillBox}>
                      <Text style={[styles.pillVal, { color: '#1a6fa8' }]}>
                        {Math.round(r.practice_score || 0)}
                      </Text>
                      <Text style={styles.pillLab}>Practice</Text>
                    </View>
                    <View style={styles.pillBox}>
                      <Text style={[styles.pillVal, { color: '#7c3aed' }]}>
                        {Math.round(r.github_score || 0)}
                      </Text>
                      <Text style={styles.pillLab}>GitHub</Text>
                    </View>
                    <View style={styles.pillBox}>
                      <Text style={[styles.pillVal, { color: '#d97706' }]}>
                        {Math.round(r.leetcode_score || 0)}
                      </Text>
                      <Text style={styles.pillLab}>LeetCode</Text>
                    </View>
                  </View>

                  {/* Movement Footnote */}
                  {r.rank_change !== 0 && (
                    <View style={styles.rankMovementBox}>
                      <Text style={styles.rankMovementText}>
                        Rank moved: #{r.previous_rank} → #{r.rank_position}
                        {r.rank_change > 0
                          ? '  ↑ Improved by solving problems or updating profile'
                          : '  ↓ Others progressed faster — keep practicing!'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Scoring Formula Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={18} color="#475569" />
            <Text style={styles.cardTitle}>How Your Score Is Calculated</Text>
          </View>
          <Text style={styles.formulaSubtitle}>
            Your platform and group rankings are dynamically weighted by these factors:
          </Text>

          <View style={styles.formulaGrid}>
            {FORMULA.map(({ label, weight, color }) => (
              <View key={label} style={styles.formulaCard}>
                <View style={[styles.formulaBadge, { backgroundColor: color }]}>
                  <Text style={styles.formulaBadgeText}>{weight}%</Text>
                </View>
                <Text style={styles.formulaLabel}>{label}</Text>
              </View>
            ))}
          </View>
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
  btnRecalculate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 2,
  },
  btnRecalculateDisabled: { opacity: 0.7 },
  btnRecalculateText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  countBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },

  // Overall Rank Card
  overallMainRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  rankBadge: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  rankNum: { fontSize: 32, fontWeight: '900', color: '#fbbf24' },
  rankBadgeLabel: { fontSize: 8, fontWeight: 'bold', color: '#94a3b8', marginTop: 2, letterSpacing: 0.5 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreVal: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  scoreMax: { fontSize: 12, color: '#94a3b8', fontWeight: 'normal' },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreBarFill: { height: '100%', backgroundColor: '#0f172a', borderRadius: 4 },
  previousRankText: { fontSize: 11, color: '#64748b' },

  subScoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subScoreItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subScoreVal: { fontSize: 14, fontWeight: 'bold' },
  subScoreLab: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '500' },

  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: 11, fontWeight: '600' },

  // Empty State
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  btnGetRanked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  btnGetRankedText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Platform Leaderboard List
  leaderboardList: { gap: 8 },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  leaderboardRowCurrent: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  rankIconBox: { width: 34, alignItems: 'center', marginRight: 10 },
  medalCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  regularRankBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  regularRankText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },

  candInfo: { flex: 1, marginRight: 10 },
  candNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  candName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  youBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  candEmail: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  candScoreChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  candScoreChip: { fontSize: 9, fontWeight: '600' },

  candTotalCol: { alignItems: 'flex-end', minWidth: 44 },
  candTotalNum: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  candTotalLabel: { fontSize: 9, color: '#94a3b8' },

  // Group Rankings
  groupList: { gap: 12 },
  groupItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  groupItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupItemRankBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  groupItemRankNum: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  groupItemName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  groupItemWorkspace: { fontSize: 11, color: '#64748b' },
  groupItemTotalScoreCol: { alignItems: 'flex-end', minWidth: 44 },
  groupItemTotalScore: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  groupItemScoreLabel: { fontSize: 10, color: '#94a3b8' },

  groupPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  pillBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillVal: { fontSize: 13, fontWeight: 'bold' },
  pillLab: { fontSize: 9, color: '#64748b', marginTop: 2, fontWeight: '500' },

  rankMovementBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  rankMovementText: { fontSize: 11, color: '#64748b', lineHeight: 16 },

  // Formula Breakdown
  formulaSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 18 },
  formulaGrid: { gap: 8 },
  formulaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formulaBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formulaBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  formulaLabel: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
});

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
import { Trophy, TrendingUp, TrendingDown, Minus, BarChart2, Users, Layers, Award } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function RankingsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [grRes, wsRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get('/workspaces/teacher'),
      ]);
      const grps = grRes.data || [];
      const wss = wsRes.data || [];
      setGroups(grps);
      setWorkspaces(wss);

      if (grps.length > 0) {
        const target = selectedGroup
          ? grps.find((g: any) => g.id === selectedGroup.id) || grps[0]
          : grps[0];
        await loadRankings(target);
      }
      if (wss.length > 0) {
        const targetWs = selectedWorkspace
          ? wss.find((w: any) => w.id === selectedWorkspace.id) || wss[0]
          : wss[0];
        await loadComparison(targetWs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRankings = async (g: any) => {
    setSelectedGroup(g);
    try {
      const res = await apiClient.get(`/ranking/group/${g.id}`);
      setRankings(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComparison = async (ws: any) => {
    setSelectedWorkspace(ws);
    try {
      const res = await apiClient.get(`/workspaces/${ws.id}/compare`);
      setComparison(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [selectedGroup, selectedWorkspace]);

  useEffect(() => {
    fetchData();
  }, []);

  const renderRanking = (item: any, index: number) => {
    const isTop1 = index === 0;
    const isTop2 = index === 1;
    const isTop3 = index === 2;

    return (
      <TouchableOpacity
        key={item.user_id}
        style={[
          styles.rankCard,
          isTop1 && styles.firstRank,
          isTop2 && styles.secondRank,
          isTop3 && styles.thirdRank,
        ]}
        onPress={() => navigation.navigate('CandidateDetail', { id: item.user_id })}
        activeOpacity={0.7}
      >
        <View style={styles.rankBadgeCol}>
          <Text
            style={[
              styles.rankPos,
              isTop1 && { color: '#b45309' },
              isTop2 && { color: '#475569' },
              isTop3 && { color: '#c2410c' },
            ]}
          >
            #{item.rank_position || index + 1}
          </Text>
        </View>

        <View
          style={[
            styles.avatarCircle,
            isTop1 && { backgroundColor: '#fde68a' },
            isTop2 && { backgroundColor: '#e2e8f0' },
            isTop3 && { backgroundColor: '#ffedd5' },
          ]}
        >
          <Text style={styles.avatarLetter}>
            {(item.full_name?.charAt(0) || 'C').toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rankName} numberOfLines={1}>
            {item.full_name}
          </Text>
          <View style={styles.scorePillsRow}>
            <Text style={styles.scorePillText}>
              Practice: {Math.round(item.practice_score || 0)}
            </Text>
            <Text style={styles.scorePillText}>•</Text>
            <Text style={styles.scorePillText}>
              GitHub: {Math.round(item.github_score || 0)}
            </Text>
            <Text style={styles.scorePillText}>•</Text>
            <Text style={styles.scorePillText}>
              LC: {Math.round(item.leetcode_score || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.totalScoreCol}>
          <Text style={styles.totalScore}>{Math.round(item.total_score || 0)}</Text>
          <View style={styles.trendRow}>
            {item.rank_change > 0 ? (
              <>
                <TrendingUp size={10} color="#16a34a" />
                <Text style={[styles.trendText, { color: '#16a34a' }]}>
                  {item.rank_change}
                </Text>
              </>
            ) : item.rank_change < 0 ? (
              <>
                <TrendingDown size={10} color="#dc2626" />
                <Text style={[styles.trendText, { color: '#dc2626' }]}>
                  {Math.abs(item.rank_change)}
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
  };

  if (loading) {
    return (
      <DashboardLayout title="Rankings">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Performance Rankings">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
      >
        {/* Groups Selection Bar */}
        <Text style={styles.miniHeader}>YOUR GROUPS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupBar}>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupChip, selectedGroup?.id === g.id && styles.activeChip]}
              onPress={() => loadRankings(g)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedGroup?.id === g.id && styles.activeChipText]}>
                {g.name}
              </Text>
              {g.workspace_name ? (
                <Text style={[styles.chipWs, selectedGroup?.id === g.id && styles.activeChipWs]}>
                  {g.workspace_name}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workspace Group Comparison */}
        {workspaces.length > 0 && (
          <View style={styles.wsSection}>
            <Text style={styles.miniHeader}>COMPARE WORKSPACE GROUPS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wsBar}>
              {workspaces.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.wsChip, selectedWorkspace?.id === w.id && styles.activeWsChip]}
                  onPress={() => loadComparison(w)}
                  activeOpacity={0.7}
                >
                  <BarChart2 size={13} color={selectedWorkspace?.id === w.id ? '#fff' : '#7c3aed'} />
                  <Text style={[styles.wsChipText, selectedWorkspace?.id === w.id && styles.activeWsChipText]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {comparison.length > 0 && (
              <View style={styles.card}>
                <View style={styles.compHeader}>
                  <Layers size={16} color="#7c3aed" />
                  <Text style={styles.cardTitle}>
                    {selectedWorkspace?.name} — Group Comparison
                  </Text>
                </View>
                {comparison.map((c, i) => (
                  <View key={c.id || i} style={styles.compRow}>
                    <View style={styles.compRank}>
                      <Text style={styles.compRankText}>#{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.compName}>{c.name}</Text>
                      <Text style={styles.compSub}>
                        {c.candidate_count || 0} candidates • {c.weekly_attempts || 0} practice attempts
                      </Text>
                    </View>
                    <View style={styles.compMetrics}>
                      <View style={styles.compMetricBox}>
                        <Text style={styles.compMetricVal}>
                          {Math.round(c.avg_confidence || 0)}
                        </Text>
                        <Text style={styles.compMetricLab}>Avg</Text>
                      </View>
                      <View style={styles.compMetricBox}>
                        <Text style={styles.compMetricVal}>
                          {Math.round(c.top_score || 0)}
                        </Text>
                        <Text style={styles.compMetricLab}>Top</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Selected Group Leaderboard */}
        <View style={styles.rankingsHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Trophy size={18} color="#d97706" />
            <Text style={styles.sectionTitle}>
              Rankings — {selectedGroup?.name || 'Group'}
            </Text>
          </View>
          <Text style={styles.rankingsCount}>{rankings.length} Candidates</Text>
        </View>

        {rankings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Award size={36} color="#cbd5e1" />
            <Text style={styles.empty}>No candidate rankings recorded yet.</Text>
          </View>
        ) : (
          rankings.map((item, index) => renderRanking(item, index))
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  loadingBox: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 13 },
  miniHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  groupBar: { marginBottom: 16 },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  activeChipText: { color: '#fff' },
  chipWs: { fontSize: 9, color: '#94a3b8', marginTop: 1 },
  activeChipWs: { color: '#94a3b8' },

  wsSection: { marginBottom: 16 },
  wsBar: { marginBottom: 12 },
  wsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  activeWsChip: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  wsChipText: { fontSize: 12, color: '#7c3aed', fontWeight: 'bold' },
  activeWsChipText: { color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  compHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  compRank: { width: 28 },
  compRankText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  compName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  compSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  compMetrics: { flexDirection: 'row', gap: 8 },
  compMetricBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
  },
  compMetricVal: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  compMetricLab: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' },

  rankingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  rankingsCount: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  firstRank: { backgroundColor: '#fffdf5', borderColor: '#fef3c7' },
  secondRank: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  thirdRank: { backgroundColor: '#fff7ed', borderColor: '#ffedd5' },
  rankBadgeCol: { width: 28 },
  rankPos: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  rankName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  scorePillsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  scorePillText: { fontSize: 10, color: '#94a3b8' },
  totalScoreCol: { alignItems: 'flex-end', marginLeft: 8 },
  totalScore: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  trendText: { fontSize: 9, fontWeight: 'bold' },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10 },
});


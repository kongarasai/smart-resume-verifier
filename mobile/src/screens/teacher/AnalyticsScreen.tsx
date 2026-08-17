import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Target, Users, BookOpen, ChevronLeft, BarChart3, CheckCircle2 } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function GroupAnalyticsScreen({ route, navigation }: any) {
  const [groupId, setGroupId] = useState<string | null>(route.params?.groupId || null);
  const [groupName, setGroupName] = useState<string>(route.params?.groupName || '');
  const [groups, setGroups] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroupsAndAnalytics = async () => {
    try {
      const gRes = await apiClient.get('/groups');
      const grps = gRes.data || [];
      setGroups(grps);

      let targetId = groupId;
      if (!targetId && grps.length > 0) {
        targetId = grps[0].id;
        setGroupId(targetId);
        setGroupName(grps[0].name);
      }

      if (targetId) {
        const aRes = await apiClient.get(`/groups/${targetId}/analytics`);
        setData(aRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const selectGroup = async (g: any) => {
    setGroupId(g.id);
    setGroupName(g.name);
    setLoading(true);
    try {
      const aRes = await apiClient.get(`/groups/${g.id}/analytics`);
      setData(aRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroupsAndAnalytics();
  }, [groupId]);

  useEffect(() => {
    fetchGroupsAndAnalytics();
  }, []);

  const totalAssignments = data.length;
  const avgCompletion = totalAssignments
    ? Math.round(
        data.reduce((a, b) => a + (parseInt(b.completion_count) || 0), 0) / totalAssignments
      )
    : 0;
  const avgScore = totalAssignments
    ? Math.round(
        data.reduce((a, b) => a + (parseFloat(b.avg_score) || 0), 0) / totalAssignments
      )
    : 0;

  return (
    <DashboardLayout title="Assignment Analytics">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color="#64748b" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Group Selector Bar */}
        {groups.length > 0 && (
          <View style={styles.groupPickerWrap}>
            <Text style={styles.miniHeader}>SELECT GROUP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupBar}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupChip, groupId === g.id && styles.activeGroupChip]}
                  onPress={() => selectGroup(g)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.groupChipText, groupId === g.id && styles.activeGroupChipText]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>
            {groupName ? `${groupName} Analytics` : 'Group Assignment Analytics'}
          </Text>
          <Text style={styles.headerSub}>Tracking candidate performance and completion rates</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            {/* 3 Summary Metric Cards */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <BookOpen size={18} color="#2563eb" />
                </View>
                <Text style={styles.statVal}>{totalAssignments}</Text>
                <Text style={styles.statLab}>Assignments</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconWrap, { backgroundColor: '#f0fdf4' }]}>
                  <Users size={18} color="#16a34a" />
                </View>
                <Text style={styles.statVal}>{avgCompletion}</Text>
                <Text style={styles.statLab}>Avg. Completions</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconWrap, { backgroundColor: '#f3e8ff' }]}>
                  <Target size={18} color="#7c3aed" />
                </View>
                <Text style={styles.statVal}>{avgScore}%</Text>
                <Text style={styles.statLab}>Avg. Score</Text>
              </View>
            </View>

            {/* Performance by Assignment */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={18} color="#0f172a" />
                <Text style={styles.sectionTitle}>Performance by Assignment</Text>
              </View>

              {data.length === 0 ? (
                <View style={styles.emptyBox}>
                  <BookOpen size={36} color="#cbd5e1" />
                  <Text style={styles.empty}>No assignments or submissions recorded yet.</Text>
                </View>
              ) : (
                data.map((item, idx) => {
                  const score = Math.round(parseFloat(item.avg_score) || 0);
                  const completions = parseInt(item.completion_count) || 0;

                  return (
                    <View key={idx} style={styles.assignmentCard}>
                      <View style={styles.assignmentHeader}>
                        <Text style={styles.assignmentTitle}>{item.name}</Text>
                        <View style={styles.completionPill}>
                          <CheckCircle2 size={12} color="#16a34a" />
                          <Text style={styles.completionText}>{completions} completed</Text>
                        </View>
                      </View>

                      <View style={styles.metricValuesRow}>
                        <View style={styles.metricValueItem}>
                          <Text style={styles.miniLab}>AVG SCORE</Text>
                          <Text style={[styles.valText, { color: '#0f172a' }]}>{score}%</Text>
                        </View>
                        <View style={styles.metricValueItem}>
                          <Text style={styles.miniLab}>COMPLETION COUNT</Text>
                          <Text style={[styles.valText, { color: '#2563eb' }]}>{completions}</Text>
                        </View>
                      </View>

                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.min(100, Math.max(5, score))}%`,
                              backgroundColor:
                                score >= 70
                                  ? '#16a34a'
                                  : score >= 40
                                  ? '#d97706'
                                  : '#dc2626',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: '#64748b', fontSize: 13, marginLeft: 4, fontWeight: '600' },

  groupPickerWrap: { marginBottom: 12 },
  miniHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  groupBar: { flexDirection: 'row' },
  groupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeGroupChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  groupChipText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  activeGroupChipText: { color: '#fff' },

  titleRow: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  statLab: { fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: 'center', fontWeight: 'bold' },

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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },

  assignmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 8 },
  completionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  completionText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  metricValuesRow: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  metricValueItem: {},
  miniLab: { fontSize: 8, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  valText: { fontSize: 16, fontWeight: 'bold', marginTop: 1 },

  barBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  empty: { textAlign: 'center', padding: 10, color: '#94a3b8', fontSize: 12 },
});


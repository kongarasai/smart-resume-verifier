import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { TrendingUp, Users, Target, ShieldCheck, BarChart3 } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hr/analytics');
      setData(res.data?.data || res.data);
    } catch (err) {
      console.log('Analytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const totalEvaluated =
    data?.funnel?.reduce((acc: number, cur: any) => acc + (parseInt(cur.count, 10) || 0), 0) || 0;

  const maxSkillCount = Math.max(...(data?.skills?.map((s: any) => Number(s.count) || 0) || [1]), 1);
  const maxFunnelCount = Math.max(...(data?.funnel?.map((f: any) => Number(f.count) || 0) || [1]), 1);

  return (
    <DashboardLayout title="Talent Analytics" scrollable={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Talent Analytics</Text>
          <Text style={styles.heroSubtitle}>
            Real-time insights into your candidate pool and recruitment pipeline
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loaderText}>Loading analytics data...</Text>
          </View>
        ) : (
          <>
            {/* Top 3 KPI Cards matching Frontend */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#0f172a' }]}>
                  <TrendingUp size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.kpiLabel}>AVG. CONFIDENCE</Text>
                  <Text style={styles.kpiValue}>{data?.avg_confidence || 0}%</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#2563eb' }]}>
                  <ShieldCheck size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.kpiLabel}>TOP SKILL</Text>
                  <Text style={[styles.kpiValue, { textTransform: 'capitalize' }]}>
                    {data?.skills?.[0]?.skill || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#f1f5f9' }]}>
                  <Users size={20} color="#0f172a" />
                </View>
                <View>
                  <Text style={styles.kpiLabel}>HIRING FUNNEL</Text>
                  <Text style={styles.kpiValue}>{totalEvaluated} Evaluated</Text>
                </View>
              </View>
            </View>

            {/* Skill Distribution Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Target size={18} color="#0f172a" />
                <Text style={styles.cardTitle}>Skill Distribution</Text>
              </View>

              {(!data?.skills || data.skills.length === 0) ? (
                <Text style={styles.emptyText}>No verified skills data available yet.</Text>
              ) : (
                <View style={styles.barList}>
                  {data.skills.slice(0, 7).map((s: any) => {
                    const count = Number(s.count) || 0;
                    const pct = Math.round((count / maxSkillCount) * 100);

                    return (
                      <View key={s.skill} style={styles.barRow}>
                        <View style={styles.barLabelCol}>
                          <Text style={styles.barSkillName} numberOfLines={1}>
                            {s.skill}
                          </Text>
                          <Text style={styles.barCountText}>{count} candidates</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Recruitment Funnel Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Users size={18} color="#0f172a" />
                <Text style={styles.cardTitle}>Recruitment Funnel</Text>
              </View>

              {(!data?.funnel || data.funnel.length === 0) ? (
                <Text style={styles.emptyText}>No candidate funnel activity logged yet.</Text>
              ) : (
                <View style={styles.funnelList}>
                  {data.funnel.map((f: any, idx: number) => {
                    const count = Number(f.count) || 0;
                    const pct = Math.round((count / maxFunnelCount) * 100);

                    return (
                      <View key={f.status || idx} style={styles.funnelRow}>
                        <View style={styles.funnelTextRow}>
                          <Text style={styles.funnelStatusName}>{f.status}</Text>
                          <Text style={styles.funnelCountVal}>{count}</Text>
                        </View>
                        <View style={styles.funnelTrack}>
                          <View
                            style={[
                              styles.funnelFill,
                              {
                                width: `${pct}%`,
                                backgroundColor: idx === 0 ? '#0f172a' : idx === 1 ? '#334155' : idx === 2 ? '#64748b' : '#94a3b8',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  loaderWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    color: '#64748b',
  },
  kpiGrid: {
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  barList: {
    gap: 12,
  },
  barRow: {
    gap: 4,
  },
  barLabelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barSkillName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  barCountText: {
    fontSize: 11,
    color: '#64748b',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 4,
  },
  funnelList: {
    gap: 12,
  },
  funnelRow: {
    gap: 4,
  },
  funnelTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  funnelStatusName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  funnelCountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  funnelTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  funnelFill: {
    height: '100%',
    borderRadius: 4,
  },
});


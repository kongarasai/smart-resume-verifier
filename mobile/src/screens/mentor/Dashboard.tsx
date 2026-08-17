import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function MentorDashboard({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [grRes, wsRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get('/workspaces'),
      ]);
      setGroups(grRes.data || []);
      setWorkspaces(wsRes.data || []);
    } catch (err) {
      console.error('Failed to load mentor dashboard groups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalMembers = groups.reduce((s, g) => s + (parseInt(g.member_count) || 0), 0);

  const stats = [
    { label: 'Active Groups', value: groups.length, color: '#1a6fa8' },
    { label: 'Total Candidates', value: totalMembers, color: '#2d9e5f' },
    { label: 'Workspaces', value: workspaces.length, color: '#7c3aed' },
  ];

  return (
    <DashboardLayout title="Mentor Portal">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1c1917']}
            tintColor="#1c1917"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title & Subtitle matching Frontend */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mentor Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Manage your groups, track candidate progress
          </Text>
        </View>

        {/* 3 Metrics Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Content: Groups List or Loading or Empty State */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1c1917" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={42} color="#d6d3d1" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyDesc}>
              Create a workspace and add groups to start managing candidates.
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('MentorGroups')}
              activeOpacity={0.8}
            >
              <Text style={styles.createBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupsSection}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <View style={styles.groupsList}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.groupCard}
                  onPress={() =>
                    navigation.navigate('MentorGroups', {
                      groupId: g.id,
                      selectedGroupId: g.id,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{g.name}</Text>
                    <Text style={styles.groupMeta}>
                      {g.workspace_name ? `${g.workspace_name} · ` : ''}
                      {g.member_count || 0} members
                    </Text>
                  </View>

                  <View style={styles.groupStatsRight}>
                    <View style={styles.countBox}>
                      <Text style={styles.groupCountVal}>{g.member_count || 0}</Text>
                      <Text style={styles.groupCountLab}>members</Text>
                    </View>
                    <ChevronRight size={16} color="#d6d3d1" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f5', // matching frontend warm light background
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1917',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#78716c',
    letterSpacing: -0.1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0eee6',
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78716c',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0eee6',
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13.5,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  createBtn: {
    backgroundColor: '#1c1917',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '600',
  },
  groupsSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  groupsList: {
    gap: 10,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0eee6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  groupInfo: {
    flex: 1,
    paddingRight: 12,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1917',
    marginBottom: 3,
  },
  groupMeta: {
    fontSize: 12.5,
    color: '#78716c',
  },
  groupStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBox: {
    alignItems: 'center',
  },
  groupCountVal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1917',
  },
  groupCountLab: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 1,
  },
});

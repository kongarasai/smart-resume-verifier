import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { Search, ChevronRight, User, Mail, Eye, Users } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function GroupCandidatesScreen({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await apiClient.get('/groups');
      const grps = res.data || [];
      setGroups(grps);
      const allMembers: any[] = [];

      for (const g of grps) {
        const mRes = await apiClient.get(`/groups/${g.id}/members`);
        const members = mRes.data || [];
        for (const m of members) {
          if (m.group_role === 'candidate') {
            allMembers.push({ ...m, group_name: g.name, group_id: g.id });
          }
        }
      }

      // Deduplicate by user_id
      const uniqueMap = new Map();
      for (const m of allMembers) {
        if (!uniqueMap.has(m.user_id)) {
          uniqueMap.set(m.user_id, m);
        }
      }
      setCandidates(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCandidates();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSendReminder = (candidate: any) => {
    if (!candidate.email) {
      Alert.alert('Notice', 'No email address registered for this candidate.');
      return;
    }
    const subject = encodeURIComponent('Checking in on your Progress');
    const body = encodeURIComponent(
      `Hi ${candidate.full_name},\n\nThis is a quick check-in from your instructor regarding your progress and practice assignments. Keep up the momentum!\n\nBest regards,\nInstructor`
    );
    Linking.openURL(`mailto:${candidate.email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Reminder', `Sent reminder notification to ${candidate.full_name} (${candidate.email})`);
    });
  };

  const filtered = candidates.filter((c) => {
    const matchesGroup = selectedGroupId === 'all' || c.group_id === selectedGroupId;
    const matchesSearch =
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.group_name?.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const renderCandidate = ({ item }: any) => {
    const lastPractice = item.last_practice ? new Date(item.last_practice) : null;
    const daysSince = lastPractice
      ? Math.floor((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CandidateDetail', { id: item.user_id })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.full_name?.charAt(0) || 'C').toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.full_name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
          {Boolean(item.group_name) && (
            <Text style={styles.groupBadgeText}>{item.group_name}</Text>
          )}

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SCORE</Text>
              <Text style={[styles.metricVal, { color: '#16a34a' }]}>
                {item.confidence_score || 0}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>RANK</Text>
              <Text style={[styles.metricVal, { color: '#2563eb' }]}>
                {item.rank_position ? `#${item.rank_position}` : '—'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ACTIVE</Text>
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
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.mailBtn}
            onPress={() => handleSendReminder(item)}
          >
            <Mail size={16} color="#475569" />
          </TouchableOpacity>
          <ChevronRight size={18} color="#cbd5e1" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DashboardLayout title="Candidates" scrollable={false}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search candidate by name or email..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Group Filter Chips */}
        {groups.length > 0 && (
          <View style={styles.filterWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupChips}>
              <TouchableOpacity
                style={[styles.groupChip, selectedGroupId === 'all' && styles.activeChip]}
                onPress={() => setSelectedGroupId('all')}
              >
                <Text style={[styles.chipText, selectedGroupId === 'all' && styles.activeChipText]}>
                  All Groups ({candidates.length})
                </Text>
              </TouchableOpacity>

              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupChip, selectedGroupId === g.id && styles.activeChip]}
                  onPress={() => setSelectedGroupId(g.id)}
                >
                  <Text style={[styles.chipText, selectedGroupId === g.id && styles.activeChipText]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading candidates...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderCandidate}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Users size={40} color="#cbd5e1" />
                <Text style={styles.empty}>No candidates found.</Text>
              </View>
            }
          />
        )}
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, color: '#0f172a' },

  filterWrap: { marginHorizontal: 16, marginBottom: 10 },
  groupChips: { flexDirection: 'row' },
  groupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  activeChipText: { color: '#fff' },

  loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },

  list: { paddingHorizontal: 16, paddingBottom: 30 },
  card: {
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  name: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  email: { fontSize: 11, color: '#64748b', marginTop: 1 },
  groupBadgeText: { fontSize: 10, color: '#7c3aed', fontWeight: 'bold', marginTop: 2 },

  metricsRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  metricItem: {},
  metricLabel: { fontSize: 8, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  metricVal: { fontSize: 12, fontWeight: 'bold', marginTop: 1 },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mailBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 10 },
});


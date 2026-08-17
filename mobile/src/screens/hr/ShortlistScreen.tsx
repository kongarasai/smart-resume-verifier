import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Star, Trash2, ChevronRight, UserCheck, ShieldCheck } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function ShortlistScreen({ navigation }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchShortlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hr/shortlist');
      setData(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.log('Shortlist fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShortlist();
  };

  const handleRemove = (candidateId: string, name: string) => {
    Alert.alert(
      'Remove Candidate',
      `Are you sure you want to remove ${name || 'this candidate'} from your shortlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusyId(candidateId);
            try {
              await apiClient.delete(`/hr/shortlist/${candidateId}`);
              setData((prev) => prev.filter((r) => r.candidate_id !== candidateId));
            } catch (err) {
              console.log('Remove error:', err);
              Alert.alert('Error', 'Failed to remove candidate from shortlist');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <DashboardLayout title="Shortlisted" scrollable={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <View style={styles.titleRow}>
            <Star size={24} color="#eab308" fill="#eab308" />
            <Text style={styles.heroTitle}>Shortlisted Candidates</Text>
          </View>
          <Text style={styles.heroSubtitle}>Candidates you marked for follow-up and evaluation</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loaderText}>Loading shortlisted candidates...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyCard}>
            <UserCheck size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No shortlisted candidates yet</Text>
            <Text style={styles.emptyDesc}>Candidates you shortlist from the candidate pool will appear here.</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {data.map((item) => (
              <View key={item.candidate_id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardMain}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('CandidateDetail', { id: item.candidate_id })}
                >
                  <View style={styles.avatarWrap}>
                    {Boolean(item.photo_url) ? (
                      <Image source={{ uri: item.photo_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {(item.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.candidateName} numberOfLines={1}>
                      {item.full_name || 'Candidate'}
                    </Text>
                    <Text style={styles.headlineText} numberOfLines={1}>
                      {item.headline || item.email || 'Professional'}
                    </Text>
                    <Text style={styles.subInfoText}>
                      {item.location || '—'} · Score: {item.overall_score ?? '—'}
                    </Text>
                  </View>

                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.removeBtn, busyId === item.candidate_id && styles.removeBtnDisabled]}
                  disabled={busyId === item.candidate_id}
                  onPress={() => handleRemove(item.candidate_id, item.full_name)}
                >
                  {busyId === item.candidate_id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Trash2 size={13} color="#dc2626" />
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginTop: 4,
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
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  listWrap: {
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  infoCol: {
    flex: 1,
    marginLeft: 10,
    marginRight: 4,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  headlineText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  subInfoText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeBtnDisabled: {
    opacity: 0.6,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
});


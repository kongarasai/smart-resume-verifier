import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Code, RefreshCw, Award, Target, Zap, CheckCircle, ExternalLink } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function LeetCodeScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [leetcodeUrl, setLeetcodeUrl] = useState('');

  const fetchData = async () => {
    try {
      const [lcRes, profRes] = await Promise.all([
        apiClient.get('/leetcode/data').catch(() => ({ data: null })),
        apiClient.get('/profile').catch(() => ({ data: null })),
      ]);
      const lcData = lcRes.data;
      setData(lcData);
      const url = lcData?.leetcode_url || profRes.data?.profile?.leetcode_url || '';
      if (url) setLeetcodeUrl(url);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async () => {
    const urlToUse = leetcodeUrl.trim();
    if (!urlToUse) {
      return Alert.alert('Notice', 'Please enter your LeetCode profile URL or username.');
    }
    setVerifying(true);
    try {
      const res = await apiClient.post('/leetcode/verify', { leetcode_url: urlToUse });
      setData(res.data);
      if (res.data?.leetcode_url) setLeetcodeUrl(res.data.leetcode_url);
      Alert.alert('Success', `LeetCode profile @${res.data.username || 'user'} synced successfully!`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'LeetCode verification failed. Please check the URL.');
    } finally {
      setVerifying(false);
    }
  };

  const hasVerifiedData = Boolean(
    data &&
      (data.coding_evidence_score != null ||
        data.total_solved != null ||
        data.username ||
        data.leetcode_username) &&
      !data.not_verified_yet
  );

  if (loading) {
    return (
      <DashboardLayout title="LeetCode">
        <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="LeetCode Analytics">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* URL Input & Sync Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Code size={18} color="#0f172a" />
            <Text style={styles.inputTitle}>LeetCode Profile Link / Username</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={leetcodeUrl}
              onChangeText={setLeetcodeUrl}
              placeholder="e.g. https://leetcode.com/u/username"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.btnVerify, verifying && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnVerifyText}>{hasVerifiedData ? 'Re-sync' : 'Sync'}</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>Enter your LeetCode username or full profile URL.</Text>
        </View>

        {!hasVerifiedData ? (
          <View style={styles.emptyState}>
            <Code size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Not Linked Yet</Text>
            <Text style={styles.emptyDesc}>
              Enter your LeetCode username above and tap Sync to pull your solved problem counts, contest rankings, and verified coding skills.
            </Text>
          </View>
        ) : (
          <View>
            {/* Header Score Card */}
            <View style={styles.header}>
              <Text style={styles.scoreLabel}>CODING EVIDENCE SCORE</Text>
              <Text style={styles.scoreVal}>
                {data.coding_evidence_score ?? data.leetcode_score ?? 0}
                <Text style={styles.scoreMax}>/100</Text>
              </Text>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${data.coding_evidence_score ?? data.leetcode_score ?? 0}%`,
                      backgroundColor: (data.coding_evidence_score ?? data.leetcode_score ?? 0) >= 70 ? '#10b981' : (data.coding_evidence_score ?? data.leetcode_score ?? 0) >= 40 ? '#f59e0b' : '#ef4444',
                    },
                  ]}
                />
              </View>
              <View style={styles.headerFooterRow}>
                <Text style={styles.verifiedSub}>
                  Synced profile: @{data.username || data.leetcode_username || 'user'}
                </Text>
                {Boolean(data.username || data.leetcode_username) && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://leetcode.com/u/${data.username || data.leetcode_username}`)}
                    style={styles.viewProfileBtn}
                  >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                    <ExternalLink size={11} color="#2563eb" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Main Solved Stats */}
            <View style={styles.mainStats}>
              <View style={styles.mainStatBox}>
                <Text style={styles.mainStatVal}>{data.total_solved || 0}</Text>
                <Text style={styles.mainStatLab}>PROBLEMS SOLVED</Text>
              </View>
              <View style={styles.statsCol}>
                <View style={styles.miniStat}>
                  <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.miniLabel}>Easy: {data.easy_solved || 0}</Text>
                </View>
                <View style={styles.miniStat}>
                  <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.miniLabel}>Med: {data.medium_solved || 0}</Text>
                </View>
                <View style={styles.miniStat}>
                  <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.miniLabel}>Hard: {data.hard_solved || 0}</Text>
                </View>
              </View>
            </View>

            {/* Global Standing */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Award size={18} color="#0f172a" />
                <Text style={styles.cardTitle}>Global Standing</Text>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>GLOBAL RANK</Text>
                  <Text style={styles.metaVal}>{data.ranking ? `#${data.ranking.toLocaleString()}` : '—'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>CONTEST RATING</Text>
                  <Text style={styles.metaVal}>{data.contest_rating ? Math.round(data.contest_rating) : '—'}</Text>
                </View>
              </View>
            </View>

            {/* Languages Used */}
            {data.languages_used && data.languages_used.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Languages Used</Text>
                <View style={styles.chipRow}>
                  {data.languages_used.map((lang: string) => (
                    <View key={lang} style={styles.chip}>
                      <Text style={styles.chipText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 60, backgroundColor: '#f8fafc' },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inputTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnVerify: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  btnDisabled: { opacity: 0.7 },
  btnVerifyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  inputHint: { fontSize: 11, color: '#94a3b8', marginTop: 8 },

  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },

  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  scoreLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  scoreVal: { fontSize: 38, fontWeight: '900', color: '#0f172a', marginVertical: 6 },
  scoreMax: { fontSize: 18, color: '#cbd5e1' },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%' },
  headerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  verifiedSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },

  mainStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 16,
  },
  mainStatBox: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    paddingRight: 8,
  },
  mainStatVal: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  mainStatLab: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginTop: 4, letterSpacing: 0.5 },
  statsCol: { flex: 1, justifyContent: 'center', gap: 8 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  miniLabel: { fontSize: 12, color: '#475569', fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 12 },
  metaLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.8 },
  metaVal: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },

  sectionWrap: { marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipText: { fontSize: 12, color: '#1e293b', fontWeight: '600' },
});

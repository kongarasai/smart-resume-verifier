import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { HeaderBar } from '../../components/HeaderBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Colors } from '../../theme/colors';
import { candidateAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, Github, Code2, Award, Zap } from 'lucide-react-native';

export default function CandidateDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [githubInput, setGithubInput] = useState('');
  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncingLeetcode, setSyncingLeetcode] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await candidateAPI.getProfile();
      const p = res?.data || res;
      setProfile(p);
      if (p.github_username) setGithubInput(p.github_username);
      if (p.leetcode_username) setLeetcodeInput(p.leetcode_username);
    } catch (e) {
      console.error('Failed to fetch candidate profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleVerifyGithub = async () => {
    if (!githubInput.trim()) return;
    setSyncingGithub(true);
    try {
      await candidateAPI.verifyGithub(githubInput.trim());
      Alert.alert('Success', 'GitHub account verified & synced!');
      fetchProfileData();
    } catch (e: any) {
      Alert.alert('Sync Failed', e.response?.data?.error || 'Failed to verify GitHub username');
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleVerifyLeetcode = async () => {
    if (!leetcodeInput.trim()) return;
    setSyncingLeetcode(true);
    try {
      await candidateAPI.verifyLeetcode(leetcodeInput.trim());
      Alert.alert('Success', 'LeetCode account verified & synced!');
      fetchProfileData();
    } catch (e: any) {
      Alert.alert('Sync Failed', e.response?.data?.error || 'Failed to verify LeetCode username');
    } finally {
      setSyncingLeetcode(false);
    }
  };

  const trustScore = profile?.trust_score ?? 85;

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Candidate Portal" />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProfileData();
            }}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Profile Card */}
        <Card style={styles.heroCard}>
          <View style={styles.profileRow}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{user?.full_name || 'Candidate'}</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
            <View style={styles.scoreGauge}>
              <Text style={styles.scoreNumber}>{trustScore}</Text>
              <Text style={styles.scoreLabel}>Trust Score</Text>
            </View>
          </View>
        </Card>

        {/* Verification Integrations */}
        <Text style={styles.sectionHeader}>Verification & Signals</Text>

        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitleRow}>
              <Github color={Colors.accent} size={20} />
              <Text style={styles.cardTitle}>GitHub Integration</Text>
            </View>
            <Badge
              label={profile?.github_username ? 'Verified' : 'Unverified'}
              variant={profile?.github_username ? 'green' : 'amber'}
            />
          </View>

          <TextInput
            style={styles.input}
            value={githubInput}
            onChangeText={setGithubInput}
            placeholder="Enter GitHub username"
            placeholderTextColor={Colors.ink[500]}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleVerifyGithub}
            disabled={syncingGithub}
          >
            {syncingGithub ? (
              <ActivityIndicator color={Colors.ink[950]} />
            ) : (
              <Text style={styles.syncBtnText}>Sync GitHub Repositories</Text>
            )}
          </TouchableOpacity>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitleRow}>
              <Code2 color={Colors.signal.blue} size={20} />
              <Text style={styles.cardTitle}>LeetCode Statistics</Text>
            </View>
            <Badge
              label={profile?.leetcode_username ? 'Verified' : 'Unverified'}
              variant={profile?.leetcode_username ? 'green' : 'amber'}
            />
          </View>

          <TextInput
            style={styles.input}
            value={leetcodeInput}
            onChangeText={setLeetcodeInput}
            placeholder="Enter LeetCode username"
            placeholderTextColor={Colors.ink[500]}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleVerifyLeetcode}
            disabled={syncingLeetcode}
          >
            {syncingLeetcode ? (
              <ActivityIndicator color={Colors.ink[950]} />
            ) : (
              <Text style={styles.syncBtnText}>Sync LeetCode Stats</Text>
            )}
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: Colors.ink[900], borderWidth: 1, borderColor: Colors.accent },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 13, color: Colors.ink[400] },
  nameText: { fontSize: 20, fontWeight: 'bold', color: Colors.ink[50] },
  emailText: { fontSize: 12, color: Colors.ink[400], marginTop: 2 },
  scoreGauge: { alignItems: 'center', backgroundColor: Colors.ink[950], padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  scoreNumber: { fontSize: 24, fontWeight: 'bold', color: Colors.accent },
  scoreLabel: { fontSize: 10, color: Colors.ink[300], marginTop: 2 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50], marginTop: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.ink[50] },
  input: { backgroundColor: Colors.ink[950], borderRadius: 10, padding: 12, color: Colors.ink[50], fontSize: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  syncBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  syncBtnText: { color: Colors.ink[950], fontWeight: 'bold', fontSize: 14 },
});

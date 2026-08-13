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
  Alert,
} from 'react-native';
import { HeaderBar } from '../../components/HeaderBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Colors } from '../../theme/colors';
import { hrAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Search, UserCheck } from 'lucide-react-native';

export default function HRDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await hrAPI.searchCandidates({ q: searchQuery });
      const list = Array.isArray(res) ? res : res?.data || [];
      setCandidates(list);
    } catch (e) {
      console.error('HR candidates fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="HR Talent Portal" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greetingText}>Welcome back, HR Partner</Text>
            <Text style={styles.nameText}>{user?.full_name || 'Recruiter'}</Text>
          </View>
          <Badge label="HR Recruiter" variant="amber" />
        </View>

        <View style={styles.searchBox}>
          <Search color={Colors.ink[400]} size={18} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search candidates..."
            placeholderTextColor={Colors.ink[500]}
            onSubmitEditing={fetchCandidates}
          />
        </View>

        <Text style={styles.sectionHeader}>Candidate Pool</Text>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginVertical: 20 }} />
        ) : candidates.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No verified candidates found.</Text>
          </Card>
        ) : (
          candidates.map((c) => (
            <Card key={c._id || c.id}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.candidateName}>{c.full_name || c.email}</Text>
                  <Text style={styles.candidateEmail}>{c.email}</Text>
                </View>
                <Badge label={`Trust: ${c.trust_score || 85}`} variant="green" />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  greetingText: { fontSize: 13, color: Colors.ink[400] },
  nameText: { fontSize: 22, fontWeight: 'bold', color: Colors.ink[50] },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink[900], borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.ink[50], fontSize: 14 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50], marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.ink[400] },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  candidateName: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50] },
  candidateEmail: { fontSize: 12, color: Colors.ink[400] },
});

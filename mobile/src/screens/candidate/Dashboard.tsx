import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Sparkles, Calendar, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/apiClient';

export default function CandidateDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/interviews')
      .then(res => setInterviews(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Candidate Dashboard</Text>
        <Text style={styles.subGreeting}>Welcome back to your workspace</Text>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View style={styles.iconContainer}>
            <Sparkles size={24} color="#a855f7" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.welcomeTitle}>Welcome back, {user?.full_name || 'Candidate'}!</Text>
            <Text style={styles.welcomeSub}>Verify your skills, track progress, and practice for your next opportunity.</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Interviews')}>
            <Text style={styles.viewAllBtn}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#0f172a" style={{ marginTop: 20 }} />
        ) : interviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No scheduled interviews found.</Text>
          </View>
        ) : (
          interviews.slice(0, 3).map(i => (
            <View key={i.id} style={styles.interviewCard}>
              <View style={styles.interviewInfo}>
                <Text style={styles.interviewName}>{i.hr_name || 'Interview Session'}</Text>
                <Text style={styles.interviewMeta}>{i.scheduled_date} at {i.scheduled_time}</Text>
              </View>
              <View style={[styles.statusBadge, i.status === 'scheduled' ? styles.badgeBlue : styles.badgeGreen]}>
                <Text style={styles.statusText}>{i.status.toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { marginBottom: 24, marginTop: 40 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  subGreeting: { fontSize: 16, color: '#64748b' },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {
    flex: 1
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  welcomeSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18
  },
  section: { marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  viewAllBtn: { fontSize: 13, color: '#4f46e5', fontWeight: 'bold' },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  emptyText: { color: '#94a3b8' },
  interviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  interviewInfo: {
    flex: 1
  },
  interviewName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  interviewMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeBlue: { backgroundColor: '#eff6ff' },
  badgeGreen: { backgroundColor: '#f0faf5' },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a'
  }
});

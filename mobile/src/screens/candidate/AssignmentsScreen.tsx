import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { BookOpen, ChevronRight, Clock, CheckCircle } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function AssignmentsScreen({ navigation }: any) {
  const [data, setData] = useState<{ groups: any[], assignments: any[] }>({ groups: [], assignments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/practice/assignments').then(res => {
      setData(res.data || { groups: [], assignments: [] });
    }).finally(() => setLoading(false));
  }, []);

  const renderAssignment = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AssignmentTest', { assignmentId: item.id, name: item.name })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.groupName}>{data.groups.find(g => g.id === item.group_id)?.name}</Text>
          <Text style={styles.metaSep}>•</Text>
          <Text style={styles.qCount}>{item.question_count} Questions</Text>
        </View>
        {item.expires_at && (
          <View style={styles.expiryRow}>
             <Clock size={10} color="#f59e0b" />
             <Text style={styles.expiryText}>Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  if (loading) return <DashboardLayout title="Assignments"><ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} /></DashboardLayout>;

  return (
    <DashboardLayout title="Group Assignments" scrollable={false}>
      <View style={styles.container}>
        <View style={styles.header}>
           <BookOpen size={32} color="#0f172a" />
           <Text style={styles.headerTitle}>Academic Tests</Text>
           <Text style={styles.headerDesc}>Specific problems assigned to you by your mentors and teachers.</Text>
        </View>

        <FlatList
          data={data.assignments}
          renderItem={renderAssignment}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
               <CheckCircle size={48} color="#cbd5e1" />
               <Text style={styles.emptyText}>You're all caught up!</Text>
               <Text style={styles.emptySub}>No active assignments for your groups.</Text>
            </View>
          }
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginTop: 15 },
  headerDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 5, paddingHorizontal: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, elevation: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  groupName: { fontSize: 11, color: '#0f172a', fontWeight: 'bold' },
  metaSep: { fontSize: 11, color: '#cbd5e1' },
  qCount: { fontSize: 11, color: '#64748b' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  expiryText: { fontSize: 10, color: '#f59e0b', fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 5 }
});

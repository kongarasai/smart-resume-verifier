import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, Code, Sparkles, Terminal } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';

const LANGUAGES = [
  { id: 'Java', name: 'Java', color: '#f97316', group: 'Enterprise' },
  { id: 'Python', name: 'Python', color: '#3b82f6', group: 'Data/AI' },
  { id: 'C', name: 'C', color: '#4f46e5', group: 'Systems' },
  { id: 'C++', name: 'C++', color: '#2563eb', group: 'Systems' },
  { id: 'JavaScript', name: 'JavaScript', color: '#eab308', group: 'Web' },
  { id: 'TypeScript', name: 'TypeScript', color: '#38bdf8', group: 'Web' },
  { id: 'Go', name: 'Go', color: '#06b6d4', group: 'Backend' },
  { id: 'Rust', name: 'Rust', color: '#c2410c', group: 'Systems' },
  { id: 'Kotlin', name: 'Kotlin', color: '#a855f7', group: 'Mobile/Backend' },
  { id: 'Swift', name: 'Swift', color: '#ea580c', group: 'Mobile' },
  { id: 'PHP', name: 'PHP', color: '#818cf8', group: 'Backend' },
  { id: 'Ruby', name: 'Ruby', color: '#dc2626', group: 'Backend' },
  { id: 'C#', name: 'C#', color: '#16a34a', group: 'Enterprise' },
  { id: 'Dart', name: 'Dart', color: '#2dd4bf', group: 'Mobile' },
  { id: 'R', name: 'R', color: '#1d4ed8', group: 'Data' },
  { id: 'MATLAB', name: 'MATLAB', color: '#d97706', group: 'Math' },
  { id: 'SQL', name: 'SQL', color: '#78716c', group: 'Database' },
  { id: 'Bash', name: 'Bash', color: '#334155', group: 'Scripting' },
  { id: 'Scala', name: 'Scala', color: '#ef4444', group: 'Enterprise' },
  { id: 'Objective-C', name: 'Objective-C', color: '#1e3a8a', group: 'Mobile' },
  { id: 'Haskell', name: 'Haskell', color: '#9333ea', group: 'Functional' },
  { id: 'Perl', name: 'Perl', color: '#60a5fa', group: 'Scripting' },
  { id: 'Julia', name: 'Julia', color: '#6366f1', group: 'Data' },
];

export default function CodingLanguagesScreen({ navigation }: any) {
  return (
    <DashboardLayout title="Coding Engine">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Practice')}
          activeOpacity={0.8}
        >
          <ChevronLeft size={16} color="#64748b" />
          <Text style={styles.backBtnText}>Back to Practice</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Language Practice Modules</Text>
          <Text style={styles.subtitle}>
            Choose from 23 supported languages. Each features comprehensive coding challenges in an anti-cheat monitored environment.
          </Text>
        </View>

        <View style={styles.grid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.card, { borderLeftColor: lang.color }]}
              onPress={() => navigation.navigate('CodingEditor', { language: lang.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Terminal size={14} color="#cbd5e1" />
              </View>
              <Text style={styles.langGroup}>{lang.group}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtnText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginLeft: 4 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  langName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  langGroup: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});

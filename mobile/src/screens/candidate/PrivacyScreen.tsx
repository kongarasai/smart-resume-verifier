import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Lock } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function PrivacyScreen() {
  const [settings, setSettings] = useState({
    allow_hr_view: true, allow_mentor_view: true, public_profile: false,
    show_skills_public: true, show_github: true, show_leetcode: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/profile').then((r: any) => {
      if (r.data.profile?.privacy) setSettings(r.data.profile.privacy);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/profile/privacy', settings);
      Alert.alert('Success', 'Privacy settings saved');
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const ToggleRow = ({ label, desc, field }: { label: string; desc: string; field: keyof typeof settings }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={settings[field]}
        onValueChange={(val) => setSettings(s => ({ ...s, [field]: val }))}
        trackColor={{ false: '#e2e8f0', true: '#0f172a' }}
      />
    </View>
  );

  if (loading) return <DashboardLayout title="Privacy"><ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} /></DashboardLayout>;

  return (
    <DashboardLayout title="Privacy Settings">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
           <Lock size={32} color="#0f172a" />
           <Text style={styles.title}>Data Controls</Text>
           <Text style={styles.subtitle}>Control who can see your profile and data</Text>
        </View>

        <View style={styles.card}>
           <Text style={styles.cardHeader}>PROFILE VISIBILITY</Text>
           <ToggleRow label="Allow HR view" desc="Recruiters can see your scores and skills" field="allow_hr_view" />
           <ToggleRow label="Allow Mentor view" desc="Mentors can track your progress" field="allow_mentor_view" />
           <ToggleRow label="Public Profile" desc="Visible via shareable link" field="public_profile" />
        </View>

        <View style={styles.card}>
           <Text style={styles.cardHeader}>DATA VISIBILITY</Text>
           <ToggleRow label="Show Skills" desc="Skills and levels visible to viewers" field="show_skills_public" />
           <ToggleRow label="Show GitHub" desc="Repo stats and commits visible" field="show_github" />
           <ToggleRow label="Show LeetCode" desc="Problem counts visible" field="show_leetcode" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
           {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
        </TouchableOpacity>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginTop: 15 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 5 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 1 },
  cardHeader: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rowDesc: { fontSize: 12, color: '#64748b', marginTop: 2, paddingRight: 10 },
  saveBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

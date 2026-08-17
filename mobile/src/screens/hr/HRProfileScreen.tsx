import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Building2,
  Briefcase,
  Globe,
  Linkedin,
  Mail,
  User,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function HRProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [form, setForm] = useState({
    company_name: '',
    designation: '',
    company_website: '',
    linkedin_url: '',
    hiring_interests: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHRProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hr-profile');
      const data = res.data || {};
      setUserData(data.user || null);
      const hr = data.hr_profile || {};
      setForm({
        company_name: hr.company_name || '',
        designation: hr.designation || '',
        company_website: hr.company_website || '',
        linkedin_url: hr.linkedin_url || '',
        hiring_interests: hr.hiring_interests || '',
      });
    } catch (err) {
      console.log('Fetch HR profile error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHRProfile();
  }, [fetchHRProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHRProfile();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/hr-profile', form);
      Alert.alert('Success', 'Recruiter profile updated successfully');
    } catch (err: any) {
      console.log('Update HR profile error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Company Profile" scrollable={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Recruiter Profile</Text>
          <Text style={styles.heroSubtitle}>
            Manage your company information and candidate hiring preferences
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loaderText}>Loading recruiter profile...</Text>
          </View>
        ) : (
          <>
            {/* User Info Header Card */}
            <View style={styles.userCard}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarInitial}>
                  {(userData?.full_name || 'H').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userData?.full_name || 'HR Recruiter'}</Text>
                <Text style={styles.userEmail}>{userData?.email || 'hr@company.com'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>RECRUITER PORTAL</Text>
                </View>
              </View>
            </View>

            {/* Profile Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Company & Position Details</Text>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>COMPANY NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Acme Technologies"
                  placeholderTextColor="#94a3b8"
                  value={form.company_name}
                  onChangeText={(t) => setForm((f) => ({ ...f, company_name: t }))}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>DESIGNATION / ROLE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Senior Talent Acquisition Manager"
                  placeholderTextColor="#94a3b8"
                  value={form.designation}
                  onChangeText={(t) => setForm((f) => ({ ...f, designation: t }))}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>COMPANY WEBSITE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://company.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="url"
                  value={form.company_website}
                  onChangeText={(t) => setForm((f) => ({ ...f, company_website: t }))}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>LINKEDIN URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://linkedin.com/in/..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="url"
                  value={form.linkedin_url}
                  onChangeText={(t) => setForm((f) => ({ ...f, linkedin_url: t }))}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>HIRING INTERESTS (COMMA SEPARATED)</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="e.g. Full Stack Developer, Data Engineer, Cloud Architect"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  value={form.hiring_interests}
                  onChangeText={(t) => setForm((f) => ({ ...f, hiring_interests: t }))}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Save size={16} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
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
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  fieldWrap: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  multilineInput: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    height: 44,
    borderRadius: 10,
    marginTop: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});


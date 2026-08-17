import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Linking,
} from 'react-native';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Users,
  Monitor,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  X,
  UserCheck,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';

const MODE_ICONS: Record<string, any> = {
  video: Video,
  phone: Phone,
  in_person: Users,
  technical: Monitor,
  hr: Users,
  final: UserCheck,
};

export default function InterviewsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isHR = user?.role === 'hr';

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  // Schedule Modal State for HR
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduled_time: '10:00 AM',
    mode: 'technical',
    meeting_link: '',
    notes: '',
  });

  const fetchInterviews = async () => {
    try {
      const res = await apiClient.get('/interviews');
      setInterviews(res.data || []);
    } catch (err) {
      console.log('Failed to fetch interviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCandidates = async () => {
    if (!isHR) return;
    setLoadingCandidates(true);
    try {
      const res = await apiClient.get('/hr/candidates');
      const list = Array.isArray(res.data) ? res.data : res.data?.candidates || [];
      setCandidates(list);
    } catch (err) {
      console.log('Failed to load candidate list:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    if (isHR) {
      fetchCandidates();
    }
  }, [isHR]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInterviews();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/interviews/${id}`, { status });
      Alert.alert('Success', `Interview marked as ${status}`);
      fetchInterviews();
    } catch {
      Alert.alert('Error', 'Failed to update interview status');
    }
  };

  const handleCreateInterview = async () => {
    if (!selectedCandidate) {
      Alert.alert('Select Candidate', 'Please select a candidate to schedule an interview.');
      return;
    }
    if (!scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
      Alert.alert('Missing Fields', 'Please select interview date and time.');
      return;
    }

    setScheduleSubmitting(true);
    try {
      await apiClient.post('/interviews', {
        candidate_id: selectedCandidate.id,
        scheduled_date: scheduleForm.scheduled_date,
        scheduled_time: scheduleForm.scheduled_time,
        mode: scheduleForm.mode,
        meeting_link: scheduleForm.meeting_link,
        notes: scheduleForm.notes,
      });

      Alert.alert(
        'Success',
        `Interview scheduled with ${selectedCandidate.full_name || 'candidate'}!`
      );
      setShowScheduleModal(false);
      setSelectedCandidate(null);
      fetchInterviews();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const openLink = (url: string) => {
    if (!url) return;
    const full = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(full).catch(() => Alert.alert('Error', 'Could not open meeting link'));
  };

  const filteredInterviews = interviews.filter((i) => {
    if (filterTab === 'all') return true;
    return i.status === filterTab;
  });

  const scheduledCount = interviews.filter((i) => i.status === 'scheduled').length;
  const completedCount = interviews.filter((i) => i.status === 'completed').length;
  const cancelledCount = interviews.filter((i) => i.status === 'cancelled').length;

  const filteredCandidates = candidates.filter((c) => {
    if (!candidateSearch) return true;
    const q = candidateSearch.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.headline?.toLowerCase().includes(q)
    );
  });

  const renderInterview = ({ item: i }: any) => {
    const Icon = MODE_ICONS[i.mode] || Calendar;
    const isScheduled = i.status === 'scheduled';
    const isCompleted = i.status === 'completed';
    const isCancelled = i.status === 'cancelled';

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Icon size={20} color="#0f172a" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{isHR ? i.candidate_name || 'Candidate' : i.hr_name || 'HR Recruiter'}</Text>
              <View
                style={[
                  styles.statusBadge,
                  isScheduled && styles.badgeBlue,
                  isCompleted && styles.badgeGreen,
                  isCancelled && styles.badgeRed,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isScheduled && styles.textBlue,
                    isCompleted && styles.textGreen,
                    isCancelled && styles.textRed,
                  ]}
                >
                  {i.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Calendar size={13} color="#64748b" />
              <Text style={styles.metaText}>{i.scheduled_date}</Text>
              <Clock size={13} color="#64748b" style={{ marginLeft: 10 }} />
              <Text style={styles.metaText}>{i.scheduled_time}</Text>
              <View style={styles.modeTag}>
                <Text style={styles.modeTagText}>
                  {String(i.mode || 'Technical').toUpperCase()}
                </Text>
              </View>
            </View>

            {i.notes ? <Text style={styles.notes}>"{i.notes}"</Text> : null}

            {i.meeting_link ? (
              <TouchableOpacity
                style={styles.meetingLinkRow}
                onPress={() => openLink(i.meeting_link)}
              >
                <ExternalLink size={13} color="#2563eb" />
                <Text style={styles.meetingLinkText} numberOfLines={1}>
                  {i.meeting_link}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* HR Action Controls */}
        {isHR && isScheduled && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnComplete}
              onPress={() => updateStatus(i.id, 'completed')}
            >
              <CheckCircle size={14} color="#059669" />
              <Text style={styles.btnTextGreen}>Complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => updateStatus(i.id, 'cancelled')}
            >
              <XCircle size={14} color="#ef4444" />
              <Text style={styles.btnTextRed}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnMessage}
              onPress={() => navigation.navigate('Messages')}
            >
              <MessageSquare size={14} color="#0f172a" />
              <Text style={styles.btnTextMessage}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <DashboardLayout title="Interviews" scrollable={false}>
      <View style={styles.container}>
        {/* Header with quick stats & schedule button */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {isHR ? 'Candidate Interviews' : 'My Scheduled Interviews'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isHR
                ? 'Manage technical screenings & hiring rounds'
                : 'Upcoming and past interview sessions'}
            </Text>
          </View>

          {isHR && (
            <TouchableOpacity
              style={styles.btnScheduleNew}
              onPress={() => {
                setShowScheduleModal(true);
                if (candidates.length === 0) fetchCandidates();
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.btnScheduleNewText}>Schedule</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { key: 'all', label: `All (${interviews.length})` },
            { key: 'scheduled', label: `Upcoming (${scheduledCount})` },
            { key: 'completed', label: `Done (${completedCount})` },
            { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabChip, filterTab === t.key && styles.tabChipActive]}
              onPress={() => setFilterTab(t.key as any)}
            >
              <Text
                style={[
                  styles.tabChipText,
                  filterTab === t.key && styles.tabChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading interviews...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredInterviews}
            renderItem={renderInterview}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 30 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Calendar size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No interviews found</Text>
                <Text style={styles.emptyDesc}>
                  {isHR
                    ? 'Tap the "+ Schedule" button above or visit a candidate profile to schedule a technical or HR interview.'
                    : 'Interviews scheduled with HR recruiters will appear here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* HR Schedule Interview Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color="#0f172a" />
                <Text style={styles.modalTitle}>Schedule Interview</Text>
              </View>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {/* Candidate Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SELECT CANDIDATE</Text>
                {selectedCandidate ? (
                  <View style={styles.selectedCandidateCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedCandidateName}>
                        {selectedCandidate.full_name || 'Candidate'}
                      </Text>
                      <Text style={styles.selectedCandidateSub} numberOfLines={1}>
                        {selectedCandidate.headline || selectedCandidate.email}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedCandidate(null)}
                      style={styles.changeCandidateBtn}
                    >
                      <Text style={styles.changeCandidateText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={styles.searchBox}>
                      <Search size={14} color="#94a3b8" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search candidate name or skill..."
                        placeholderTextColor="#94a3b8"
                        value={candidateSearch}
                        onChangeText={setCandidateSearch}
                      />
                    </View>

                    {loadingCandidates ? (
                      <ActivityIndicator size="small" color="#0f172a" style={{ marginVertical: 10 }} />
                    ) : (
                      <ScrollView style={styles.candidatePickerList} nestedScrollEnabled>
                        {filteredCandidates.slice(0, 8).map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.candidatePickerItem}
                            onPress={() => setSelectedCandidate(c)}
                          >
                            <View style={styles.pickerAvatar}>
                              <Text style={styles.pickerAvatarText}>
                                {(c.full_name?.charAt(0) || 'C').toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pickerName}>{c.full_name}</Text>
                              <Text style={styles.pickerHeadline} numberOfLines={1}>
                                {c.headline || c.location || 'Candidate'}
                              </Text>
                            </View>
                            <Text style={styles.selectText}>Select</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Date Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>INTERVIEW DATE (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="2026-08-16"
                  placeholderTextColor="#94a3b8"
                  value={scheduleForm.scheduled_date}
                  onChangeText={(t) => setScheduleForm((s) => ({ ...s, scheduled_date: t }))}
                />
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() =>
                      setScheduleForm((s) => ({
                        ...s,
                        scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                      }))
                    }
                  >
                    <Text style={styles.presetChipText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() =>
                      setScheduleForm((s) => ({
                        ...s,
                        scheduled_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
                      }))
                    }
                  >
                    <Text style={styles.presetChipText}>In 2 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() =>
                      setScheduleForm((s) => ({
                        ...s,
                        scheduled_date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
                      }))
                    }
                  >
                    <Text style={styles.presetChipText}>Next Week</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>INTERVIEW TIME</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="10:00 AM"
                  placeholderTextColor="#94a3b8"
                  value={scheduleForm.scheduled_time}
                  onChangeText={(t) => setScheduleForm((s) => ({ ...s, scheduled_time: t }))}
                />
                <View style={styles.presetRow}>
                  {['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'].map((tm) => (
                    <TouchableOpacity
                      key={tm}
                      style={[
                        styles.presetChip,
                        scheduleForm.scheduled_time === tm && styles.presetChipActive,
                      ]}
                      onPress={() => setScheduleForm((s) => ({ ...s, scheduled_time: tm }))}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          scheduleForm.scheduled_time === tm && styles.presetChipTextActive,
                        ]}
                      >
                        {tm}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Round Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ROUND TYPE</Text>
                <View style={styles.modeRow}>
                  {[
                    { key: 'technical', label: 'Technical' },
                    { key: 'hr', label: 'HR / Culture' },
                    { key: 'final', label: 'Final Round' },
                    { key: 'video', label: 'Video Call' },
                  ].map((m) => {
                    const active = scheduleForm.mode === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.modeChip, active && styles.modeChipActive]}
                        onPress={() => setScheduleForm((s) => ({ ...s, mode: m.key }))}
                      >
                        <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Meeting Link */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>MEETING LINK (OPTIONAL)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={scheduleForm.meeting_link}
                  onChangeText={(t) => setScheduleForm((s) => ({ ...s, meeting_link: t }))}
                />
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>NOTES / INSTRUCTIONS</Text>
                <TextInput
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                  placeholder="Instructions for candidate..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={scheduleForm.notes}
                  onChangeText={(t) => setScheduleForm((s) => ({ ...s, notes: t }))}
                />
              </View>

              {/* Action Buttons */}
              <View style={{ marginTop: 15, marginBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.btnSubmitModal, scheduleSubmitting && { opacity: 0.6 }]}
                  onPress={handleCreateInterview}
                  disabled={scheduleSubmitting}
                >
                  {scheduleSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Calendar size={16} color="#ffffff" />
                      <Text style={styles.btnSubmitModalText}>Confirm & Send Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  btnScheduleNew: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnScheduleNewText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },

  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  tabChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tabChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  tabChipTextActive: { color: '#ffffff' },

  loadingBox: { marginTop: 60, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#64748b' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: 'row', gap: 12 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeBlue: { backgroundColor: '#eff6ff' },
  badgeGreen: { backgroundColor: '#f0fdf4' },
  badgeRed: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 9, fontWeight: '800' },
  textBlue: { color: '#2563eb' },
  textGreen: { color: '#16a34a' },
  textRed: { color: '#dc2626' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  modeTag: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  modeTagText: { fontSize: 9, fontWeight: '700', color: '#475569' },

  notes: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 8 },
  meetingLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 6,
  },
  meetingLinkText: { fontSize: 11, color: '#2563eb', fontWeight: '600', flex: 1 },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnComplete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnTextGreen: { color: '#16a34a', fontSize: 11, fontWeight: 'bold' },
  btnTextRed: { color: '#dc2626', fontSize: 11, fontWeight: 'bold' },
  btnTextMessage: { color: '#0f172a', fontSize: 11, fontWeight: 'bold' },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 14 },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },

  formGroup: { marginBottom: 12 },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#0f172a' },

  candidatePickerList: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 10,
  },
  candidatePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 10,
  },
  pickerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerAvatarText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  pickerName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  pickerHeadline: { fontSize: 10, color: '#64748b' },
  selectText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },

  selectedCandidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 10,
  },
  selectedCandidateName: { fontSize: 13, fontWeight: 'bold', color: '#166534' },
  selectedCandidateSub: { fontSize: 11, color: '#15803d', marginTop: 2 },
  changeCandidateBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  changeCandidateText: { fontSize: 11, fontWeight: 'bold', color: '#166534' },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  presetChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  presetChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  presetChipTextActive: { color: '#ffffff' },

  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  modeChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  modeChipTextActive: { color: '#ffffff' },

  btnSubmitModal: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSubmitModalText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});

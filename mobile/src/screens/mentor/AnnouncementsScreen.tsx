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
  Linking,
} from 'react-native';
import { Megaphone, Plus, FileText, Send, Calendar, ExternalLink, Users } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function AnnouncementsScreen() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [form, setForm] = useState({ title: '', content: '', attachment_url: '' });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get('/groups');
      const grps = res.data || [];
      setGroups(grps);
      const targetId = selectedGroupId || grps[0]?.id || '';
      if (targetId) {
        setSelectedGroupId(targetId);
        await loadAnnouncements(targetId);
      }
    } catch (err) {
      console.error('Failed to fetch groups for announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAnnouncements = async (gid: string) => {
    try {
      const res = await apiClient.get(`/groups/${gid}/announcements`);
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedGroupId) {
      loadAnnouncements(selectedGroupId).finally(() => setRefreshing(false));
    } else {
      fetchGroups();
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupChange = (gid: string) => {
    setSelectedGroupId(gid);
    loadAnnouncements(gid);
  };

  const handlePost = async () => {
    if (!selectedGroupId) {
      return Alert.alert('Required', 'Please select a cohort group.');
    }
    if (!form.title.trim() || !form.content.trim()) {
      return Alert.alert('Required', 'Please enter announcement title and content.');
    }
    setPosting(true);
    try {
      await apiClient.post('/announcements', {
        group_id: selectedGroupId,
        title: form.title.trim(),
        content: form.content.trim(),
        attachment_url: form.attachment_url.trim() || undefined,
      });

      Alert.alert('Success', 'Announcement broadcasted to all group members!');
      setForm({ title: '', content: '', attachment_url: '' });
      loadAnnouncements(selectedGroupId);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  const openAttachment = (url: string) => {
    if (!url) return;
    const full = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(full).catch(() => Alert.alert('Error', 'Could not open attachment link'));
  };

  if (loading) {
    return (
      <DashboardLayout title="Announcements">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading announcement boards...</Text>
        </View>
      </DashboardLayout>
    );
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <DashboardLayout title="Announcements">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Intro */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Megaphone size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Broadcast Announcements</Text>
            <Text style={styles.subtitle}>
              Keep candidate cohorts updated on assignments, schedules, and deadlines
            </Text>
          </View>
        </View>

        {/* Group Selector Bar */}
        {groups.length > 0 && (
          <View style={styles.groupPickerWrap}>
            <Text style={styles.miniHeader}>TARGET GROUP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupBar}>
              {groups.map((g) => {
                const isSelected = selectedGroupId === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupChip, isSelected && styles.activeGroupChip]}
                    onPress={() => handleGroupChange(g.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.groupChipText, isSelected && styles.activeGroupChipText]}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Announcement Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>
            New Post {selectedGroup ? `to ${selectedGroup.name}` : ''}
          </Text>

          <Text style={styles.label}>Announcement Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Week 4 Project Review & Deadline"
            placeholderTextColor="#94a3b8"
            value={form.title}
            onChangeText={(t) => setForm((s) => ({ ...s, title: t }))}
          />

          <Text style={styles.label}>Message / Details *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="Write your announcement details, instructions, or meeting links..."
            placeholderTextColor="#94a3b8"
            value={form.content}
            onChangeText={(t) => setForm((s) => ({ ...s, content: t }))}
          />

          <Text style={styles.label}>Attachment URL / Resource Link (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. https://docs.google.com/presentation/..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            value={form.attachment_url}
            onChangeText={(t) => setForm((s) => ({ ...s, attachment_url: t }))}
          />

          <TouchableOpacity
            style={styles.postBtn}
            onPress={handlePost}
            disabled={posting || groups.length === 0}
            activeOpacity={0.8}
          >
            {posting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={16} color="#fff" />
                <Text style={styles.postBtnText}>Broadcast to Cohort</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Announcements Feed */}
        <View style={styles.feedCard}>
          <Text style={styles.feedTitle}>
            Recent Announcements ({announcements.length})
          </Text>

          {announcements.length === 0 ? (
            <View style={styles.emptyBox}>
              <Megaphone size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>No announcements posted to this group yet.</Text>
            </View>
          ) : (
            announcements.map((item, idx) => (
              <View key={item.id || idx} style={styles.annItem}>
                <View style={styles.annHeaderRow}>
                  <Text style={styles.annItemTitle}>{item.title}</Text>
                  <View style={styles.datePill}>
                    <Calendar size={10} color="#64748b" />
                    <Text style={styles.dateText}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.annItemContent}>{item.content}</Text>

                {Boolean(item.attachment_url) && (
                  <TouchableOpacity
                    style={styles.attachmentLink}
                    onPress={() => openAttachment(item.attachment_url)}
                  >
                    <ExternalLink size={12} color="#2563eb" />
                    <Text style={styles.attachmentLinkText} numberOfLines={1}>
                      {item.attachment_url}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  loadingBox: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 13 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 1 },

  groupPickerWrap: { marginBottom: 12 },
  miniHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  groupBar: { flexDirection: 'row' },
  groupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeGroupChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  groupChipText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  activeGroupChipText: { color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    gap: 8,
  },
  formTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginTop: 4 },
  input: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 13,
    color: '#0f172a',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  feedTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  annItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  annHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  annItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 8 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateText: { fontSize: 10, color: '#64748b' },
  annItemContent: { fontSize: 12, color: '#475569', lineHeight: 18 },
  attachmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  attachmentLinkText: { fontSize: 11, color: '#2563eb', fontWeight: 'bold' },

  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
});

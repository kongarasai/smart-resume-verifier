import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { HeaderBar } from '../../components/HeaderBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Colors } from '../../theme/colors';
import { groupAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Users, Megaphone, Plus } from 'lucide-react-native';

export default function MentorDashboard() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const fetchMentorData = async () => {
    try {
      const res = await groupAPI.getGroups();
      const groupList = Array.isArray(res) ? res : res?.data || [];
      setGroups(groupList);
      if (groupList.length > 0) setSelectedGroupId(groupList[0]._id || groupList[0].id);
    } catch (e) {
      console.error('Failed to load mentor groups:', e);
    }
  };

  useEffect(() => {
    fetchMentorData();
  }, []);

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim() || !selectedGroupId) {
      Alert.alert('Announcement', 'Please select a group and enter announcement text.');
      return;
    }
    try {
      await groupAPI.createAnnouncement({
        group_id: selectedGroupId,
        content: announcementText.trim(),
      });
      Alert.alert('Success', 'Broadcast announcement sent to candidates!');
      setAnnouncementText('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to post announcement.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Mentor Workspace" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greetingText}>Welcome back, Mentor</Text>
            <Text style={styles.nameText}>{user?.full_name || 'Mentor'}</Text>
          </View>
          <Badge label="Mentor Portal" variant="blue" />
        </View>

        <Text style={styles.sectionHeader}>Group Workspaces</Text>
        {groups.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No active group workspaces found.</Text>
          </Card>
        ) : (
          groups.map((g) => (
            <Card key={g._id || g.id}>
              <View style={styles.cardRow}>
                <View style={styles.iconTitleRow}>
                  <Users color={Colors.accent} size={20} />
                  <Text style={styles.groupName}>{g.name || 'Student Cohort'}</Text>
                </View>
                <Badge label={`${g.members?.length || 0} Members`} variant="green" />
              </View>
              <Text style={styles.groupDesc}>{g.description || 'Candidate verification & tracking cohort'}</Text>
            </Card>
          ))
        )}

        <Text style={styles.sectionHeader}>Broadcast Announcements</Text>
        <Card>
          <View style={styles.iconTitleRow}>
            <Megaphone color={Colors.accent} size={20} />
            <Text style={styles.cardTitle}>Broadcast to Candidates</Text>
          </View>
          <TextInput
            style={styles.textArea}
            value={announcementText}
            onChangeText={setAnnouncementText}
            placeholder="Type cohort notice..."
            placeholderTextColor={Colors.ink[500]}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.postBtn} onPress={handlePostAnnouncement}>
            <Text style={styles.postBtnText}>Post Announcement</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greetingText: { fontSize: 13, color: Colors.ink[400] },
  nameText: { fontSize: 22, fontWeight: 'bold', color: Colors.ink[50] },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50], marginTop: 12, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  groupName: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50] },
  groupDesc: { fontSize: 13, color: Colors.ink[300] },
  emptyText: { fontSize: 14, color: Colors.ink[400] },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50] },
  textArea: { backgroundColor: Colors.ink[950], borderRadius: 10, padding: 12, color: Colors.ink[50], fontSize: 14, borderWidth: 1, borderColor: Colors.border, height: 90, textAlignVertical: 'top', marginBottom: 12 },
  postBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  postBtnText: { color: Colors.ink[950], fontWeight: 'bold', fontSize: 14 },
});

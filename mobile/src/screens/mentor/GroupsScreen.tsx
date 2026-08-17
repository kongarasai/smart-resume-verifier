import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Share,
  Modal,
  Platform,
} from 'react-native';
import {
  Plus,
  Users,
  Archive,
  UserMinus,
  Download,
  Send,
  BarChart2,
  Eye,
  AlertTriangle,
  Trophy,
  Trash2,
  X,
  Search,
  Mail,
  BookOpen,
  UserPlus,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function GroupsScreen({ route, navigation }: any) {
  const initialGroupId = route.params?.selectedGroupId;
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Forms & Inputs
  const [emailInput, setEmailInput] = useState('');
  const [addingMembers, setAddingMembers] = useState(false);
  const [addSummary, setAddSummary] = useState<any>(null);

  const [teacherEmail, setTeacherEmail] = useState('');
  const [showTeacherAdd, setShowTeacherAdd] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newWs, setNewWs] = useState({ name: '', description: '' });
  const [newGroup, setNewGroup] = useState({ workspace_id: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Workspace Comparison
  const [showComparison, setShowComparison] = useState(false);
  const [comparison, setComparison] = useState<any[]>([]);
  const [comparingWsName, setComparingWsName] = useState('');

  const loadInitialData = async () => {
    try {
      const [wsRes, grRes] = await Promise.all([
        apiClient.get('/workspaces'),
        apiClient.get('/groups'),
      ]);

      const wsList = wsRes.data || [];
      const grList = grRes.data || [];
      setWorkspaces(wsList);
      setGroups(grList);

      let targetGroup = null;
      if (initialGroupId) {
        targetGroup = grList.find((g: any) => g.id === initialGroupId);
      }
      if (!targetGroup && grList.length > 0) {
        targetGroup = grList[0];
      }

      if (targetGroup) {
        setSelectedGroup(targetGroup);
        await loadMembers(targetGroup.id);
      }
    } catch (err) {
      console.error('Failed to load groups data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMembers = async (gid: string) => {
    try {
      const res = await apiClient.get(`/groups/${gid}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load group members:', err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedGroup) {
      loadMembers(selectedGroup.id).finally(() => {
        loadInitialData();
      });
    } else {
      loadInitialData();
    }
  }, [selectedGroup]);

  useEffect(() => {
    loadInitialData();
  }, [initialGroupId]);

  const selectGroup = (g: any) => {
    setSelectedGroup(g);
    setAddSummary(null);
    setShowTeacherAdd(false);
    loadMembers(g.id);
  };

  // Workspace actions
  const handleCreateWorkspace = async () => {
    if (!newWs.name.trim()) {
      return Alert.alert('Required', 'Please enter a workspace name.');
    }
    setSubmitting(true);
    try {
      await apiClient.post('/workspaces', newWs);
      Alert.alert('Success', 'Workspace created successfully!');
      setNewWs({ name: '', description: '' });
      setShowCreateWsModal(false);
      loadInitialData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkspace = (ws: any) => {
    Alert.alert(
      'Delete Workspace',
      `Are you sure you want to delete workspace "${ws.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/workspaces/${ws.id}`);
              Alert.alert('Deleted', 'Workspace removed successfully.');
              loadInitialData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete workspace');
            }
          },
        },
      ]
    );
  };

  const loadWorkspaceComparison = async (ws: any) => {
    try {
      const res = await apiClient.get(`/workspaces/${ws.id}/compare`);
      setComparison(res.data || []);
      setComparingWsName(ws.name);
      setShowComparison(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to load workspace comparisons');
    }
  };

  // Group actions
  const handleCreateGroup = async () => {
    if (!newGroup.workspace_id) {
      return Alert.alert('Required', 'Please select a workspace for the new group.');
    }
    if (!newGroup.name.trim()) {
      return Alert.alert('Required', 'Please enter a group name.');
    }
    setSubmitting(true);
    try {
      await apiClient.post('/groups', newGroup);
      Alert.alert('Success', 'Cohort group created successfully!');
      setNewGroup({ workspace_id: '', name: '', description: '' });
      setShowCreateGroupModal(false);
      loadInitialData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveGroup = () => {
    if (!selectedGroup) return;
    Alert.alert(
      'Archive Group',
      `Are you sure you want to archive "${selectedGroup.name}"? Historical reports and scores will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/groups/${selectedGroup.id}/archive`);
              Alert.alert('Archived', 'Group archived successfully.');
              setSelectedGroup(null);
              loadInitialData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to archive group');
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    if (!selectedGroup) return;
    try {
      const res = await apiClient.get(`/groups/${selectedGroup.id}/export?format=csv`);
      const csvData = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      await Share.share({
        title: `${selectedGroup.name}_Candidate_Report.csv`,
        message: csvData,
      });
    } catch (err) {
      Alert.alert('Export Failed', 'Unable to export CSV at this time.');
    }
  };

  // Members / Candidates actions
  const handleAddCandidates = async () => {
    const emails = emailInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      return Alert.alert('Required', 'Please enter at least one candidate email address.');
    }

    setAddingMembers(true);
    try {
      const res = await apiClient.post('/groups/members/add', {
        group_id: selectedGroup.id,
        emails,
      });
      setAddSummary(res.data);
      setEmailInput('');
      loadMembers(selectedGroup.id);
      Alert.alert('Success', `Processed candidates. Added: ${res.data.added || 0}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleSendInvites = async (emails: string[]) => {
    if (!selectedGroup || !emails?.length) return;
    try {
      const res = await apiClient.post('/groups/invites', {
        group_id: selectedGroup.id,
        emails,
      });
      Alert.alert(
        'Invitations Sent',
        `Generated and emailed ${res.data.invites?.length || emails.length} invitation link(s)!`
      );
      setAddSummary(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send invites');
    }
  };

  const handleRemoveMember = (uid: string, name: string) => {
    if (!selectedGroup) return;
    Alert.alert(
      'Remove Member',
      `Remove ${name || 'user'} from ${selectedGroup.name}? Their profile and verification history will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/groups/members/remove', {
                group_id: selectedGroup.id,
                user_id: uid,
              });
              Alert.alert('Success', 'Member removed from group');
              loadMembers(selectedGroup.id);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleAddTeacher = async () => {
    if (!teacherEmail.trim()) {
      return Alert.alert('Required', 'Please enter teacher email address.');
    }
    setAddingTeacher(true);
    try {
      const res = await apiClient.post('/groups/teacher/add', {
        group_id: selectedGroup.id,
        email: teacherEmail.trim(),
      });
      Alert.alert('Success', res.data.message || 'Teacher assigned to group!');
      setTeacherEmail('');
      setShowTeacherAdd(false);
      loadMembers(selectedGroup.id);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to assign teacher. Make sure the user has role "teacher".'
      );
    } finally {
      setAddingTeacher(false);
    }
  };

  const candidates = members.filter((m) => m.group_role === 'candidate');
  const teachers = members.filter((m) => m.group_role === 'teacher');

  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.career_readiness?.toLowerCase().includes(q)
    );
  });

  const topPerformers = filteredCandidates.filter((c) => (c.confidence_score || 0) >= 60);
  const developingCandidates = filteredCandidates.filter((c) => (c.confidence_score || 0) < 60);

  return (
    <DashboardLayout title="Groups">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Title & Top Buttons */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>
              Manage workspaces, groups, candidates, and teachers
            </Text>
          </View>
          <View style={styles.topBtnRow}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => setShowCreateWsModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#1c1917" />
              <Text style={styles.btnSecondaryText}>Workspace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => setShowCreateGroupModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#ffffff" />
              <Text style={styles.btnPrimaryText}>Group</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading cohort workspace...</Text>
          </View>
        ) : (
          <>
            {/* Groups list section */}
            <View style={styles.sectionWrap}>
              <Text style={styles.columnHeader}>GROUPS ({groups.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupCardsRow}>
                {groups.map((g) => {
                  const isSelected = selectedGroup?.id === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.groupNavCard, isSelected && styles.activeGroupNavCard]}
                      onPress={() => selectGroup(g)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.groupNavCardTitle, isSelected && styles.activeGroupNavCardTitle]}>
                        {g.name}
                      </Text>
                      <Text style={[styles.groupNavCardSub, isSelected && styles.activeGroupNavCardSub]}>
                        {g.workspace_name ? `${g.workspace_name} · ` : ''}
                        {g.member_count || 0} members
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Compare Workspaces Section */}
            {workspaces.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.columnHeader}>COMPARE WORKSPACES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wsChipsScroll}>
                  {workspaces.map((w) => (
                    <View key={w.id} style={styles.wsItemPill}>
                      <TouchableOpacity
                        style={styles.wsItemBtn}
                        onPress={() => loadWorkspaceComparison(w)}
                        activeOpacity={0.7}
                      >
                        <BarChart2 size={13} color="#7c3aed" />
                        <Text style={styles.wsItemName}>{w.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.wsDeleteIconBtn}
                        onPress={() => handleDeleteWorkspace(w)}
                      >
                        <Trash2 size={11} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Main Detail Content Area */}
            {!selectedGroup ? (
              <View style={styles.emptySelectedBox}>
                <Users size={48} color="#cbd5e1" />
                <Text style={styles.emptySelectedTitle}>Select a group to manage</Text>
                <Text style={styles.emptySelectedSub}>
                  Choose a cohort above or create a new group to manage candidates and teachers.
                </Text>
              </View>
            ) : (
              <View style={styles.detailContainer}>
                {/* 1. Group Header Card (Screenshot 5) */}
                <View style={styles.card}>
                  <View style={styles.groupHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupTitleText}>{selectedGroup.name}</Text>
                      <Text style={styles.groupMetaText}>
                        {selectedGroup.workspace_name ? `${selectedGroup.workspace_name} · ` : ''}
                        {candidates.length} candidates · {teachers.length} teachers
                      </Text>
                    </View>
                  </View>

                  <View style={styles.groupActionBtnRow}>
                    <TouchableOpacity
                      style={styles.groupActionBtn}
                      onPress={() => navigation.navigate('Problems', { groupId: selectedGroup.id })}
                      activeOpacity={0.7}
                    >
                      <Plus size={13} color="#0f172a" />
                      <Text style={styles.groupActionBtnText}>Add Questions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.groupActionBtn}
                      onPress={handleExportCSV}
                      activeOpacity={0.7}
                    >
                      <Download size={13} color="#0f172a" />
                      <Text style={styles.groupActionBtnText}>Export CSV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.groupActionBtn}
                      onPress={() => setShowTeacherAdd(!showTeacherAdd)}
                      activeOpacity={0.7}
                    >
                      <UserPlus size={13} color="#0f172a" />
                      <Text style={styles.groupActionBtnText}>Add Teacher</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.groupActionBtn}
                      onPress={handleArchiveGroup}
                      activeOpacity={0.7}
                    >
                      <Archive size={13} color="#dc2626" />
                      <Text style={[styles.groupActionBtnText, { color: '#dc2626' }]}>Archive</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Teachers Card (Screenshot 5) */}
                <View style={styles.card}>
                  <Text style={styles.cardTitleHeader}>TEACHERS ({teachers.length})</Text>

                  {showTeacherAdd && (
                    <View style={styles.inlineTeacherForm}>
                      <TextInput
                        style={styles.input}
                        placeholder="Teacher email (e.g. teacher@institution.edu)"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={teacherEmail}
                        onChangeText={setTeacherEmail}
                      />
                      <TouchableOpacity
                        style={styles.inlineAddBtn}
                        onPress={handleAddTeacher}
                        disabled={addingTeacher}
                      >
                        {addingTeacher ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.inlineAddBtnText}>Assign</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {teachers.length === 0 ? (
                    <Text style={styles.emptyCardText}>No teachers assigned to this group yet.</Text>
                  ) : (
                    teachers.map((t) => (
                      <View key={t.user_id} style={styles.teacherRow}>
                        <View style={styles.teacherAvatar}>
                          <Text style={styles.teacherAvatarText}>
                            {(t.full_name?.charAt(0) || t.email?.charAt(0) || 'T').toLowerCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teacherNameText}>{t.full_name || 'Teacher'}</Text>
                          <Text style={styles.teacherEmailText}>{t.email}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeMemberBtn}
                          onPress={() => handleRemoveMember(t.user_id, t.full_name || t.email)}
                        >
                          <UserMinus size={15} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                {/* 3. Add Candidates by Email Card (Screenshot 5) */}
                <View style={styles.card}>
                  <Text style={styles.cardTitleHeader}>Add Candidates by Email</Text>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    placeholder="Emails (one per line or comma separated)"
                    placeholderTextColor="#94a3b8"
                    value={emailInput}
                    onChangeText={setEmailInput}
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={styles.addCandidatesBtn}
                    onPress={handleAddCandidates}
                    disabled={addingMembers}
                    activeOpacity={0.8}
                  >
                    {addingMembers ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Plus size={14} color="#fff" />
                        <Text style={styles.addCandidatesBtnText}>+ Add Candidates</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Summary Breakdown */}
                  {Boolean(addSummary) && (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryTitle}>Candidate Ingestion Result</Text>
                      <View style={styles.summaryMetricsRow}>
                        <Text style={styles.summaryMetricItem}>{`Total: ${addSummary.total_processed || 0}`}</Text>
                        <Text style={styles.summaryMetricItem}>{`Added: ${addSummary.added || 0}`}</Text>
                        <Text style={styles.summaryMetricItem}>{`Already in Group: ${addSummary.already_in_group?.length || 0}`}</Text>
                        <Text style={styles.summaryMetricItem}>{`Not Registered: ${addSummary.not_registered?.length || 0}`}</Text>
                      </View>

                      {Boolean(addSummary.not_registered && addSummary.not_registered.length > 0) && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.notRegNote}>Unregistered Emails detected:</Text>
                          <View style={styles.notRegChips}>
                            {addSummary.not_registered.map((email: string) => (
                              <View key={email} style={styles.notRegChip}>
                                <Text style={styles.notRegChipText}>{email}</Text>
                              </View>
                            ))}
                          </View>
                          <TouchableOpacity
                            style={styles.sendInvitesBtn}
                            onPress={() => handleSendInvites(addSummary.not_registered)}
                          >
                            <Send size={12} color="#fff" />
                            <Text style={styles.sendInvitesBtnText}>Send Registration Invites</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* 4. Candidates Overview Card (Screenshot 5) */}
                <View style={styles.card}>
                  <View style={styles.overviewHeaderRow}>
                    <Text style={styles.cardTitleHeader}>
                      {`Candidates Overview (${candidates.length})`}
                    </Text>
                    {candidates.length > 3 && (
                      <View style={styles.searchBar}>
                        <Search size={12} color="#94a3b8" />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search candidates..."
                          placeholderTextColor="#94a3b8"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                        />
                      </View>
                    )}
                  </View>

                  {/* Top Performers Section */}
                  <View style={styles.subCohortSection}>
                    <View style={styles.subCohortTitleRow}>
                      <Trophy size={14} color="#16a34a" />
                      <Text style={[styles.subCohortTitle, { color: '#16a34a' }]}>
                        TOP PERFORMERS
                      </Text>
                    </View>

                    {topPerformers.length === 0 ? (
                      <Text style={styles.emptySubCohortText}>
                        No top performers benchmarked.
                      </Text>
                    ) : (
                      topPerformers.map((c, i) => (
                        <View key={c.user_id} style={styles.candidateRow}>
                          <View style={styles.rankPill}>
                            <Text style={styles.rankPillText}>#{c.rank_position || i + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candNameText}>{c.full_name || 'Candidate'}</Text>
                            <Text style={styles.candEmailText}>{c.email}</Text>
                          </View>

                          <View style={styles.candMetricBox}>
                            <Text style={styles.candMetricVal}>{Math.round(c.confidence_score || 0)}</Text>
                            <Text style={styles.candMetricLab}>Score</Text>
                          </View>

                          <View style={styles.candMetricBox}>
                            <Text style={styles.candMetricVal}>
                              {(c.career_readiness || 'ready').replace('_', ' ')}
                            </Text>
                            <Text style={styles.candMetricLab}>Status</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.viewProfileBtn}
                            onPress={() => navigation.navigate('CandidateDetail', { id: c.user_id })}
                          >
                            <Eye size={12} color="#475569" />
                            <Text style={styles.viewProfileBtnText}>View Profile</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.removeMemberBtn}
                            onPress={() => handleRemoveMember(c.user_id, c.full_name || c.email)}
                          >
                            <UserMinus size={14} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Developing / At Risk Section */}
                  <View style={[styles.subCohortSection, { marginTop: 14 }]}>
                    <View style={styles.subCohortTitleRow}>
                      <AlertTriangle size={14} color="#d97706" />
                      <Text style={[styles.subCohortTitle, { color: '#d97706' }]}>
                        DEVELOPING / AT RISK
                      </Text>
                    </View>

                    {developingCandidates.length === 0 ? (
                      <Text style={styles.emptySubCohortText}>
                        No candidates currently flagged at-risk.
                      </Text>
                    ) : (
                      developingCandidates.map((c) => (
                        <View key={c.user_id} style={styles.candidateRow}>
                          <View style={styles.rankPill}>
                            <Text style={styles.rankPillText}>
                              {c.rank_position ? `#${c.rank_position}` : '#—'}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candNameText}>{c.full_name || 'Candidate'}</Text>
                            <Text style={styles.candEmailText}>{c.email}</Text>
                          </View>

                          <View style={styles.candMetricBox}>
                            <Text style={styles.candMetricVal}>{Math.round(c.confidence_score || 0)}</Text>
                            <Text style={styles.candMetricLab}>Score</Text>
                          </View>

                          <View style={styles.candMetricBox}>
                            <Text style={styles.candMetricVal}>
                              {(c.career_readiness || 'beginner').replace('_', ' ')}
                            </Text>
                            <Text style={styles.candMetricLab}>Status</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.viewProfileBtn}
                            onPress={() => navigation.navigate('CandidateDetail', { id: c.user_id })}
                          >
                            <Eye size={12} color="#475569" />
                            <Text style={styles.viewProfileBtnText}>View Profile</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.removeMemberBtn}
                            onPress={() => handleRemoveMember(c.user_id, c.full_name || c.email)}
                          >
                            <UserMinus size={14} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Modal: Workspace Comparison */}
        <Modal
          visible={showComparison}
          transparent
          animationType="fade"
          onRequestClose={() => setShowComparison(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comparison: {comparingWsName}</Text>
                <TouchableOpacity onPress={() => setShowComparison(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {comparison.map((c, i) => (
                  <View key={c.id || i} style={styles.compItem}>
                    <View style={styles.compRank}>
                      <Text style={styles.compRankVal}>#{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compItemName}>{c.name}</Text>
                      <Text style={styles.compItemMeta}>
                        {c.candidate_count || 0} candidates • {c.weekly_attempts || 0} tasks/wk
                      </Text>
                    </View>
                    <View style={styles.compScorePair}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.compScoreVal}>{Math.round(c.avg_confidence || 0)}%</Text>
                        <Text style={styles.compScoreLab}>Avg</Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.compScoreVal, { color: '#16a34a' }]}>
                          {Math.round(c.top_score || 0)}%
                        </Text>
                        <Text style={styles.compScoreLab}>Top</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal: Create Workspace */}
        <Modal
          visible={showCreateWsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateWsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Workspace</Text>
                <TouchableOpacity onPress={() => setShowCreateWsModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Workspace Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Saveetha Engineering"
                placeholderTextColor="#94a3b8"
                value={newWs.name}
                onChangeText={(t) => setNewWs((s) => ({ ...s, name: t }))}
              />

              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Department or program description..."
                placeholderTextColor="#94a3b8"
                value={newWs.description}
                onChangeText={(t) => setNewWs((s) => ({ ...s, description: t }))}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCreateWsModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCreateWorkspace}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Create Group */}
        <Modal
          visible={showCreateGroupModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateGroupModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Group</Text>
                <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Select Workspace *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wsChipSelectRow}>
                {workspaces.map((w) => {
                  const isSelected = newGroup.workspace_id === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.wsChipSelect, isSelected && styles.activeWsChipSelect]}
                      onPress={() => setNewGroup((s) => ({ ...s, workspace_id: w.id }))}
                    >
                      <Text style={[styles.wsChipSelectText, isSelected && styles.activeWsChipSelectText]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.modalLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. batch 1"
                placeholderTextColor="#94a3b8"
                value={newGroup.name}
                onChangeText={(t) => setNewGroup((s) => ({ ...s, name: t }))}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCreateGroupModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCreateGroup}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Create Group</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  headerTextWrap: {
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  topBtnRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1c1917',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  loadingBox: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },

  sectionWrap: { paddingHorizontal: 16, paddingTop: 14 },
  columnHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  groupCardsRow: { flexDirection: 'row' },
  groupNavCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    minWidth: 150,
  },
  activeGroupNavCard: {
    backgroundColor: '#fff',
    borderColor: '#0f172a',
    borderWidth: 1.5,
  },
  groupNavCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  activeGroupNavCardTitle: { color: '#0f172a' },
  groupNavCardSub: { fontSize: 11, color: '#64748b', marginTop: 3 },
  activeGroupNavCardSub: { color: '#475569' },

  wsChipsScroll: { flexDirection: 'row' },
  wsItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    gap: 6,
  },
  wsItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wsItemName: { fontSize: 12, color: '#7c3aed', fontWeight: 'bold' },
  wsDeleteIconBtn: { padding: 2 },

  emptySelectedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptySelectedTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 12 },
  emptySelectedSub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },

  detailContainer: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  groupHeaderRow: { marginBottom: 12 },
  groupTitleText: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  groupMetaText: { fontSize: 12, color: '#64748b', marginTop: 2 },

  groupActionBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  groupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  groupActionBtnText: { fontSize: 11, fontWeight: '600', color: '#0f172a' },

  cardTitleHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  inlineTeacherForm: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    flex: 1,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  inlineAddBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 10,
  },
  inlineAddBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyCardText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },

  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  teacherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#0369a1' },
  teacherNameText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  teacherEmailText: { fontSize: 10, color: '#64748b' },
  removeMemberBtn: { padding: 6 },

  addCandidatesBtn: {
    backgroundColor: '#26231e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addCandidatesBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  summaryBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  summaryTitle: { fontSize: 11, fontWeight: 'bold', color: '#166534', marginBottom: 4 },
  summaryMetricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryMetricItem: { fontSize: 10, color: '#15803d', fontWeight: '500' },
  notRegNote: { fontSize: 10, fontWeight: 'bold', color: '#92400e', marginTop: 4 },
  notRegChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  notRegChip: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notRegChipText: { fontSize: 9, color: '#92400e' },
  sendInvitesBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  sendInvitesBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    width: 140,
  },
  searchInput: { fontSize: 10, color: '#0f172a', marginLeft: 4, flex: 1, padding: 0 },

  subCohortSection: { marginTop: 6 },
  subCohortTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  subCohortTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  emptySubCohortText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 6 },

  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  rankPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankPillText: { fontSize: 10, fontWeight: 'bold', color: '#92400e' },
  candNameText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  candEmailText: { fontSize: 9, color: '#64748b' },
  candMetricBox: { alignItems: 'center', minWidth: 36 },
  candMetricVal: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  candMetricLab: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase' },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  viewProfileBtnText: { fontSize: 10, color: '#475569', fontWeight: '500' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modalLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#26231e',
    alignItems: 'center',
  },
  modalSubmitText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },

  wsChipSelectRow: { flexDirection: 'row', marginBottom: 4 },
  wsChipSelect: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeWsChipSelect: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  wsChipSelectText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  activeWsChipSelectText: { color: '#fff' },

  compItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  compRank: { width: 24 },
  compRankVal: { fontSize: 12, fontWeight: 'bold', color: '#7c3aed' },
  compItemName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  compItemMeta: { fontSize: 9, color: '#64748b' },
  compScorePair: { flexDirection: 'row', gap: 8 },
  compScoreVal: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  compScoreLab: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase' },
});

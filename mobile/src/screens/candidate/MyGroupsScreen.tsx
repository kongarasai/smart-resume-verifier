import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  Users,
  Megaphone,
  Trophy,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ChevronRight,
  X,
  Send,
  Award,
  Calendar,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

type SubTab = 'overview' | 'assignments' | 'questions' | 'expired' | 'announcements' | 'ranking';

export default function MyGroupsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(true);

  // Group Content
  const [questions, setQuestions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [expiredSubTab, setExpiredSubTab] = useState<'questions' | 'assignments'>('questions');

  // Single Question Attempt State
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [qAnswer, setQAnswer] = useState('');
  const [qResult, setQResult] = useState<any>(null);
  const [submittingQ, setSubmittingQ] = useState(false);

  // Assignment Test State
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [submittingTest, setSubmittingTest] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await apiClient.get('/my-groups');
      const grps = res.data || [];
      setGroups(grps);
      if (grps.length > 0) {
        selectGroup(grps[0]);
      }
    } catch (err: any) {
      console.log('Error fetching groups:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const selectGroup = async (g: any) => {
    setSelectedGroup(g);
    setSubTab('overview');
    setActiveQuestion(null);
    setActiveAssignment(null);
    setTestSubmitted(false);
    setTestAnswers({});
    setTestResult(null);
    setQResult(null);

    try {
      const [qRes, aRes, rRes, mRes] = await Promise.all([
        apiClient.get(`/groups/${g.id}/questions`),
        apiClient.get(`/groups/${g.id}/announcements`),
        apiClient.get(`/ranking/group/${g.id}`),
        apiClient.get(`/groups/${g.id}/members`),
      ]);
      setQuestions(qRes.data || []);
      setAnnouncements(aRes.data || []);
      setRankings(rRes.data || []);
      setMembers(mRes.data || []);
    } catch (err: any) {
      console.log('Error fetching group data:', err?.message);
    }
  };

  const reloadGroupData = async () => {
    if (!selectedGroup) return;
    try {
      const [qRes, aRes, rRes, mRes, gRes] = await Promise.all([
        apiClient.get(`/groups/${selectedGroup.id}/questions`),
        apiClient.get(`/groups/${selectedGroup.id}/announcements`),
        apiClient.get(`/ranking/group/${selectedGroup.id}`),
        apiClient.get(`/groups/${selectedGroup.id}/members`),
        apiClient.get('/my-groups'),
      ]);
      setQuestions(qRes.data || []);
      setAnnouncements(aRes.data || []);
      setRankings(rRes.data || []);
      setMembers(mRes.data || []);
      const updated = gRes.data || [];
      setGroups(updated);
      const match = updated.find((item: any) => item.id === selectedGroup.id);
      if (match) setSelectedGroup(match);
    } catch {}
  };

  const handleSingleSubmit = async (qId: string, ans: string) => {
    if (!ans) return;
    setSubmittingQ(true);
    try {
      const res = await apiClient.post('/practice/submit', {
        question_id: qId,
        submitted_answer: ans,
      });
      setQResult(res.data);
      if (res.data.is_correct) {
        Alert.alert('Correct!', `+${res.data.score || 10} points added to your score.`);
      } else if (res.data.is_correct === false) {
        Alert.alert('Incorrect', res.data.correct_answer ? `Correct answer was: ${res.data.correct_answer.toUpperCase()}` : 'Try again next time.');
      } else {
        Alert.alert('Submitted', 'Answer submitted for mentor review.');
      }
      reloadGroupData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit answer.');
    } finally {
      setSubmittingQ(false);
    }
  };

  const handleTestSubmit = async () => {
    if (!activeAssignment) return;
    setSubmittingTest(true);
    try {
      const res = await apiClient.post('/practice/submit-assignment-test', {
        assignment_id: activeAssignment.id,
        answers: testAnswers,
      });
      setTestResult(res.data);
      setTestSubmitted(true);
      Alert.alert('Success', 'Assignment submitted successfully!');
      reloadGroupData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit assignment.');
    } finally {
      setSubmittingTest(false);
    }
  };

  const activeAssignmentsList = Array.from(
    new Set(questions.filter(q => !q.is_expired && q.assignment_id).map(q => q.assignment_id))
  );

  const directQuestionsList = questions.filter(q => !q.is_expired && !q.assignment_id);
  const expiredQuestionsList = questions.filter(q => q.is_expired && !q.assignment_id);
  const expiredAssignmentsList = Array.from(
    new Set(questions.filter(q => q.is_expired && q.assignment_id).map(q => q.assignment_id))
  );

  const teachers = members.filter((m: any) => m.group_role === 'teacher');

  if (loading) {
    return (
      <DashboardLayout title="My Groups">
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </View>
      </DashboardLayout>
    );
  }

  if (groups.length === 0) {
    return (
      <DashboardLayout title="My Groups">
        <View style={styles.emptyContainer}>
          <Users size={60} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Groups Joined Yet</Text>
          <Text style={styles.emptyDesc}>
            Your mentor or teacher will add you to a cohort group. Check back soon!
          </Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Groups" scrollable={false}>
      <View style={styles.container}>
        {/* Horizontal Group Selector */}
        <View style={styles.groupBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupBar}>
            {groups.map((g) => {
              const isSelected = selectedGroup?.id === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupCard, isSelected && styles.activeGroupCard]}
                  onPress={() => selectGroup(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.groupCardTitle, isSelected && styles.activeGroupCardTitle]}>
                    {g.name}
                  </Text>
                  <Text style={[styles.groupCardSub, isSelected && styles.activeGroupCardSub]}>
                    {g.candidate_count || 0} members {g.rank_position ? `• Rank #${g.rank_position}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sub-Tab Navigation Bar */}
        <View style={styles.subTabBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabBar}>
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'assignments', label: `Assignments (${activeAssignmentsList.length})`, icon: BookOpen },
              { id: 'questions', label: `Questions (${directQuestionsList.length})`, icon: Star },
              { id: 'expired', label: `Expired (${questions.filter(q => q.is_expired).length})`, icon: Clock },
              { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
              { id: 'ranking', label: 'Leaderboard', icon: Trophy },
            ].map((tab) => {
              const isActive = subTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.subTabItem, isActive && styles.activeSubTabItem]}
                  onPress={() => setSubTab(tab.id as SubTab)}
                >
                  <tab.icon size={13} color={isActive ? '#0f172a' : '#64748b'} />
                  <Text style={[styles.subTabText, isActive && styles.activeSubTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 50 }}>
          {/* SubTab 1: Overview */}
          {subTab === 'overview' && selectedGroup && (
            <View style={styles.sectionArea}>
              <View style={styles.infoCard}>
                <Text style={styles.groupHeaderTitle}>{selectedGroup.name}</Text>
                <Text style={styles.groupHeaderSub}>
                  Mentor: {selectedGroup.mentor_name || 'Assigned Mentor'} • {selectedGroup.workspace_name || 'Cohort'}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{selectedGroup.candidate_count || members.length}</Text>
                    <Text style={styles.statLab}>Members</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: '#d97706' }]}>
                      {selectedGroup.rank_position ? `#${selectedGroup.rank_position}` : '—'}
                    </Text>
                    <Text style={styles.statLab}>Your Rank</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: '#059669' }]}>
                      {selectedGroup.total_score ? Math.round(selectedGroup.total_score) : 0}
                    </Text>
                    <Text style={styles.statLab}>Total Score</Text>
                  </View>
                </View>
              </View>

              {/* Teachers List */}
              {teachers.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardSectionLabel}>TEACHERS & INSTRUCTORS</Text>
                  {teachers.map((t: any) => (
                    <View key={t.user_id} style={styles.teacherRow}>
                      <View style={styles.teacherAvatar}>
                        <Text style={styles.teacherAvatarText}>
                          {(t.full_name?.charAt(0) || 'T').toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teacherName}>{t.full_name}</Text>
                        <Text style={styles.teacherRole}>Instructor</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* SubTab 2: Assignments */}
          {subTab === 'assignments' && (
            <View style={styles.sectionArea}>
              {activeAssignmentsList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={36} color="#cbd5e1" />
                  <Text style={styles.emptyCardTitle}>No Active Assignments</Text>
                  <Text style={styles.emptyCardSub}>
                    Assignments posted by your instructors will appear here.
                  </Text>
                </View>
              ) : (
                activeAssignmentsList.map((aid) => {
                  const assignmentQs = questions.filter(q => q.assignment_id === aid && !q.is_expired);
                  const aName = assignmentQs[0]?.assignment_name || 'Assignment';
                  const expiry = assignmentQs[0]?.expires_at;

                  return (
                    <View key={aid as string} style={styles.assignmentCard}>
                      <View style={styles.assignmentHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.assignmentTitle}>{aName}</Text>
                          <Text style={styles.assignmentMeta}>
                            {assignmentQs.length} questions
                            {expiry ? ` • Due ${new Date(expiry).toLocaleDateString()}` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.testBtn}
                          onPress={() => {
                            setActiveAssignment({ id: aid, name: aName, questions: assignmentQs, isExpired: false });
                            setTestAnswers({});
                            setTestSubmitted(false);
                            setTestResult(null);
                          }}
                        >
                          <Text style={styles.testBtnText}>Take Test</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.assignmentQuestionsList}>
                        {assignmentQs.map((q) => (
                          <View key={q.id} style={styles.miniQuestionRow}>
                            <Text style={styles.miniQuestionTitle} numberOfLines={1}>
                              {q.title}
                            </Text>
                            {q.last_result === true && <CheckCircle size={14} color="#059669" />}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* SubTab 3: Questions */}
          {subTab === 'questions' && (
            <View style={styles.sectionArea}>
              {directQuestionsList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Star size={36} color="#cbd5e1" />
                  <Text style={styles.emptyCardTitle}>No Direct Questions</Text>
                  <Text style={styles.emptyCardSub}>
                    No individual practice questions for this group at this moment.
                  </Text>
                </View>
              ) : (
                directQuestionsList.map((q) => (
                  <View key={q.id} style={styles.questionCard}>
                    <View style={styles.qTopRow}>
                      <Text style={styles.qCardTitle}>{q.title}</Text>
                      <View
                        style={[
                          styles.diffBadge,
                          {
                            backgroundColor:
                              q.difficulty === 'easy'
                                ? '#ecfdf5'
                                : q.difficulty === 'medium'
                                ? '#fffbeb'
                                : '#fef2f2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffText,
                            {
                              color:
                                q.difficulty === 'easy'
                                  ? '#047857'
                                  : q.difficulty === 'medium'
                                  ? '#b45309'
                                  : '#b91c1c',
                            },
                          ]}
                        >
                          {q.difficulty?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.qCardDesc} numberOfLines={2}>
                      {q.description}
                    </Text>

                    <View style={styles.qBottomRow}>
                      <Text style={styles.qMeta}>
                        {q.points || 10} pts • {q.category || 'General'}
                        {q.my_attempts > 0 ? ` • ${q.my_attempts} attempts` : ''}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {q.last_result === true && <CheckCircle size={16} color="#059669" />}
                        <TouchableOpacity
                          style={styles.attemptBtn}
                          onPress={() => {
                            setActiveQuestion(q);
                            setQAnswer('');
                            setQResult(null);
                          }}
                        >
                          <Text style={styles.attemptBtnText}>
                            {q.my_attempts > 0 ? 'Retry' : 'Attempt'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* SubTab 4: Expired */}
          {subTab === 'expired' && (
            <View style={styles.sectionArea}>
              <View style={styles.expiredToggleRow}>
                <TouchableOpacity
                  style={[styles.expiredToggleBtn, expiredSubTab === 'questions' && styles.activeExpiredToggle]}
                  onPress={() => setExpiredSubTab('questions')}
                >
                  <Text style={[styles.expiredToggleText, expiredSubTab === 'questions' && styles.activeExpiredToggleText]}>
                    Questions ({expiredQuestionsList.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.expiredToggleBtn, expiredSubTab === 'assignments' && styles.activeExpiredToggle]}
                  onPress={() => setExpiredSubTab('assignments')}
                >
                  <Text style={[styles.expiredToggleText, expiredSubTab === 'assignments' && styles.activeExpiredToggleText]}>
                    Assignments ({expiredAssignmentsList.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {expiredSubTab === 'questions' ? (
                expiredQuestionsList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Clock size={36} color="#cbd5e1" />
                    <Text style={styles.emptyCardTitle}>No Expired Questions</Text>
                  </View>
                ) : (
                  expiredQuestionsList.map((q) => (
                    <View key={q.id} style={[styles.questionCard, { opacity: 0.85 }]}>
                      <View style={styles.qTopRow}>
                        <Text style={styles.qCardTitle}>{q.title}</Text>
                        <View style={[styles.diffBadge, { backgroundColor: '#f1f5f9' }]}>
                          <Text style={[styles.diffText, { color: '#64748b' }]}>EXPIRED</Text>
                        </View>
                      </View>
                      <Text style={styles.qCardDesc} numberOfLines={2}>{q.description}</Text>
                      <View style={styles.qBottomRow}>
                        <Text style={styles.qMeta}>{q.points || 10} pts</Text>
                        <TouchableOpacity
                          style={[styles.attemptBtn, { backgroundColor: '#e2e8f0' }]}
                          onPress={() => {
                            setActiveQuestion(q);
                            setQAnswer('');
                            setQResult(null);
                          }}
                        >
                          <Text style={[styles.attemptBtnText, { color: '#475569' }]}>Review</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )
              ) : (
                expiredAssignmentsList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Clock size={36} color="#cbd5e1" />
                    <Text style={styles.emptyCardTitle}>No Expired Assignments</Text>
                  </View>
                ) : (
                  expiredAssignmentsList.map((aid) => {
                    const assignmentQs = questions.filter(q => q.assignment_id === aid);
                    const aName = assignmentQs[0]?.assignment_name || 'Assignment';
                    return (
                      <View key={aid as string} style={[styles.assignmentCard, { opacity: 0.85 }]}>
                        <View style={styles.assignmentHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.assignmentTitle}>{aName}</Text>
                            <Text style={styles.assignmentMeta}>{assignmentQs.length} questions • Expired</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.testBtn, { backgroundColor: '#e2e8f0' }]}
                            onPress={() => {
                              setActiveAssignment({ id: aid, name: aName, questions: assignmentQs, isExpired: true });
                              setTestAnswers({});
                              setTestSubmitted(false);
                            }}
                          >
                            <Text style={[styles.testBtnText, { color: '#475569' }]}>Review</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )
              )}
            </View>
          )}

          {/* SubTab 5: Announcements */}
          {subTab === 'announcements' && (
            <View style={styles.sectionArea}>
              {announcements.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Megaphone size={36} color="#cbd5e1" />
                  <Text style={styles.emptyCardTitle}>No Announcements</Text>
                  <Text style={styles.emptyCardSub}>No notices have been published to this group yet.</Text>
                </View>
              ) : (
                announcements.map((a) => (
                  <View key={a.id} style={styles.announcementCard}>
                    <View style={styles.annHeader}>
                      <Text style={styles.annTitle}>{a.title}</Text>
                      <Text style={styles.annMeta}>
                        By {a.author || 'Instructor'} ({a.author_role || 'Mentor'}) •{' '}
                        {new Date(a.created_at || Date.now()).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.annContent}>{a.content}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* SubTab 6: Ranking */}
          {subTab === 'ranking' && (
            <View style={styles.sectionArea}>
              <View style={styles.card}>
                <Text style={styles.cardSectionLabel}>GROUP LEADERBOARD</Text>
                {rankings.length === 0 ? (
                  <Text style={styles.emptyNote}>
                    No candidate rankings computed yet. Solve practice problems to appear here!
                  </Text>
                ) : (
                  rankings.map((r, i) => (
                    <View
                      key={r.user_id || i}
                      style={[
                        styles.leaderRow,
                        i === 0 && styles.leaderTop1,
                        i === 1 && styles.leaderTop2,
                        i === 2 && styles.leaderTop3,
                      ]}
                    >
                      <Text style={styles.leaderRank}>#{r.rank_position || i + 1}</Text>
                      <View style={styles.leaderAvatar}>
                        <Text style={styles.leaderAvatarText}>
                          {(r.full_name?.charAt(0) || 'C').toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.leaderName}>{r.full_name}</Text>
                        <Text style={styles.leaderSub}>{r.headline || 'Candidate'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.leaderScore}>{Math.round(r.total_score || 0)}</Text>
                        {r.rank_change !== 0 && (
                          <Text
                            style={[
                              styles.rankChangeText,
                              { color: r.rank_change > 0 ? '#059669' : '#ef4444' },
                            ]}
                          >
                            {r.rank_change > 0 ? `+${r.rank_change}` : r.rank_change}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Modal: Single Question Attempt */}
        <Modal
          visible={!!activeQuestion}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActiveQuestion(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Practice Question</Text>
                <TouchableOpacity onPress={() => setActiveQuestion(null)}>
                  <X size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              {activeQuestion && (
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.qDetailBadgeRow}>
                    <View style={styles.badgeItem}>
                      <Text style={styles.badgeItemText}>{activeQuestion.difficulty?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.badgeItem}>
                      <Text style={styles.badgeItemText}>{activeQuestion.points || 10} PTS</Text>
                    </View>
                  </View>

                  <Text style={styles.qDetailTitle}>{activeQuestion.title}</Text>
                  <Text style={styles.qDetailDesc}>{activeQuestion.description}</Text>

                  {/* Options if MCQ */}
                  {activeQuestion.question_type === 'mcq' && activeQuestion.options ? (
                    <View style={{ gap: 8, marginTop: 14 }}>
                      {(typeof activeQuestion.options === 'string'
                        ? JSON.parse(activeQuestion.options)
                        : activeQuestion.options
                      ).map((opt: any) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.mcqOptionBtn,
                            qAnswer === opt.id && styles.mcqOptionBtnSelected,
                          ]}
                          onPress={() => {
                            setQAnswer(opt.id);
                            handleSingleSubmit(activeQuestion.id, opt.id);
                          }}
                          disabled={submittingQ}
                        >
                          <Text
                            style={[
                              styles.mcqOptionText,
                              qAnswer === opt.id && styles.mcqOptionTextSelected,
                            ]}
                          >
                            {opt.id?.toUpperCase()}. {opt.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={{ marginTop: 14, gap: 10 }}>
                      <TextInput
                        style={styles.textArea}
                        multiline
                        placeholder="Type your response here..."
                        placeholderTextColor="#94a3b8"
                        value={qAnswer}
                        onChangeText={setQAnswer}
                      />
                      <TouchableOpacity
                        style={styles.submitModalBtn}
                        onPress={() => handleSingleSubmit(activeQuestion.id, qAnswer)}
                        disabled={submittingQ || !qAnswer.trim()}
                      >
                        {submittingQ ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.submitModalBtnText}>Submit Response</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Result Feedback */}
                  {qResult && (
                    <View
                      style={[
                        styles.resultBox,
                        {
                          backgroundColor: qResult.is_correct ? '#ecfdf5' : '#fef2f2',
                          borderColor: qResult.is_correct ? '#a7f3d0' : '#fecaca',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultTitle,
                          { color: qResult.is_correct ? '#047857' : '#b91c1c' },
                        ]}
                      >
                        {qResult.is_correct ? '✓ Correct Answer!' : '✗ Incorrect'}
                      </Text>
                      {qResult.correct_answer && (
                        <Text style={styles.resultMeta}>
                          Correct option: {qResult.correct_answer?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal: Assignment Test */}
        <Modal
          visible={!!activeAssignment}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActiveAssignment(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{activeAssignment?.name || 'Assignment Test'}</Text>
                <TouchableOpacity onPress={() => setActiveAssignment(null)}>
                  <X size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {testSubmitted ? (
                  <View style={styles.testSuccessBox}>
                    <Award size={50} color="#059669" />
                    <Text style={styles.testSuccessTitle}>Test Submitted!</Text>
                    {testResult && (
                      <View style={styles.testScoreBadge}>
                        <Text style={styles.testScoreNum}>{testResult.totalScore || 0}</Text>
                        <Text style={styles.testScoreLabel}>Total Points Earned</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.closeTestBtn}
                      onPress={() => setActiveAssignment(null)}
                    >
                      <Text style={styles.closeTestBtnText}>Back to Group</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 16 }}>
                    {activeAssignment?.questions.map((q: any, qIdx: number) => (
                      <View key={q.id} style={styles.testQuestionBox}>
                        <Text style={styles.testQuestionNumber}>Question {qIdx + 1}</Text>
                        <Text style={styles.testQuestionTitle}>{q.title}</Text>
                        <Text style={styles.testQuestionDesc}>{q.description}</Text>

                        {q.question_type === 'mcq' && q.options ? (
                          <View style={{ gap: 6, marginTop: 10 }}>
                            {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: any) => {
                              const isSelected = testAnswers[q.id] === opt.id;
                              return (
                                <TouchableOpacity
                                  key={opt.id}
                                  style={[styles.mcqOptionBtn, isSelected && styles.mcqOptionBtnSelected]}
                                  onPress={() =>
                                    setTestAnswers(prev => ({ ...prev, [q.id]: opt.id }))
                                  }
                                >
                                  <Text style={[styles.mcqOptionText, isSelected && styles.mcqOptionTextSelected]}>
                                    {opt.id?.toUpperCase()}. {opt.text}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : (
                          <TextInput
                            style={styles.textArea}
                            multiline
                            placeholder="Write your answer..."
                            placeholderTextColor="#94a3b8"
                            value={testAnswers[q.id] || ''}
                            onChangeText={txt => setTestAnswers(prev => ({ ...prev, [q.id]: txt }))}
                          />
                        )}
                      </View>
                    ))}

                    {!activeAssignment?.isExpired && (
                      <TouchableOpacity
                        style={styles.submitModalBtn}
                        onPress={handleTestSubmit}
                        disabled={submittingTest}
                      >
                        {submittingTest ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.submitModalBtnText}>Submit All Answers</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  loadingText: { fontSize: 13, color: '#64748b' },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  emptyDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  groupBarWrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  groupBar: { gap: 10 },
  groupCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 140,
  },
  activeGroupCard: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  groupCardTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  activeGroupCardTitle: { color: '#fff' },
  groupCardSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  activeGroupCardSub: { color: '#94a3b8' },
  subTabBarWrapper: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  subTabBar: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  subTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  activeSubTabItem: { backgroundColor: '#f1f5f9' },
  subTabText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  activeSubTabText: { color: '#0f172a', fontWeight: '700' },
  contentScroll: { flex: 1, padding: 16 },
  sectionArea: { gap: 12 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  groupHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  groupHeaderSub: { fontSize: 12, color: '#64748b', marginTop: 3 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLab: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardSectionLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 10 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  teacherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  teacherName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  teacherRole: { fontSize: 11, color: '#64748b' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyCardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 10 },
  emptyCardSub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assignmentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assignmentTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  assignmentMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  testBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  testBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  assignmentQuestionsList: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 },
  miniQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniQuestionTitle: { fontSize: 12, color: '#475569', flex: 1, marginRight: 8 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qCardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  diffText: { fontSize: 9, fontWeight: '800' },
  qCardDesc: { fontSize: 12, color: '#64748b', marginTop: 6 },
  qBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  qMeta: { fontSize: 11, color: '#94a3b8' },
  attemptBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  attemptBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  expiredToggleRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 3, marginBottom: 8 },
  expiredToggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  activeExpiredToggle: { backgroundColor: '#fff' },
  expiredToggleText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  activeExpiredToggleText: { color: '#0f172a', fontWeight: '700' },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  annHeader: { marginBottom: 8 },
  annTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  annMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  annContent: { fontSize: 12, color: '#475569', lineHeight: 18 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  leaderTop1: { backgroundColor: '#fffbeb', borderRadius: 10, paddingHorizontal: 8 },
  leaderTop2: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 8 },
  leaderTop3: { backgroundColor: '#fff7ed', borderRadius: 10, paddingHorizontal: 8 },
  leaderRank: { width: 26, fontSize: 13, fontWeight: '800', color: '#64748b' },
  leaderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatarText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  leaderName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  leaderSub: { fontSize: 10, color: '#94a3b8' },
  leaderScore: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  rankChangeText: { fontSize: 10, fontWeight: '700' },
  emptyNote: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', paddingVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  modalScroll: { marginTop: 14 },
  qDetailBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  badgeItem: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeItemText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  qDetailTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  qDetailDesc: { fontSize: 13, color: '#475569', lineHeight: 20 },
  mcqOptionBtn: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mcqOptionBtnSelected: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  mcqOptionText: { fontSize: 12, color: '#1e293b' },
  mcqOptionTextSelected: { fontWeight: '700', color: '#15803d' },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 100,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#0f172a',
  },
  submitModalBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitModalBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resultBox: { marginTop: 14, padding: 12, borderRadius: 10, borderWidth: 1 },
  resultTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  resultMeta: { fontSize: 11, color: '#475569' },
  testQuestionBox: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testQuestionNumber: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8 },
  testQuestionTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  testQuestionDesc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  testSuccessBox: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  testSuccessTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  testScoreBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  testScoreNum: { fontSize: 28, fontWeight: '900', color: '#b45309' },
  testScoreLabel: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  closeTestBtn: { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
  closeTestBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
